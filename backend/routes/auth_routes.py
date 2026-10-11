"""
routes/auth_routes.py
------------------------
Autenticação e "área do usuário":

  POST /api/auth/login   -> login (retorna token JWT + dados do usuário)
  GET  /api/auth/me      -> dados do usuário autenticado
  PUT  /api/auth/me      -> atualizar nome/e-mail/senha do próprio usuário

Não existe cadastro público: contas só são criadas por administradores
(POST /api/admin/users).
"""
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, jwt_required

from extensions import db
from models import User, LoginLog

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Proteção contra tentativas repetidas de senha
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW = timedelta(minutes=10)


def _client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    return (forwarded.split(",")[0].strip() or request.remote_addr or "")[:64]


def _log_login(username, user, sucesso, motivo=None):
    db.session.add(LoginLog(
        user_id=user.id if user else None,
        username=(username or "")[:80],
        nome=user.nome if user else None,
        sucesso=sucesso,
        motivo=motivo,
        ip=_client_ip(),
        navegador=(request.headers.get("User-Agent") or "")[:255],
    ))
    db.session.commit()


def _too_many_failures(username: str) -> bool:
    since = datetime.utcnow() - LOCKOUT_WINDOW
    last_success = (
        LoginLog.query.filter(LoginLog.username == username, LoginLog.sucesso.is_(True))
        .order_by(LoginLog.criado_em.desc()).first()
    )
    query = LoginLog.query.filter(
        LoginLog.username == username,
        LoginLog.sucesso.is_(False),
        LoginLog.criado_em >= since,
    )
    if last_success and last_success.criado_em >= since:
        query = query.filter(LoginLog.criado_em > last_success.criado_em)
    return query.count() >= MAX_FAILED_ATTEMPTS


def _make_token(user: User) -> str:
    return create_access_token(
        identity=user.id,
        additional_claims={"role": user.role, "nome": user.nome, "username": user.username},
    )


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Informe usuário e senha."}), 400

    if _too_many_failures(username):
        return jsonify({
            "error": "Muitas tentativas incorretas. Aguarde alguns minutos e tente novamente."
        }), 429

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        _log_login(username, user, False, "Usuário ou senha inválidos")
        return jsonify({"error": "Usuário ou senha inválidos."}), 401
    if not user.ativo:
        _log_login(username, user, False, "Conta desativada")
        return jsonify({"error": "Esta conta está desativada. Contate um administrador."}), 403

    now = datetime.utcnow()
    user.ultimo_login = now
    user.ultima_atividade = now
    db.session.commit()
    _log_login(username, user, True)

    return jsonify({"token": _make_token(user), "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify(g.current_user.to_dict())


@auth_bp.put("/me")
@jwt_required()
def update_me():
    user = g.current_user
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
