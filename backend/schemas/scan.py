from pydantic import BaseModel
from datetime import datetime
from schemas.result import ResultResponse

class ScanResponse(BaseModel):
   id: str
   artist_name: str
   status: str
   created_at: datetime
   results: list[ResultResponse] = []

   model_config = {"from_attributes": True}