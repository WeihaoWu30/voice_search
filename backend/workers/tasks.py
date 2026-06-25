from workers.celery_app import celery_app
from core.database import SessionLocal
from models.scan import Scan
from models.result import Result
from services.fingerprint import get_embedding
from services.similarity import cosine_similarity
from services.platforms.elevenlabs import extract_voice_id, get_preview_url, download_audio, search_voices
import asyncio

@celery_app.task
def run_url_scan(scan_id: str, url: str):
   db = SessionLocal()
   try:
      scan = db.query(Scan).filter(Scan.id == scan_id).first()
      embedding = scan.embedding
      voice_id = extract_voice_id(url)
      preview_url = asyncio.run(get_preview_url(voice_id))
      audio = asyncio.run(download_audio(preview_url))
      fingerprinted_audio = get_embedding(audio)
      similarity_score = cosine_similarity(embedding, fingerprinted_audio)
      result = Result(
         scan_id=scan_id,
         platform="elevenlabs",
         title=voice_id,
         url=url,
         confidence=similarity_score,
         match_found=similarity_score > 0.85
      )
      db.add(result)
      scan.status = "done"
      db.commit()
   finally:
      db.close()


@celery_app.task
def run_name_scan(scan_id: str, artist_name: str):
   db = SessionLocal()
   try:
      scan = db.query(Scan).filter(Scan.id == scan_id).first()
      embedding = scan.embedding
      voices = asyncio.run(search_voices(artist_name))

      for voice in voices:
         audio = asyncio.run(download_audio(voice["preview_url"]))
         fingerprinted_audio = get_embedding(audio)
         similarity_score = cosine_similarity(embedding, fingerprinted_audio)
         result = Result(
            scan_id=scan_id,
            platform="elevenlabs",
            title=voice["name"],
            url=voice["preview_url"],
            confidence=similarity_score,
            match_found=similarity_score > 0.85
         )
         db.add(result)
      
      scan.status = "done"
      db.commit()
   finally:
      db.close()

