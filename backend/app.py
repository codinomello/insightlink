"""
app.py
-------
InsightLink - Backend Flask (ponto de entrada)
------------------------------------------------
Monta a aplicação Flask, liga as extensões (banco de dados, JWT, CORS)
e registra os blueprints de rotas. A lógica de negócio fica nos módulos
`models/`, `services/`, `core/` e `routes/` — este arquivo só faz a
orquestração ("application factory").
"""
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from core.database import init_db
from core.security import init_jwt

from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.records_routes import records_bp
from routes.dashboard_routes import dashboard_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS liberado para a API, incluindo o header Authorization (Bearer <token>)
    # usado em toda rota autenticada.
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Authorization"],
    )

    init_db(app)
    init_jwt(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(records_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
