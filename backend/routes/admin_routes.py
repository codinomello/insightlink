"""
routes/admin_routes.py
-------------------------
Gestão de usuários — exclusivo para administradores:
listar, criar, editar papel/status e remover usuários da plataforma.

  GET    /api/admin/users        -> lista todos os usuários
  POST   /api/admin/users        -> cria um novo usuário (admin ou user)
  PUT    /api/admin/users/<id>   -> edita nome/papel/status/senha
  DELETE /api/admin/users/<id>   -> remove um usuário
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from core.security import admin_required
from extensions import db
from models import User

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/users")
@admin_required
def list_users():
    users = User.query.order_by(User.criado_em.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.post("/users")
@admin_required
def create_user():
    data = request.get_json(silent=True) or {}
    nome = (data.get("nome") or "").strip()
    username = (data.get("username") or "").strip().lower()
    email = (data.get("email") or "").strip().lower() or None
    password = data.get("password") or ""
    role = data.get("role") or "user"

    if role not in ("admin", "user"):
        return jsonify({"error": "Papel inválido. Use 'admin' ou 'user'."}), 400
    if not nome or not username or not password:
        return jsonify({"error": "Informe nome, usuário e senha."}), 400
    if len(password) < 6:
        return jsonify({"error": "A senha deve ter ao menos 6 caracteres."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Este nome de usuário já está em uso."}), 409
    if email and User.query.filter_by(email=email).first():
        return jsonify({"error": "Este e-mail já está em uso."}), 409

    user = User(nome=nome, username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.put("/users/<user_id>")
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404

    data = request.get_json(silent=True) or {}
    is_self = user.id == get_jwt_identity()

    if is_self and data.get("role") == "user":
        return jsonify({"error": "Você não pode remover seu próprio papel de administrador."}), 400
    if is_self and "ativo" in data and not data["ativo"]:
        return jsonify({"error": "Você não pode desativar sua própria conta."}), 400

    if "nome" in data and (data["nome"] or "").strip():
        user.nome = data["nome"].strip()
    if "email" in data:
        novo_email = (data["email"] or "").strip().lower() or None
        if novo_email and User.query.filter(User.email == novo_email, User.id != user.id).first():
            return jsonify({"error": "Este e-mail já está em uso."}), 409
        user.email = novo_email
    if "role" in data and data["role"] in ("admin", "user"):
        user.role = data["role"]
    if "ativo" in data:
        user.ativo = bool(data["ativo"])
    if data.get("password"):
        if len(data["password"]) < 6:
            return jsonify({"error": "A senha deve ter ao menos 6 caracteres."}), 400
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.delete("/users/<user_id>")
@admin_required
def delete_user(user_id):
    if user_id == get_jwt_identity():
        return jsonify({"error": "Você não pode remover sua própria conta."}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado."}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"deleted": user_id})
