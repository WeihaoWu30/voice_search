from pydantic import BaseModel
from datetime import datetime

class ResultResponse(BaseModel):
   id: str
   platform: str
   title: str
   url: str
   confidence: float | None
   match_found: bool
   created_at: datetime

   model_config = {"from_attributes": True}