from fastapi import Depends, HTTPException, Header
from clerk_backend_api import Clerk
from core.config import settings

clerk = Clerk(bearer_auth=settings.clerk_secret_key)

async def get_current_user(authorization: str = Header(...)) -> str:
   token = authorization.replace("Bearer ", "")
   try:
      result = clerk.authenticate_request(token)
      return result.payload["sub"]
   except Exception:
      raise HTTPException(status_code=401, detail="Invalid or missing token")