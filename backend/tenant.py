import os
from typing import Optional

from fastapi import Header, Query


DEFAULT_ORGANISMO_ID = int(os.getenv("DEFAULT_ORGANISMO_ID", "1"))


def get_organismo_id(
    organismo_id: Optional[int] = Query(default=None),
    x_organismo_id: Optional[int] = Header(default=None, alias="X-Organismo-Id"),
) -> int:
    return organismo_id or x_organismo_id or DEFAULT_ORGANISMO_ID
