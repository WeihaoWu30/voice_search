from pydantic import BaseModel
from datetime import datetime

class ScanCreate(BaseModel):
   artist_name: str
   url: str | None = None

class ScanResponse(BaseModel):
   id: str
   artist_name: str
   status: str
   created_at: datetime

   model_config = {"from_attributes": True}