"""
core/errors.py
----------------
Tratamento de erros da API: qualquer falha em /api/* responde em JSON
({"error": "..."}), para o front-end sempre conseguir mostrar o motivo.
"""
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from extensions import db

PT_MESSAGES = {
    404: "Rota não encontrada. O backend pode estar desatualizado.",
    405: "Método não permitido para esta rota.",
    413: "Arquivo grande demais.",
}


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def _http_error(e: HTTPException):
        if request.path.startswith("/api/"):
            return jsonify({"error": PT_MESSAGES.get(e.code, e.description or e.name)}), e.code
        return e

    @app.errorhandler(Exception)
    def _unhandled_error(e: Exception):
        if isinstance(e, HTTPException):
            return _http_error(e)
        app.logger.exception("Erro não tratado em %s %s", request.method, request.path)
        db.session.rollback()
        if request.path.startswith("/api/"):
            return jsonify({"error": "Erro interno do servidor. Veja os logs do backend."}), 500
        raise e
