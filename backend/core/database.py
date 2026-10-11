"""
core/database.py
-------------------
Inicialização do banco de dados: registra a extensão SQLAlchemy, cria
as tabelas (se não existirem) e garante que sempre exista pelo menos
um usuário administrador.
"""
from sqlalchemy import text

from extensions import db


def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        _apply_light_migrations()
        _seed_default_admin(app)


def _apply_light_migrations():
    """`create_all` cria tabelas novas, mas não adiciona colunas a tabelas
    que já existem. Aqui ficam os ajustes incrementais (idempotentes)."""
    db.session.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS ultima_atividade TIMESTAMP"))
    db.session.commit()


def _seed_default_admin(app):
    """Em uma instalação nova, cria a conta admin padrão para que seja
    possível fazer o primeiro login e então criar os demais usuários."""
    from models import User  # import tardio para evitar import circular

    if User.query.filter_by(role="admin").first():
        return

    username = app.config["DEFAULT_ADMIN_USERNAME"]
    password = app.config["DEFAULT_ADMIN_PASSWORD"]
    email = app.config["DEFAULT_ADMIN_EMAIL"]

    admin = User(nome="Administrador", username=username, email=email, role="admin")
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    print(
        f"[InsightLink] Usuário administrador padrão criado -> "
        f"usuário: '{username}' | senha: '{password}' (altere após o primeiro login)"
    )
