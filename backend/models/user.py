"""
models/user.py
----------------
Usuário da plataforma. Dois papéis:
  - "admin": acesso total (importar, criar, editar, apagar registros
    e gerenciar outros usuários).
  - "user": acesso de leitura ao dashboard, gráficos e relatórios.
"""
from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from core.utils import gen_uuid


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    nome = db.Column(db.String(255), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user", index=True)
    ativo = db.Column(db.Boolean, default=True, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    ultimo_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return bool(self.password_hash) and check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "ativo": self.ativo,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
            "ultimo_login": self.ultimo_login.isoformat() if self.ultimo_login else None,
        }
