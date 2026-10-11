"""
core/security.py
-------------------
Autenticação via JWT (Flask-JWT-Extended), autorização por papel e
rastreio de atividade dos usuários.

  - admin_required   -> apenas usuários com papel "admin"
  - login_required   -> qualquer usuário autenticado e ativo

A cada requisição autenticada, o usuário é recarregado do banco
(`g.current_user`). Assim:
  * o papel é sempre o ATUAL (um admin rebaixado perde acesso na hora,
    sem esperar o token expirar);
  * contas desativadas ou removidas são barradas imediatamente;
  * a "última atividade" fica registrada, alimentando o relatório de
    usuários online.
"""
from datetime import datetime, timedelta
from functools import wraps

from flask import jsonify, g, request
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

from extensions import db, jwt_manager

# Rotas que nunca exigem sessão (nem validam token enviado por engano).
PUBLIC_PATHS = {"/api/health", "/api/auth/login"}

# Evita escrever no banco a cada requisição: só atualiza se passou mais que isso.
ACTIVITY_WRITE_INTERVAL = timedelta(seconds=60)


def init_jwt(app):
    """Liga o JWTManager à app e registra o rastreio de atividade."""
    jwt_manager.init_app(app)

    @jwt_manager.unauthorized_loader
    def _unauthorized(reason):
        return jsonify({"error": "Autenticação necessária. Faça login."}), 401

    @jwt_manager.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"error": "Sessão inválida. Faça login novamente."}), 401

    @jwt_manager.expired_token_loader
    def _expired_token(header, payload):
        return jsonify({"error": "Sessão expirada. Faça login novamente."}), 401

    @app.before_request
    def _load_current_user():
        g.current_user = None
        if request.method == "OPTIONS" or request.path in PUBLIC_PATHS:
            return None
        if not request.path.startswith("/api/"):
            return None

        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if not user_id:
            return None  # sem token: o decorator da rota decide (401)

        from models import User  # import tardio (evita ciclo)

        user = db.session.get(User, user_id)
        if user is None or not user.ativo:
            return jsonify({"error": "Conta indisponível. Faça login novamente."}), 401

        now = datetime.utcnow()
        if user.ultima_atividade is None or now - user.ultima_atividade > ACTIVITY_WRITE_INTERVAL:
            user.ultima_atividade = now
            db.session.commit()

        g.current_user = user
        return None


def roles_required(*roles):
    """Exige que o usuário autenticado tenha um dos papéis informados."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if user is None or user.role not in roles:
                return jsonify({"error": "Acesso negado. Esta ação exige permissão de administrador."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    """Exige que o usuário autenticado seja administrador."""
    return roles_required("admin")(fn)


def login_required(fn):
    """Exige apenas uma sessão válida (qualquer papel)."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)

    return wrapper
