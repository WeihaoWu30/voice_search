from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.scan import Scan
from schemas.scan import ScanResponse
from core.database import get_db

router = APIRouter()

@router.get("/scans/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
   scan = db.query(Scan).filter(Scan.id == scan_id).first()
   if not scan:
      raise HTTPException(status_code=404, detail="Scan not found")
   return ScanResponse.model_validate(scan)