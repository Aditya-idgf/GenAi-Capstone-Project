from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    sessions  = relationship("ChatSession", back_populates="project", cascade="all, delete-orphan")


class ChatSession(Base):
    """One row per conversation session (groups ChatMessages)."""
    __tablename__ = "chat_sessions"

    id         = Column(String, primary_key=True)   # UUID supplied by client
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    title      = Column(String, default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project  = relationship("Project", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role       = Column(String)           # 'user' | 'assistant'
    content    = Column(Text)
    sources    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")


class Document(Base):
    __tablename__ = "documents"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    filename    = Column(String, index=True)
    collection  = Column(String, default="default")
    pages       = Column(Integer, default=0)
    chunks      = Column(Integer, default=0)
    size_bytes  = Column(BigInteger, default=0)
    file_path   = Column(String)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="documents")
