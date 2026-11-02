"""
Fixtures dos testes. Usam um banco PostgreSQL PRÓPRIO (`insightlink_test`),
criado automaticamente — os dados de desenvolvimento não são tocados.

  TEST_DATABASE_URL  (padrão: postgresql+psycopg2://insightlink:insightlink@localhost:5432/insightlink_test)
Sem PostgreSQL acessível, os testes são pulados.
"""
import os
import uuid

import psycopg2
import pytest
from sqlalchemy.engine import make_url

TEST_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://insightlink:insightlink@localhost:5432/insightlink_test",
)
os.environ["DATABASE_URL"] = TEST_URL
os.environ.setdefault("JWT_SECRET_KEY", "k" * 48)


def _ensure_database() -> None:
    url = make_url(TEST_URL)
    conn = psycopg2.connect(host=url.host, port=url.port, user=url.username,
                            password=url.password, dbname="postgres", connect_timeout=3)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (url.database,))
        if not cur.fetchone():
            cur.execute(f'CREATE DATABASE "{url.database}"')
    conn.close()


@pytest.fixture(scope="session")
def app():
    try:
        _ensure_database()
    except Exception as exc:  # sem Postgres: não há como testar a API
        pytest.skip(f"PostgreSQL indisponível para os testes: {exc}", allow_module_level=True)

    from app import create_app
    from extensions import db

    flask_app = create_app()
    with flask_app.app_context():
        db.drop_all()
        db.create_all()
        from core.database import _seed_default_admin
        _seed_default_admin(flask_app)
    return flask_app


@pytest.fixture()
def client(app):
    return app.test_client()


def _login(client, username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200, res.get_json()
    return res.get_json()["token"]


@pytest.fixture()
def admin_headers(client):
    return {"Authorization": f"Bearer {_login(client, 'admin', 'admin123')}"}


@pytest.fixture()
def make_user(client, admin_headers):
    """Cria um usuário (via API admin) e devolve (id, headers) já autenticado."""
    def _make(role="user"):
        username = f"{role}_{uuid.uuid4().hex[:8]}"
        res = client.post("/api/admin/users", headers=admin_headers,
                          json={"nome": f"Teste {username}", "username": username, "password": "senha123", "role": role})
        assert res.status_code == 201, res.get_json()
        return res.get_json()["id"], {"Authorization": f"Bearer {_login(client, username, 'senha123')}"}, username

    return _make
