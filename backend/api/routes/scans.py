from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.scan import Scan
from schemas.scan import ScanResponse, ScanCreate
from core.database import get_db
from api.routes.auth import get_current_user

router = APIRouter()

@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
   scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == user_id).first()
   if not scan:
      raise HTTPException(status_code=404, detail="Scan not found")
   return ScanResponse.model_validate(scan)

@router.get("/scans", response_model=list[ScanResponse])
def get_scans_history(db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
   scans = db.query(Scan).filter(Scan.user_id == user_id).all()
   return [ScanResponse.model_validate(scan) for scan in scans]

@router.post("/scans", response_model=ScanResponse)
def create_scan(data: ScanCreate, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
   scan = Scan(
      artist_name=data.artist_name,
      url=data.url,
      user_id=user_id
   )
   db.add(scan)
   db.commit()
   db.refresh(scan)
   return ScanResponse.model_validate(scan)