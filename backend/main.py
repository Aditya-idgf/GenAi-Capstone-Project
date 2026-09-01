from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import os
import shutil
from langchain_core.messages import HumanMessage, AIMessage

from database import engine, Base, get_db
import models
from rag_pipeline import process_pdf, get_rag_chain

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Intelligent RAG Chatbot API")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, specify your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class QueryRequest(BaseModel):
    session_id: str
    question: str


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    
    class Config:
        orm_mode = True


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        num_chunks = process_pdf(file_path)
        return {"filename": file.filename, "message": "Successfully processed and embedded.", "chunks": num_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/query")
def query_chatbot(request: QueryRequest, db: Session = Depends(get_db)):
    # 1. Fetch chat history for this session from DB
    history_records = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == request.session_id
    ).order_by(models.ChatMessage.created_at).all()
    
    chat_history = []
    for record in history_records:
        if record.role == "user":
            chat_history.append(HumanMessage(content=record.content))
        elif record.role == "assistant":
            chat_history.append(AIMessage(content=record.content))

    # 2. Save user question to DB
    user_msg = models.ChatMessage(session_id=request.session_id, role="user", content=request.question)
    db.add(user_msg)
    db.commit()
    
    # 3. Get RAG chain and invoke
    try:
        rag_chain = get_rag_chain()
        response = rag_chain.invoke({
            "input": request.question,
            "chat_history": chat_history
        })
        answer = response["answer"]
        
        # 4. Save assistant answer to DB
        assistant_msg = models.ChatMessage(session_id=request.session_id, role="assistant", content=answer)
        db.add(assistant_msg)
        db.commit()
        
        return {"answer": answer}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@app.get("/history/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    records = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.created_at).all()
    return records
