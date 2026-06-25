from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.scan import Scan
from schemas.scan import ScanResponse, ScanCreate
from core.database import get_db

router = APIRouter()

@router.get("/scans/{scan_id}")
def get_scan(scan_id: str, db: Session = Depends(get_db)):
   scan = db.query(Scan).filter(Scan.id == scan_id).first()
   if not scan:
      raise HTTPException(status_code=404, detail="Scan not found")
   return ScanResponse.model_validate(scan)

@router.get("/scans", response_model=list(ScanResponse))
def get_scans_history(db: Session = Depends(get_db)):
   scans = db.query(Scan).all()
   return [ScanResponse.model_validate(scan) for scan in scans]

@router.post("/scans/{data}")
def create_scan(data: ScanCreate, db: Session = Depends(get_db)):
   scan = Scan(
      artist_name=data.artist_name,
      url=data.url,
      user_id="temp"
   )
   db.add(scan)
   db.commit()
   db.refresh(scan)
   return ScanResponse.model_validate(scan)