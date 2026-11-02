"""
app.py
-------
InsightLink — backend Flask (ponto de entrada).

Monta a aplicação ("application factory"): configuração, extensões
(banco, JWT, CORS), tratamento de erros e blueprints. A lógica fica em
`models/`, `services/`, `core/` e `routes/`.
"""
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from core.database import init_db
from core.errors import register_error_handlers
from core.security import init_jwt
from routes.activity_routes import activity_bp
from routes.admin_routes import admin_bp
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.records_routes import records_bp

BLUEPRINTS = (auth_bp, admin_bp, activity_bp, records_bp, dashboard_bp)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Authorization"],
    )

    init_db(app)
    init_jwt(app)
    register_error_handlers(app)

    for blueprint in BLUEPRINTS:
        app.register_blueprint(blueprint)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)
