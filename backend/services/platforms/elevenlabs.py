import httpx
from core.config import settings
from elevenlabs import ElevenLabs
import re

eleven = ElevenLabs(api_key=settings.elevenlabs_api_key)

def extract_voice_id(url: str) -> str:
    match = re.search(r"[A-Za-z0-9]{20}(?![A-Za-z0-9])", url)
    if not match:
        raise ValueError("No voice ID found in URL")
    return match.group(0)

async def get_preview_url(voice_id: str) -> str:
    voice = eleven.voices.get(
        voice_id=voice_id
    )
    return voice.preview_url

async def download_audio(preview_url: str) -> bytes:
    async with httpx.AsyncClient() as client:
        response = await client.get(preview_url)
        return response.content

async def search_voices(artist_name: str) -> list[dict]:
    result = eleven.voices.search(
        search=artist_name
    )
    return [{"voice_id": v.voice_id, "name": v.name, "preview_url": v.preview_url} for v in result.voices]
