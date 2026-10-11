"""
models/activity.py
---------------------
Trilhas de auditoria da plataforma:

  - UploadLog: cada importação de planilha/PDF (quem enviou, quando,
    quantos registros entraram, sucesso ou erro).
  - LoginLog:  cada tentativa de login (sucesso ou falha), com IP e
    navegador — base para o relatório de usuários ativos e para o
    bloqueio temporário contra tentativas repetidas de senha.
"""
from datetime import datetime

from extensions import db
from core.utils import gen_uuid


class UploadLog(db.Model):
    __tablename__ = "upload_logs"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), index=True)
    username = db.Column(db.String(80))
    nome = db.Column(db.String(255))
    arquivo = db.Column(db.String(255))
    formato = db.Column(db.String(10))          # pdf | xlsx | csv ...
    tamanho_bytes = db.Column(db.Integer, default=0)
    registros_importados = db.Column(db.Integer, default=0)
    status = db.Column(db.String(10), default="sucesso", index=True)  # sucesso | erro
    mensagem = db.Column(db.String(500))
    criado_em = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "nome": self.nome,
            "arquivo": self.arquivo,
            "formato": self.formato,
            "tamanho_bytes": self.tamanho_bytes or 0,
            "registros_importados": self.registros_importados or 0,
            "status": self.status,
            "mensagem": self.mensagem,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
        }


class LoginLog(db.Model):
    __tablename__ = "login_logs"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), index=True, nullable=True)
    username = db.Column(db.String(80), index=True)
    nome = db.Column(db.String(255))
    sucesso = db.Column(db.Boolean, default=True, index=True)
    motivo = db.Column(db.String(120))
    ip = db.Column(db.String(64))
    navegador = db.Column(db.String(255))
    criado_em = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "nome": self.nome,
            "sucesso": bool(self.sucesso),
            "motivo": self.motivo,
            "ip": self.ip,
            "navegador": self.navegador,
            "criado_em": self.criado_em.isoformat() if self.criado_em else None,
        }
