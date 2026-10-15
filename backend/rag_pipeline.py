import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder, PromptTemplate

load_dotenv()

# ── Configuration ─────────────────────────────────────────────────────────────
CHROMA_PATH     = "chroma_db"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_PROVIDER    = os.getenv("LLM_PROVIDER", "cloud")
GROQ_API_KEY    = os.getenv("GROQ_API_KEY")
LOCAL_LLM_MODEL = os.getenv("LOCAL_LLM_MODEL", "llama3")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# ── Embeddings ────────────────────────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

# ── Vector store ──────────────────────────────────────────────────────────────
vector_store = Chroma(persist_directory=CHROMA_PATH, embedding_function=embeddings)

# ── LLM ───────────────────────────────────────────────────────────────────────
if LLM_PROVIDER == "local":
    from langchain_community.chat_models import ChatOllama
    llm = ChatOllama(model=LOCAL_LLM_MODEL)
else:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env or set LLM_PROVIDER=local."
        )
    llm = ChatGroq(
        temperature=0,
        groq_api_key=GROQ_API_KEY,
        model_name=GROQ_MODEL,
    )


# ── Document ingestion ────────────────────────────────────────────────────────
def process_pdf(file_path: str, project_id: int = 1, collection_name: str = "default") -> dict:
    """Load a PDF, chunk it, embed chunks into Chroma, return stats."""
    loader   = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks   = splitter.split_documents(documents)

    filename = os.path.basename(file_path)
    # Tag every chunk with project_id, collection, filename, and 1-indexed page
    for chunk in chunks:
        chunk.metadata["project_id"] = project_id
        chunk.metadata["collection"] = collection_name
        chunk.metadata["filename"] = filename
        page_val = chunk.metadata.get("page", 0)
        chunk.metadata["page_label"] = str(page_val + 1)
        chunk.metadata["page_num"] = str(page_val + 1)

    vector_store.add_documents(chunks)

    return {
        "pages":  len(documents),
        "chunks": len(chunks),
    }


class SafeDocumentPrompt(PromptTemplate):
    """Custom document prompt that dynamically resolves the 1-indexed page number."""
    def format(self, **kwargs) -> str:
        filename = kwargs.get("filename", "Unknown Document")
        # Resolve 1-indexed page from page_label or page
        page = kwargs.get("page_label")
        if not page:
            p = kwargs.get("page", 0)
            try:
                page = str(int(p) + 1)
            except Exception:
                page = "1"
        content = kwargs.get("page_content", "")
        return f"Source Document: {filename} (Page {page})\nContent: {content}"


