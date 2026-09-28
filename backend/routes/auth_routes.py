"""
routes/auth_routes.py
------------------------
Endpoints de autenticação e da "área do usuário":

  POST /api/auth/register  -> auto-cadastro público (papel "user")
  POST /api/auth/login     -> login, retorna token JWT + dados do usuário
  GET  /api/auth/me        -> dados do usuário autenticado
  PUT  /api/auth/me        -> atualizar nome/e-mail/senha do próprio usuário
"""
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _make_token(user: User) -> str:
    return create_access_token(
        identity=user.id,
        additional_claims={"role": user.role, "nome": user.nome, "username": user.username},
    )


@auth_bp.post("/register")
def register():
    """Auto-cadastro público. Sempre cria o usuário com papel 'user' —
    apenas administradores podem promover alguém a 'admin' (via painel
    de gestão de usuários)."""
    data = request.get_json(silent=True) or {}
    nome = (data.get("nome") or "").strip()
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower() or None
    password = data.get("password") or ""

    if not nome or not username or not password:
        return jsonify({"error": "Informe nome, usuário e senha."}), 400
    if len(password) < 6:
        return jsonify({"error": "A senha deve ter ao menos 6 caracteres."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Este nome de usuário já está em uso."}), 409
    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "Este e-mail já está em uso."}), 409

    user = User(nome=nome, username=username, email=email, role="user")
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"token": _make_token(user), "user": user.to_dict()}), 201


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Usuário ou senha inválidos."}), 401
    if not user.ativo:
        return jsonify({"error": "Esta conta está desativada. Contate um administrador."}), 403

    user.ultimo_login = datetime.utcnow()
    db.session.commit()

    return jsonify({"token": _make_token(user), "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404
    return jsonify(user.to_dict())


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json(silent=True) or {}

    if "nome" in data and (data["nome"] or "").strip():
        user.nome = data["nome"].strip()

    if "email" in data:
        novo_email = (data["email"] or "").strip().lower() or None
        if novo_email and User.query.filter(User.email == novo_email, User.id != user.id).first():
            return jsonify({"error": "Este e-mail já está em uso."}), 409
        user.email = novo_email

    nova_senha = data.get("nova_senha")
    if nova_senha:
        senha_atual = data.get("senha_atual") or ""
        if not user.check_password(senha_atual):
            return jsonify({"error": "Senha atual incorreta."}), 400
        if len(nova_senha) < 6:
            return jsonify({"error": "A nova senha deve ter ao menos 6 caracteres."}), 400
        user.set_password(nova_senha)

    db.session.commit()
    return jsonify(user.to_dict())
