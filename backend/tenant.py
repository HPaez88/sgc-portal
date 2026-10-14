import os
from typing import Optional

from fastapi import Depends, Header, Query

from backend.auth import datos_token_opcional

DEFAULT_ORGANISMO_ID = int(os.getenv("DEFAULT_ORGANISMO_ID", "1"))


def get_organismo_id(
    organismo_id: Optional[int] = Query(default=None),
    x_organismo_id: Optional[int] = Header(default=None, alias="X-Organismo-Id"),
    token: Optional[dict] = Depends(datos_token_opcional),
) -> int:
    """Con sesión, el organismo es el del token (no se puede falsear por header)."""
    if token and token.get("org"):
        return int(token["org"])
    return organismo_id or x_organismo_id or DEFAULT_ORGANISMO_ID
