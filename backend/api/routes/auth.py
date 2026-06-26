import jwt
from fastapi import HTTPException, Header
from clerk_backend_api import Clerk
from core.config import settings

clerk = Clerk(bearer_auth=settings.clerk_secret_key)

def _get_jwks():
    response = clerk.jwks.get_jwks()
    return {key.kid: key.model_dump() for key in response.keys}

async def get_current_user(authorization: str | None = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        header = jwt.get_unverified_header(token)
        jwks = _get_jwks()
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks[header["kid"]])
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload["sub"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
