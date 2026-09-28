"""
models/
--------
Modelos de dados persistidos no PostgreSQL. Reexportados aqui para que
o resto da aplicação possa fazer `from models import User, Record`.
"""
from models.record import Record
from models.user import User
from core.utils import gen_uuid

__all__ = ["Record", "User", "gen_uuid"]
