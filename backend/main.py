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
from rag_pipeline import process_pdf, get_rag_chain, extract_sources

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
    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.filename,
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


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}
