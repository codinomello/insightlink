"""
config.py
----------
Configurações da aplicação, centralizadas e lidas de variáveis de
ambiente. Mantém `app.py` e os demais módulos livres de `os.environ`
espalhado pelo código.
"""
import os


class Config:
    # Banco de dados
    # Nota: driver psycopg2 explícito no esquema da URL (evita que versões
    # recentes do SQLAlchemy tentem resolver o driver "psycopg" v3, que não
    # é uma dependência deste projeto).
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://insightlink:insightlink@localhost:5432/insightlink",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    # Autenticação JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "insightlink-dev-secret-change-me-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", 60 * 60 * 12))

    # Cache (Redis)
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "300"))

    # Administrador padrão, criado automaticamente no primeiro start
    DEFAULT_ADMIN_USERNAME = os.environ.get("DEFAULT_ADMIN_USERNAME", "admin")
    DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD", "admin123")
    DEFAULT_ADMIN_EMAIL = os.environ.get("DEFAULT_ADMIN_EMAIL", "admin@insightlink.local")
