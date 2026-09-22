import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain.chains import create_history_aware_retriever, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

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
def process_pdf(file_path: str, collection_name: str = "default") -> dict:
    """Load a PDF, chunk it, embed chunks into Chroma, return stats."""
    loader   = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks   = splitter.split_documents(documents)

    # Tag every chunk with its collection so we can filter later
    for chunk in chunks:
        chunk.metadata["collection"] = collection_name

    vector_store.add_documents(chunks)

    return {
        "pages":  len(documents),
        "chunks": len(chunks),
    }


# ── RAG chain ─────────────────────────────────────────────────────────────────
def get_rag_chain(k: int = 4):
    """Build and return the conversational RAG chain.

    k – number of source chunks to retrieve.
    """
    retriever = vector_store.as_retriever(search_kwargs={"k": k})

    # 1. History-aware question reformulation
    contextualize_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "Given a chat history and the latest user question "
         "which might reference context in the chat history, "
         "formulate a standalone question that can be understood "
         "without the chat history. Do NOT answer the question, "
         "just reformulate it if needed and otherwise return it as is."),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_prompt
    )

    # 2. Answer generation
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a knowledgeable assistant for document question-answering. "
         "Use the following retrieved context to answer the question accurately. "
         "If you don't know the answer based on the context, say so clearly. "
         "Be thorough but concise.\n\n{context}"),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    qa_chain = create_stuff_documents_chain(llm, qa_prompt)

    return create_retrieval_chain(history_aware_retriever, qa_chain)


# ── Source metadata extraction ────────────────────────────────────────────────
def extract_sources(response: dict) -> list[dict]:
    """Pull page/chunk metadata out of the RAG chain response.

    Deduplicates on (filename, page, first-200-chars-of-content) so that
    genuinely different chunks on the same page are kept, but exact repeated
    retrievals are collapsed.
    """
    sources = []
    seen    = set()
    counter = 1

    for doc in response.get("context", []):
        meta     = doc.metadata
        filename = os.path.basename(meta.get("source", "Unknown document"))
        page     = meta.get("page", 0)
        # Use first 200 chars of content as part of the dedup key
        content_key = doc.page_content[:200].strip()
        key = (filename, page, content_key)

        if key in seen:
            continue
        seen.add(key)

        sources.append({
            "number":     counter,
            "title":      filename,
            "page":       page + 1,          # 0-indexed → 1-indexed
            "chunk":      counter,
            "excerpt":    doc.page_content[:300],
            "collection": meta.get("collection", "default"),
        })
        counter += 1

    return sources
