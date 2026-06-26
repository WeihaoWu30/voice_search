from workers.celery_app import celery_app
from core.database import SessionLocal
from models.scan import Scan
from models.result import Result
from services.fingerprint import get_embedding
from services.similarity import cosine_similarity
from services.platforms.elevenlabs import extract_voice_id, get_preview_url, download_audio, search_voices
import asyncio

@celery_app.task
def run_url_scan(scan_id: str, url: str, audio_bytes: bytes):
   db = SessionLocal()
   try:
      scan = db.query(Scan).filter(Scan.id == scan_id).first()
      artist_embedding = get_embedding(audio_bytes)
      scan.embedding = artist_embedding.tolist()

      voice_id = extract_voice_id(url)
      preview_url = asyncio.run(get_preview_url(voice_id))
      sample_audio = asyncio.run(download_audio(preview_url))
      sample_embedding = get_embedding(sample_audio)
      similarity_score = cosine_similarity(artist_embedding, sample_embedding)

      db.add(Result(
         scan_id=scan_id,
         platform="elevenlabs",
         title=voice_id,
         url=url,
         confidence=similarity_score,
         match_found=similarity_score > 0.85
      ))
      scan.status = "done"
      db.commit()
   except Exception:
      scan.status = "failed"
      db.commit()
   finally:
      db.close()


@celery_app.task
def run_name_scan(scan_id: str, artist_name: str, audio_bytes: bytes):
   db = SessionLocal()
   try:
      scan = db.query(Scan).filter(Scan.id == scan_id).first()
      artist_embedding = get_embedding(audio_bytes)
      scan.embedding = artist_embedding.tolist()

      voices = asyncio.run(search_voices(artist_name))
      for voice in voices:
         sample_audio = asyncio.run(download_audio(voice["preview_url"]))
         sample_embedding = get_embedding(sample_audio)
         similarity_score = cosine_similarity(artist_embedding, sample_embedding)
         db.add(Result(
            scan_id=scan_id,
            platform="elevenlabs",
            title=voice["name"],
            url=voice["preview_url"],
            confidence=similarity_score,
            match_found=similarity_score > 0.85
         ))

      scan.status = "done"
      db.commit()
   except Exception:
      scan.status = "failed"
      db.commit()
   finally:
      db.close()
