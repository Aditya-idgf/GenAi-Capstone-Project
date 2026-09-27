import json
import os
import shutil
from typing import List, Optional

from fastapi import FastAPI, File, Form, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, AIMessage

from database import engine, Base, get_db
import models
from rag_pipeline import process_pdf, get_rag_chain, extract_sources, llm, vector_store

# ── Bootstrap DB ──────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocuMind API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    created_at: str
    document_count: int = 0
    session_count: int = 0
    class Config: from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    project_id: int
    title: str
    created_at: str
    class Config: from_attributes = True

class QueryRequest(BaseModel):
    session_id: str
    project_id: int
    question: str
    source_count: int = 4
    filenames: Optional[List[str]] = None

class SourceResponse(BaseModel):
    number: int
    title: str
    page: int
    chunk: int
    excerpt: str
    collection: str
    pages: Optional[List[int]] = None
    excerpts: Optional[List[str]] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceResponse]
    session_id: str

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[str] = None
    class Config: from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    filename: str
    project_id: int
    collection: str
    pages: int
    chunks: int
    size_bytes: int
    uploaded_at: str
    class Config: from_attributes = True

class KnowledgeStats(BaseModel):
    documents: int
    pages: int
    chunks: int
    storage_bytes: int


# ── Helper ────────────────────────────────────────────────────────────────────

def get_project_or_404(project_id: int, db: Session) -> models.Project:
    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

def get_session_or_create(session_id: str, project_id: int, db: Session) -> models.ChatSession:
    sess = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not sess:
        sess = models.ChatSession(id=session_id, project_id=project_id, title="New Chat")
        db.add(sess)
        db.commit()
        db.refresh(sess)
    return sess


# ── Projects ──────────────────────────────────────────────────────────────────

