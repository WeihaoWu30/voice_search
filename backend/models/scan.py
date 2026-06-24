from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, String, ARRAY, Float, DateTime, Enum
from core.database import Base

class Scan(Base):
   __tablename__ = "scans"

   id = Column(String, primary_key=True, default=lambda: str(uuid4()))
   user_id = Column(String, nullable=False)
   artist_name = Column(String, nullable=False)
   embedding = Column(ARRAY(Float), nullable=True)
   status = Column(Enum("pending", "running", "done", "failed", name="scan_status"), default="pending")
   created_at = Column(DateTime, default=datetime.utcnow)