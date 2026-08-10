from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from app.db.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    chapter_name = Column(String)
    bloom_factors = Column(JSONB) # Stores {remember: 5, apply: 2, etc.}
    content_json = Column(JSONB)  # Stores the massive output from Gemini
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )