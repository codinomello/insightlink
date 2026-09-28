"""
core/security.py
-------------------
Configuração de autenticação via JWT (Flask-JWT-Extended) e decoradores
de autorização baseados em papel ("role"):

  - admin_required   -> apenas usuários com role "admin"
  - login_required   -> qualquer usuário autenticado (admin ou user)

O token carrega o "role" e o "nome" do usuário como claims extras, para
que o front-end e o próprio backend não precisem consultar o banco em
toda requisição apenas para saber a permissão.
"""
from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import jwt_manager


def init_jwt(app):
    """Liga o JWTManager à app (as configurações JWT_* já vêm de config.Config)."""
    jwt_manager.init_app(app)

    @jwt_manager.unauthorized_loader
    def _unauthorized(reason):
        return jsonify({"error": "Autenticação necessária. Faça login."}), 401

    @jwt_manager.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"error": "Sessão inválida ou expirada. Faça login novamente."}), 401

    @jwt_manager.expired_token_loader
    def _expired_token(header, payload):
        return jsonify({"error": "Sessão expirada. Faça login novamente."}), 401


def roles_required(*roles):
    """Decorador de fábrica: exige que o usuário autenticado tenha um
    dos papéis informados (ex.: @roles_required("admin"))."""

    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify({"error": "Acesso negado. Esta ação exige permissão de administrador."}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    """Exige que o usuário autenticado seja administrador."""
    return roles_required("admin")(fn)


def login_required(fn):
    """Exige apenas que exista uma sessão válida (qualquer papel)."""

    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        return fn(*args, **kwargs)

    return wrapper
