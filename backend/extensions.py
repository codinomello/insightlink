"""
extensions.py
--------------
Instâncias de extensões Flask compartilhadas entre os módulos da
aplicação. Ficam isoladas aqui (em vez de dentro de app.py) para evitar
imports circulares entre models/, routes/ e app.py.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt_manager = JWTManager()
