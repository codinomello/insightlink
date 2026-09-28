"""
core/utils.py
---------------
Pequenos utilitários compartilhados entre os módulos.
"""
import uuid


def gen_uuid() -> str:
    return str(uuid.uuid4())
