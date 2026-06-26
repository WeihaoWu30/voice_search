from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey
from core.database import Base

class Result(Base):
   __tablename__ = "scan_results"

   id = Column(String, primary_key=True, default=lambda: str(uuid4()))
   scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
   platform = Column(String, nullable=False)
   title = Column(String, nullable=False)
   url = Column(String, nullable=False)
   confidence = Column(Float, nullable=True)
   audio_s3_key = Column(String, nullable=True)
   match_found = Column(Boolean, default=True, nullable=False)
   created_at = Column(DateTime, default=datetime.utcnow)