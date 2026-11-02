"""Fluxos principais da API: autenticação, permissões, registros e atividade."""

# ---------------------------------------------------------------- básico

def test_health(client):
    assert client.get("/api/health").get_json() == {"status": "ok"}


def test_unknown_route_returns_json(client):
    res = client.get("/api/nao-existe")
    assert res.status_code == 404
    assert res.is_json and "error" in res.get_json()


# ---------------------------------------------------------------- login

def test_login_ok_and_wrong_password(client):
    assert client.post("/api/auth/login", json={"username": "admin", "password": "admin123"}).status_code == 200
    assert client.post("/api/auth/login", json={"username": "admin", "password": "errada"}).status_code == 401


def test_no_public_registration(client):
    res = client.post("/api/auth/register", json={"nome": "X", "username": "x", "password": "123456"})
    assert res.status_code == 404


def test_protected_routes_require_token(client):
    assert client.get("/api/projects").status_code == 401
    assert client.get("/api/dashboard/summary").status_code == 401


# ---------------------------------------------------------------- permissões

def test_only_admin_creates_users(client, make_user):
    _, user_headers, _ = make_user("user")
    res = client.post("/api/admin/users", headers=user_headers,
                      json={"nome": "N", "username": "novo", "password": "123456"})
    assert res.status_code == 403


def test_user_reads_but_cannot_write_records(client, make_user):
    _, user_headers, _ = make_user("user")
    assert client.get("/api/projects", headers=user_headers).status_code == 200
    assert client.post("/api/projects", headers=user_headers, json={"titulo": "T", "tipo": "Projeto"}).status_code == 403
    assert client.delete("/api/projects", headers=user_headers).status_code == 403


def test_demoted_or_deactivated_user_loses_access_immediately(client, admin_headers, make_user):
    uid, headers, _ = make_user("admin")
    assert client.get("/api/admin/users", headers=headers).status_code == 200
    client.put(f"/api/admin/users/{uid}", headers=admin_headers, json={"role": "user"})
    assert client.get("/api/admin/users", headers=headers).status_code == 403
    client.put(f"/api/admin/users/{uid}", headers=admin_headers, json={"ativo": False})
    assert client.get("/api/projects", headers=headers).status_code == 401


# ---------------------------------------------------------------- registros

def test_record_crud(client, admin_headers):
    created = client.post("/api/projects", headers=admin_headers, json={
        "titulo": "Projeto de teste", "tipo": "Projeto", "empresa": "Acme", "cargo": "Dev", "objetivo": "Validar o fluxo",
    })
    assert created.status_code == 201
    rid = created.get_json()["id"]

    edited = client.put(f"/api/projects/{rid}", headers=admin_headers, json={"titulo": "Editado"})
    assert edited.get_json()["titulo"] == "Editado"

    assert client.post("/api/projects", headers=admin_headers, json={"titulo": "", "tipo": "Projeto"}).status_code == 400
    assert client.post("/api/projects", headers=admin_headers, json={"titulo": "X", "tipo": "Outro"}).status_code == 400

    assert client.delete(f"/api/projects/{rid}", headers=admin_headers).status_code == 200
    assert client.delete(f"/api/projects/{rid}", headers=admin_headers).status_code == 404


def test_invalid_upload_is_logged_as_error(client, admin_headers):
    import io
    res = client.post("/api/upload", headers=admin_headers, content_type="multipart/form-data",
                      data={"file": (io.BytesIO(b"abc"), "lixo.txt")})
    assert res.status_code == 400
    uploads = client.get("/api/admin/activity", headers=admin_headers).get_json()["uploads"]
    assert any(u["arquivo"] == "lixo.txt" and u["status"] == "erro" for u in uploads)


# ---------------------------------------------------------------- atividade

def test_activity_report_is_admin_only(client, admin_headers, make_user):
    _, user_headers, _ = make_user("user")
    assert client.get("/api/admin/activity", headers=user_headers).status_code == 403
    data = client.get("/api/admin/activity", headers=admin_headers).get_json()
    assert {"resumo", "usuarios", "uploads", "logins", "series"} <= data.keys()
    assert len(data["series"]["uploads"]) == 14


def test_lockout_after_repeated_failures(client, make_user):
    _, _, username = make_user("user")
    for _ in range(5):
        assert client.post("/api/auth/login", json={"username": username, "password": "x"}).status_code == 401
    assert client.post("/api/auth/login", json={"username": username, "password": "senha123"}).status_code == 429