@app.get("/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = db.query(models.Project).order_by(models.Project.created_at).all()
    result = []
    for p in rows:
        doc_count  = db.query(models.Document).filter(models.Document.project_id == p.id).count()
        sess_count = db.query(models.ChatSession).filter(models.ChatSession.project_id == p.id).count()
        result.append(ProjectResponse(
            id=p.id, name=p.name, description=p.description,
            created_at=str(p.created_at),
            document_count=doc_count, session_count=sess_count,
        ))
    return result

@app.post("/projects", response_model=ProjectResponse)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    p = models.Project(name=body.name, description=body.description)
    db.add(p)
    db.commit()
    db.refresh(p)
    return ProjectResponse(id=p.id, name=p.name, description=p.description,
                           created_at=str(p.created_at), document_count=0, session_count=0)

@app.patch("/projects/{project_id}", response_model=ProjectResponse)
def rename_project(project_id: int, body: ProjectCreate, db: Session = Depends(get_db)):
    p = get_project_or_404(project_id, db)
    p.name = body.name
    p.description = body.description
    db.commit()
    db.refresh(p)
    doc_count  = db.query(models.Document).filter(models.Document.project_id == p.id).count()
    sess_count = db.query(models.ChatSession).filter(models.ChatSession.project_id == p.id).count()
    return ProjectResponse(id=p.id, name=p.name, description=p.description,
                           created_at=str(p.created_at),
                           document_count=doc_count, session_count=sess_count)

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    p = get_project_or_404(project_id, db)
    # 1. Remove uploaded files and directory from disk safely
    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    docs = db.query(models.Document).filter(models.Document.project_id == project_id).all()
    for d in docs:
        if d.file_path and os.path.exists(d.file_path):
            try:
                os.remove(d.file_path)
            except Exception as e:
                print(f"Warning: could not remove file {d.file_path}: {e}")
    if os.path.exists(project_dir):
        try:
            shutil.rmtree(project_dir, ignore_errors=True)
        except Exception as e:
            print(f"Warning: could not remove directory {project_dir}: {e}")

    # 2. Remove all vector chunks from Chroma
    try:
        from rag_pipeline import vector_store
        vector_store._collection.delete(where={"project_id": project_id})
    except Exception as e:
        print(f"Warning: failed to delete project {project_id} from vector store: {e}")

    # 3. Explicitly delete related DB records to avoid foreign key constraints / stale rows
    try:
        sessions = db.query(models.ChatSession).filter(models.ChatSession.project_id == project_id).all()
        for s in sessions:
            db.query(models.ChatMessage).filter(models.ChatMessage.session_id == s.id).delete(synchronize_session=False)
        db.query(models.ChatSession).filter(models.ChatSession.project_id == project_id).delete(synchronize_session=False)
        db.query(models.Document).filter(models.Document.project_id == project_id).delete(synchronize_session=False)
    except Exception as e:
        print(f"Warning cleaning child records: {e}")

    db.delete(p)
    db.commit()
    return {"detail": "Deleted"}


# ── Chat Sessions ─────────────────────────────────────────────────────────────

@app.get("/projects/{project_id}/sessions", response_model=List[ChatSessionResponse])
def list_sessions(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    sessions = (
        db.query(models.ChatSession)
        .filter(models.ChatSession.project_id == project_id)
        .order_by(models.ChatSession.created_at.desc())
        .all()
    )
    return [ChatSessionResponse(id=s.id, project_id=s.project_id,
                                title=s.title, created_at=str(s.created_at))
            for s in sessions]

@app.delete("/sessions/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    # Delete associated messages first to ensure complete cleanup
    db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).delete()
    db.delete(sess)
    db.commit()
    return {"detail": "Deleted"}

@app.patch("/sessions/{session_id}/title")
def rename_session(session_id: str, body: dict, db: Session = Depends(get_db)):
    sess = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    sess.title = body.get("title", sess.title)
    db.commit()
    return {"detail": "OK"}

@app.get("/history/{session_id}", response_model=List[ChatMessageResponse])
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    return rows


# ── Query / Chat ──────────────────────────────────────────────────────────────

@app.post("/query", response_model=QueryResponse)
def query_chatbot(request: QueryRequest, db: Session = Depends(get_db)):
    get_project_or_404(request.project_id, db)
    sess = get_session_or_create(request.session_id, request.project_id, db)

    # Build chat history from DB
    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.session_id == request.session_id)
        .order_by(models.ChatMessage.created_at)
        .all()
    )
    chat_history = [
        HumanMessage(content=r.content) if r.role == "user" else AIMessage(content=r.content)
        for r in history_rows
    ]

    # Persist user message
    db.add(models.ChatMessage(session_id=request.session_id, role="user", content=request.question))
    db.commit()

    # Update session title from first message
    if sess.title == "New Chat":
        sess.title = request.question[:72]
        db.commit()

    # Run RAG chain scoped to this project across all files (or selected filenames)
    try:
        print(f"DEBUG query_chatbot: project_id={request.project_id}, filenames={request.filenames}")
        chain    = get_rag_chain(project_id=request.project_id, k=request.source_count, filenames=request.filenames)
        response = chain.invoke({"input": request.question, "chat_history": chat_history})
        answer   = response["answer"]
        sources  = extract_sources(response)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error generating response: {exc}")

    # Persist assistant message
    db.add(models.ChatMessage(
        session_id=request.session_id,
        role="assistant",
        content=answer,
        sources=json.dumps(sources),
    ))
    db.commit()

    return QueryResponse(answer=answer, sources=sources, session_id=request.session_id)


# ── Documents ─────────────────────────────────────────────────────────────────