# ── RAG chain ─────────────────────────────────────────────────────────────────
def get_rag_chain(project_id: int = None, k: int = 4, filenames: list[str] = None, doc_manifest: list[str] = None):
    """Build and return the conversational RAG chain.

    project_id – filter retrieval across all files in this project.
    k – number of source chunks to retrieve.
    filenames – optional list of specific filenames to restrict retrieval to.
    doc_manifest – optional list of all active document filenames for domain bounding.
    """
    search_kwargs = {"k": k}
    filters = []
    if project_id is not None:
        filters.append({"project_id": project_id})
    if filenames and len(filenames) > 0:
        if len(filenames) == 1:
            filters.append({"filename": filenames[0]})
        else:
            filters.append({"filename": {"$in": filenames}})

    if len(filters) == 1:
        search_kwargs["filter"] = filters[0]
    elif len(filters) > 1:
        search_kwargs["filter"] = {"$and": filters}

    retriever = vector_store.as_retriever(search_kwargs=search_kwargs)

    # 1. History-aware question reformulation
    contextualize_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Given a chat history and the latest user question "
         "which might reference context in the chat history or introduce a brand new topic, "
         "formulate a standalone question that can be understood "
         "without the chat history. Note that the user might have switched to a different document, so prioritize the latest user question's intent. "
         "Do NOT answer the question, "
         "just reformulate it if needed and otherwise return it as is."),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_prompt
    )

    # Resolve manifest text
    active_docs = doc_manifest if doc_manifest else filenames
    manifest_info = f"Active Research Documents in Library: {', '.join(active_docs)}\n" if active_docs else ""

    # 2. Answer generation — 3-Tier Anchored Pedagogical Guardrail
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are DocuMind, an expert research assistant designed for scholars and researchers. "
         "Your primary mission is to analyze, ground, and explain insights from the uploaded research documents.\n"
         f"{manifest_info}\n"
         "CRITICAL OPERATIONAL BOUNDARIES & GUARDRAILS:\n"
         "1. OUT-OF-DOMAIN REFUSAL (TIER 1 GUARDRAIL):\n"
         "   - If the user's question asks about entities, trivia, or topics completely unrelated to the themes, domains, or contents of the provided documents (e.g., celestial bodies like Uranus, celebrities, sports, cooking recipes, general pop trivia):\n"
         "   - You MUST politely decline to answer. State clearly:\n"
         "     'Based on your provided documents, this topic is not covered in your research library. My analysis is restricted to analyzing and explaining concepts related to your uploaded sources.'\n"
         "   - Do NOT answer the out-of-domain question from general knowledge. Do NOT provide extraneous facts about the unrelated subject.\n\n"
         "2. STRICT FACTUAL GROUNDING (TIER 2 - CLAIMS & DATA):\n"
         "   - Any factual assertions regarding what the authors investigated, discovered, measured, benchmarked, or claimed MUST be strictly supported by the text in {context}.\n"
         "   - You MUST include inline citations in your text referencing the exact source document and page number! Format them strictly as [filename.pdf, Page X] (e.g. [Attention_Is_All_You_Need.pdf, Page 4]). Do NOT omit the Page number.\n"
         "   - Never invent experimental numbers, baselines, or authors' conclusions that are not present in the context.\n\n"
         "3. ANCHORED PEDAGOGICAL DEEP-DIVES (TIER 3 - CONCEPT EXPLANATION & DERIVATION):\n"
         "   - If the user asks to explain, derive, clarify, or provide analogies for concepts, equations, methods, or algorithms that ARE mentioned or utilized in the uploaded documents (e.g., explaining how Softmax works, why scaling by sqrt(d_k) mitigates vanishing gradients, how backpropagation functions in this architecture, or mathematical notation):\n"
         "   - You are ENCOURAGED to use foundational scientific/academic knowledge to provide thorough, crystal-clear conceptual explanations, derivations, and intuitive analogies.\n"
         "   - Explicitly anchor your explanation to the document by citing where the concept appears (e.g. [filename.pdf, Page X]) and clarifying how the theoretical explanation connects to the paper's mechanism.\n\n"
         "4. FORMATTING, LATEX & CITATIONS:\n"
         "   - When presenting mathematical formulas or equations, ALWAYS format them using proper LaTeX syntax enclosed in double dollar signs ($$...$$) for standalone block equations, or single dollar signs ($...$) for inline math. Never use raw square brackets without dollar delimiters.\n"
         "   - Do NOT use raw HTML tags like <br>. Use standard markdown for line breaks and formatting.\n"
         "   - Maintain an academic, professional, and rigorous tone.\n\n"
         "Context from currently selected documents:\n{context}"),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    document_prompt = SafeDocumentPrompt(input_variables=["page_content"], template="")
    qa_chain = create_stuff_documents_chain(llm, qa_prompt, document_prompt=document_prompt)

    return create_retrieval_chain(history_aware_retriever, qa_chain)


# ── Source metadata extraction ────────────────────────────────────────────────
def extract_sources(response: dict) -> list[dict]:
    """Pull metadata out of RAG response, grouping by unique document (file).

    Each unique file appears ONCE in sources, with aggregated page numbers
    (e.g., [2, 9]), and excerpts from all matching chunks in that file.
    """
    file_map = {}

    for doc in response.get("context", []):
        meta = doc.metadata
        raw_source = meta.get("source", "Unknown document")
        filename = os.path.basename(raw_source)
        page = meta.get("page", 0) + 1  # 1-indexed

        if filename not in file_map:
            file_map[filename] = {
                "title": filename,
                "pages": set(),
                "chunks_count": 0,
                "excerpts": [],
                "collection": meta.get("collection", "default"),
            }

        file_map[filename]["pages"].add(page)
        file_map[filename]["chunks_count"] += 1
        excerpt_text = doc.page_content[:300].strip()
        if excerpt_text and excerpt_text not in file_map[filename]["excerpts"]:
            file_map[filename]["excerpts"].append(excerpt_text)

    sources = []
    for counter, (filename, data) in enumerate(file_map.items(), start=1):
        sorted_pages = sorted(list(data["pages"]))
        primary_page = sorted_pages[0] if sorted_pages else 1
        sources.append({
            "number": counter,
            "title": filename,
            "page": primary_page,
            "pages": sorted_pages,
            "chunk": data["chunks_count"],
            "excerpt": data["excerpts"][0] if data["excerpts"] else "",
            "excerpts": data["excerpts"],
            "collection": data["collection"],
        })

    return sources
