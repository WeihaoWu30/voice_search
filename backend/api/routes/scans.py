from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from models.scan import Scan
from schemas.scan import ScanResponse
from core.database import get_db
from api.routes.auth import get_current_user
from workers.tasks import run_url_scan, run_name_scan

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
async def create_scan(
   artist_name: str = Form(...),
   audio: UploadFile = File(...),
   url: str | None = Form(None),
   db: Session = Depends(get_db),
   user_id: str = Depends(get_current_user),
):
   audio_bytes = await audio.read()
   scan = Scan(artist_name=artist_name, url=url, user_id=user_id, status="pending")
   db.add(scan)
   db.commit()
   db.refresh(scan)

   if url:
      run_url_scan.delay(scan.id, url, audio_bytes)
   run_name_scan.delay(scan.id, artist_name, audio_bytes)

   return ScanResponse.model_validate(scan)