@app.post("/projects/{project_id}/upload", response_model=DocumentResponse)
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    get_project_or_404(project_id, db)
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    project_dir = os.path.join(UPLOAD_DIR, str(project_id))
    os.makedirs(project_dir, exist_ok=True)
    dest = os.path.join(project_dir, file.filename)

    with open(dest, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    size_bytes = os.path.getsize(dest)

    # Use project name as the collection name for scoped retrieval
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    collection_name = f"project_{project_id}_{project.name}"

    try:
        stats = process_pdf(dest, project_id=project_id, collection_name=collection_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {exc}")

    doc = models.Document(
        project_id = project_id,
        filename   = file.filename,
        collection = collection_name,
        pages      = stats["pages"],
        chunks     = stats["chunks"],
        size_bytes = size_bytes,
        file_path  = dest,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentResponse(
        id=doc.id, filename=doc.filename, project_id=doc.project_id,
        collection=doc.collection, pages=doc.pages, chunks=doc.chunks,
        size_bytes=doc.size_bytes, uploaded_at=str(doc.uploaded_at),
    )

@app.get("/projects/{project_id}/documents", response_model=List[DocumentResponse])
def list_project_documents(project_id: int, db: Session = Depends(get_db)):
    get_project_or_404(project_id, db)
    docs = (
        db.query(models.Document)
        .filter(models.Document.project_id == project_id)
        .order_by(models.Document.uploaded_at.desc())
        .all()
    )
    return [DocumentResponse(id=d.id, filename=d.filename, project_id=d.project_id,
                             collection=d.collection, pages=d.pages, chunks=d.chunks,
                             size_bytes=d.size_bytes, uploaded_at=str(d.uploaded_at))
            for d in docs]

@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    # Remove chunks from vector store
    from rag_pipeline import vector_store
    try:
        # Chroma deletes by where clause
        vector_store._collection.delete(where={"$and": [{"project_id": doc.project_id}, {"filename": doc.filename}]})
    except Exception as e:
        print(f"Warning: failed to delete from vector store: {e}")

    db.delete(doc)
    db.commit()
    return {"detail": "Deleted"}

@app.get("/documents/{doc_id}/file")
def serve_document_file(doc_id: int, db: Session = Depends(get_db)):
    """Serve the actual PDF file for preview/download."""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not doc.file_path or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    import mimetypes
    media_type, _ = mimetypes.guess_type(doc.file_path)
    if not media_type:
        media_type = "application/pdf"
        
    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=doc.filename,
        content_disposition_type="inline"
    )


# ── Stats (project-scoped) ────────────────────────────────────────────────────

@app.get("/projects/{project_id}/stats", response_model=KnowledgeStats)
def get_project_stats(project_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    get_project_or_404(project_id, db)
    result = (
        db.query(
            func.count(models.Document.id).label("documents"),
            func.sum(models.Document.pages).label("pages"),
            func.sum(models.Document.chunks).label("chunks"),
            func.sum(models.Document.size_bytes).label("storage_bytes"),
        )
        .filter(models.Document.project_id == project_id)
        .one()
    )
    return KnowledgeStats(
        documents=result.documents or 0,
        pages=result.pages or 0,
        chunks=result.chunks or 0,
        storage_bytes=result.storage_bytes or 0,
    )

@app.get("/stats", response_model=KnowledgeStats)
def get_global_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    result = db.query(
        func.count(models.Document.id).label("documents"),
        func.sum(models.Document.pages).label("pages"),
        func.sum(models.Document.chunks).label("chunks"),
        func.sum(models.Document.size_bytes).label("storage_bytes"),
    ).one()
    return KnowledgeStats(
        documents=result.documents or 0,
        pages=result.pages or 0,
        chunks=result.chunks or 0,
        storage_bytes=result.storage_bytes or 0,
    )



# ── Tools ─────────────────────────────────────────────────────────────────────

class MindMapRequest(BaseModel):
    project_id: int
    filenames: Optional[List[str]] = None
    text: Optional[str] = None
    topic: Optional[str] = None

class MindMapNode(BaseModel):
    id: str
    label: str
    type: str  # 'root', 'core', 'concept', 'detail'
    description: str

class MindMapEdge(BaseModel):
    source: str
    target: str
    label: str = ""

class MindMapResponse(BaseModel):
    title: str
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]

@app.post("/tools/mindmap", response_model=MindMapResponse)
def generate_mindmap(req: MindMapRequest, db: Session = Depends(get_db)):
    get_project_or_404(req.project_id, db)

    # 1. Collect context text from selected text, or vector search
    context_text = ""
    if req.text and req.text.strip():
        context_text = req.text.strip()[:6000]
    else:
        filters = [{"project_id": req.project_id}]
        if req.filenames and len(req.filenames) > 0:
            if len(req.filenames) == 1:
                filters.append({"filename": req.filenames[0]})
            else:
                filters.append({"filename": {"$in": req.filenames}})

        filter_dict = filters[0] if len(filters) == 1 else {"$and": filters}
        search_query = req.topic or "main concepts key principles architecture overview summary"
        try:
            chunks = vector_store.similarity_search(search_query, k=8, filter=filter_dict)
            context_text = "\n\n".join([c.page_content for c in chunks])[:6000]
        except Exception as e:
            print(f"Error querying vector store for mind map: {e}")
            context_text = ""

    if not context_text:
        docs = db.query(models.Document).filter(models.Document.project_id == req.project_id).all()
        if docs:
            context_text = "Project Documents: " + ", ".join([d.filename for d in docs])
        else:
            context_text = "General Document Mind Map"

    # 2. Invoke LLM to generate structured graph JSON
    system_prompt = (
        "You are an expert knowledge graph architect. Analyze the provided document context and extract an interconnected concept mind map in JSON format.\n\n"
        "STRICT JSON RULES:\n"
        "1. Return ONLY valid raw JSON. Do NOT wrap in markdown fences (no ```json). Do NOT add conversational text.\n"
        "2. Structure:\n"
        "{\n"
        '  "title": "Central Subject Name",\n'
        '  "nodes": [\n'
        '    {"id": "1", "label": "Central Subject", "type": "root", "description": "Overarching theme of the document"},\n'
        '    {"id": "2", "label": "Key Pillar 1", "type": "core", "description": "Major structural section"},\n'
        '    {"id": "3", "label": "Concept A", "type": "concept", "description": "Important mechanism or topic"},\n'
        '    {"id": "4", "label": "Detail B", "type": "detail", "description": "Specific attribute, method, or result"}\n'
        '  ],\n'
        '  "edges": [\n'
        '    {"source": "1", "target": "2", "label": "branches into"},\n'
        '    {"source": "2", "target": "3", "label": "implements"}\n'
        '  ]\n'
        "}\n\n"
        "GRAPH CONSTRAINTS:\n"
        "- Exactly 1 'root' node.\n"
        "- 3 to 5 'core' nodes directly connected to 'root'.\n"
        "- 6 to 10 'concept' or 'detail' nodes connected to core nodes or interrelated.\n"
        "- Labels must be concise (1-4 words).\n"
        "- Descriptions must be 1-2 informative sentences.\n"
        "- Keep edge labels short (e.g. 'requires', 'uses', 'defines', 'produces')."
    )

    try:
        response = llm.invoke([
            HumanMessage(content=f"{system_prompt}\n\nDOCUMENT CONTEXT:\n{context_text}")
        ])
        raw = response.content.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()

        data = json.loads(raw)
        return MindMapResponse(
            title=data.get("title", "Interactive Knowledge Graph"),
            nodes=[MindMapNode(**n) for n in data.get("nodes", [])],
            edges=[MindMapEdge(**e) for e in data.get("edges", [])],
        )
    except Exception as exc:
        print(f"Mind map generation error: {exc}. Using robust fallback.")
        return MindMapResponse(
            title="Knowledge Graph",
            nodes=[
                MindMapNode(id="1", label="Core Document", type="root", description="Central subject matter"),
                MindMapNode(id="2", label="Key Topics", type="core", description="Primary extracted themes"),
                MindMapNode(id="3", label="Architecture", type="core", description="Structural mechanisms"),
                MindMapNode(id="4", label="Analysis", type="concept", description="Detailed examination"),
                MindMapNode(id="5", label="Outcomes", type="concept", description="Conclusions and results"),
            ],
            edges=[
                MindMapEdge(source="1", target="2", label="encompasses"),
                MindMapEdge(source="1", target="3", label="structured by"),
                MindMapEdge(source="2", target="4", label="analyzed in"),
                MindMapEdge(source="3", target="5", label="yields"),
            ],
        )


# ── Compare Tool ─────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    project_id: int
    doc_a: str
    doc_b: str
    focus: Optional[str] = None
    excerpts_a: Optional[List[str]] = None
    excerpts_b: Optional[List[str]] = None


class CompareMatrixRow(BaseModel):
    dimension: str
    doc_a_value: str
    doc_b_value: str
    takeaway: str


class CompareResponse(BaseModel):
    executive_summary: str
    doc_a_name: str
    doc_b_name: str
    matrix: List[CompareMatrixRow]
    agreements: List[str]
    divergences: List[str]


@app.post("/tools/compare", response_model=CompareResponse)
def compare_documents(req: CompareRequest, db: Session = Depends(get_db)):
    # 1. Fetch text chunks for doc_a
    context_a = ""
    if req.excerpts_a and len(req.excerpts_a) > 0:
        context_a = "\n\n".join(req.excerpts_a)[:4000]
    else:
        try:
            filter_a = {"$and": [{"project_id": req.project_id}, {"filename": req.doc_a}]}
            query_str = req.focus or "main concepts methodology architecture findings"
            chunks_a = vector_store.similarity_search(query_str, k=6, filter=filter_a)
            context_a = "\n\n".join([c.page_content for c in chunks_a])[:4000]
        except Exception as e:
            print(f"Error fetching chunks for doc_a: {e}")

    # 2. Fetch text chunks for doc_b
    context_b = ""
    if req.excerpts_b and len(req.excerpts_b) > 0:
        context_b = "\n\n".join(req.excerpts_b)[:4000]
    else:
        try:
            filter_b = {"$and": [{"project_id": req.project_id}, {"filename": req.doc_b}]}
            query_str = req.focus or "main concepts methodology architecture findings"
            chunks_b = vector_store.similarity_search(query_str, k=6, filter=filter_b)
            context_b = "\n\n".join([c.page_content for c in chunks_b])[:4000]
        except Exception as e:
            print(f"Error fetching chunks for doc_b: {e}")

    if not context_a:
        context_a = f"Document A: {req.doc_a} (General Document Content)"
    if not context_b:
        context_b = f"Document B: {req.doc_b} (General Document Content)"

    prompt = (
        "You are an expert research analyst. Compare Document A and Document B side-by-side based on the provided text.\n"
        f"Comparison Focus: {req.focus if req.focus else 'Key objectives, methodologies, findings, metrics, and limitations'}\n\n"
        f"--- DOCUMENT A ({req.doc_a}) ---\n{context_a}\n\n"
        f"--- DOCUMENT B ({req.doc_b}) ---\n{context_b}\n\n"
        "STRICT JSON OUTPUT RULES:\n"
        "1. Return ONLY a valid JSON object. No conversational prelude, no markdown backticks.\n"
        "2. Schema:\n"
        "{\n"
        '  "executive_summary": "2-3 concise sentences summarizing key contrasts and alignments.",\n'
        '  "matrix": [\n'
        '    {\n'
        '      "dimension": "Dimension Title (e.g. Scope, Methodology, Architecture, Strengths, Limitations)",\n'
        '      "doc_a_value": "Specific details for Document A",\n'
        '      "doc_b_value": "Specific details for Document B",\n'
        '      "takeaway": "Short 3-5 word summary of the contrast"\n'
        '    }\n'
        '  ],\n'
        '  "agreements": ["Point of consensus 1", "Point of consensus 2"],\n'
        '  "divergences": ["Key difference or contradiction 1", "Key difference or contradiction 2"]\n'
        "}\n"
        "Provide 4 to 6 rows in the matrix, 2 to 4 agreements, and 2 to 4 divergences."
    )

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()

        data = json.loads(raw)
        return CompareResponse(
            executive_summary=data.get("executive_summary", "Comparison generated between selected documents."),
            doc_a_name=req.doc_a,
            doc_b_name=req.doc_b,
            matrix=[CompareMatrixRow(**r) for r in data.get("matrix", [])],
            agreements=data.get("agreements", []),
            divergences=data.get("divergences", []),
        )
    except Exception as exc:
        print(f"Compare generation error: {exc}. Using fallback.")
        return CompareResponse(
            executive_summary=f"Comparison between {req.doc_a} and {req.doc_b} based on available content.",
            doc_a_name=req.doc_a,
            doc_b_name=req.doc_b,
            matrix=[
                CompareMatrixRow(dimension="Scope & Focus", doc_a_value="Primary subject focus of Doc A", doc_b_value="Complementary perspective of Doc B", takeaway="Complementary scopes"),
                CompareMatrixRow(dimension="Methodology", doc_a_value="Standard procedures and approaches", doc_b_value="Alternative or updated framework", takeaway="Different methodologies"),
                CompareMatrixRow(dimension="Key Findings", doc_a_value="Emphasizes foundational principles", doc_b_value="Emphasizes practical execution and metrics", takeaway="Theory vs practice"),
            ],
            agreements=[
                f"Both documents align on core domain objectives within {req.doc_a} and {req.doc_b}",
                "Both emphasize accuracy and contextual validation in implementation"
            ],
            divergences=[
                f"{req.doc_a} places greater focus on theoretical structure",
                f"{req.doc_b} focuses on specific implementation constraints and operational metrics"
            ],
        )


# ── Translate Tool (Hindi) ───────────────────────────────────────────────────

class GlossaryItem(BaseModel):
    source_term: str
    translated_term: str
    explanation: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "Hindi"
    preserve_technical_terms: bool = True


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str = "English"
    target_language: str = "Hindi"
    glossary: List[GlossaryItem] = []


@app.post("/tools/translate", response_model=TranslateResponse)
def translate_text(req: TranslateRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    prompt = (
        "You are an expert English-to-Hindi technical translator.\n"
        "Translate the following English passage into natural, clear, grammatically precise Hindi (हिंदी) in Devanagari script.\n\n"
        "GUIDELINES:\n"
        "1. NATURAL PROSE: Translate prose into fluent, idiomatic Hindi.\n"
        "2. PRESERVE TECHNICAL TERMS: Keep standard computer science, AI, and domain terms (e.g., RAG, Vector Database, Prompt, API, Embedding, Chunking, Cache, LLM, Pipeline, Query, Token) in English or provide phonetic Devanagari followed by English in parentheses (e.g. वेक्टर डेटाबेस (Vector Database)). Never use awkward, incomprehensible literal translations.\n"
        "3. PRESERVE FORMULAS & CODE: Keep any LaTeX expressions ($...$, $$...$$), code blocks, bullet points, numbers, and citation tags ([1], [2]) intact.\n"
        "4. Include a glossary of 3-5 key technical terms translated.\n\n"
        f"TEXT TO TRANSLATE:\n{req.text[:5000]}\n\n"
        "STRICT JSON OUTPUT RULES:\n"
        "Return ONLY a valid JSON object matching:\n"
        "{\n"
        '  "translated_text": "अनुवादित हिंदी पाठ...",\n'
        '  "glossary": [\n'
        '    {\n'
        '      "source_term": "Technical Term in English",\n'
        '      "translated_term": "हिंदी शब्द / लिप्यंतरण (English)",\n'
        '      "explanation": "संक्षिप्त विवरण"\n'
        '    }\n'
        '  ]\n'
        "}"
    )

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        raw = response.content.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()

        data = json.loads(raw)
        return TranslateResponse(
            translated_text=data.get("translated_text", ""),
            source_language="English",
            target_language=req.target_language,
            glossary=[GlossaryItem(**g) for g in data.get("glossary", [])],
        )
    except Exception as exc:
        print(f"Translation error: {exc}. Using fallback.")
        # Minimal direct fallback
        return TranslateResponse(
            translated_text="दिए गए पाठ का अनुवाद संसाधित किया जा रहा है। कृपया पुनः प्रयास करें।",
            source_language="English",
            target_language=req.target_language,
            glossary=[],
        )


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    # This allows you to run the server simply by typing `python main.py`
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
