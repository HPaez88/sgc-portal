"""
quitar_rol_director.py — El rol "Director" no existe en el portal (decidido por @human 2026-11-15): los usuarios que lo
tenían pasan a "Encargado" (de su dirección). Uso: docker exec sgc-app python -m backend.scripts.quitar_rol_director
"""
from sqlmodel import Session, select

from backend.database import engine
from backend.models import Usuario

if __name__ == "__main__":
    with Session(engine) as s:
        lista = s.exec(select(Usuario).where(Usuario.rol == "Director")).all()
        for u in lista:
            u.rol = "Encargado"
            s.add(u)
        s.commit()
        print(f"{len(lista)} usuario(s) pasaron de Director a Encargado:", ", ".join(u.email for u in lista))
