"""
routes/records_routes.py
---------------------------
Endpoints de dados (desafios/projetos):

  POST   /api/upload            -> importa um arquivo PDF/XLSX (admin)
  GET    /api/projects          -> lista registros (qualquer usuário)
  POST   /api/projects          -> cria um registro manualmente (admin)
  PUT    /api/projects/<id>     -> edita um registro (admin)
  DELETE /api/projects/<id>     -> remove um registro (admin)
  DELETE /api/projects          -> remove todos os registros (admin)
"""
from flask import Blueprint, request, jsonify

from extensions import db
from models import Record, gen_uuid
from core.security import admin_required, login_required
from core.cache import cache_invalidate_all
from services.file_parser import parse_file, _score_completude

records_bp = Blueprint("records", __name__, url_prefix="/api")

# Campos de um Record que podem ser preenchidos manualmente pela área
# administrativa (criação/edição de registro sem upload de arquivo).
EDITABLE_RECORD_FIELDS = [
    "tipo", "titulo", "proponente", "email", "telefone", "empresa",
    "cargo", "mentor", "objetivo", "contexto_limitacoes",
    "requisitos_tecnicos", "restricoes", "entregaveis_sucesso",
]


def _recalculate_texto_e_completude(payload: dict) -> None:
    texto_completo = " ".join(
        (payload.get(k) or "") for k in
        ["objetivo", "contexto_limitacoes", "requisitos_tecnicos", "restricoes", "entregaveis_sucesso"]
    ).strip()
    payload["texto_completo"] = texto_completo
    payload["palavras"] = len(texto_completo.split()) if texto_completo else 0
    payload["completude"] = _score_completude(payload)


@records_bp.post("/upload")
@admin_required
def upload():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado. Use o campo 'file'."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nome de arquivo vazio."}), 400

    try:
        parsed = parse_file(file.filename, file.read())
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Falha ao processar o arquivo: {e}"}), 500

    novos = [Record.from_parsed(r) for r in parsed]
    db.session.bulk_save_objects(novos)
    db.session.commit()
    cache_invalidate_all()

    return jsonify({"imported": len(parsed), "records": parsed}), 201


@records_bp.get("/projects")
@login_required
def list_projects():
    tipo = request.args.get("tipo")
    empresa = request.args.get("empresa")
    cargo = request.args.get("cargo")
    q = request.args.get("q", "").strip().lower()

    query = Record.query
    if tipo:
        query = query.filter(Record.tipo == tipo)
    if empresa:
        query = query.filter(Record.empresa == empresa)
    if cargo:
        query = query.filter(Record.cargo == cargo)

    results = query.order_by(Record.importado_em.desc()).all()
    dicts = [r.to_dict() for r in results]

    if q:
        dicts = [
            r for r in dicts
            if q in f"{r.get('titulo','')} {r.get('proponente','')} {r.get('empresa','')}".lower()
        ]
    return jsonify(dicts)


@records_bp.post("/projects")
@admin_required
def create_project():
    """Cria um registro manualmente (sem upload de arquivo), disponível
    apenas para administradores na área de gestão de dados."""
    data = request.get_json(silent=True) or {}

    titulo = (data.get("titulo") or "").strip()
    tipo = (data.get("tipo") or "").strip()
    if not titulo:
        return jsonify({"error": "O título é obrigatório."}), 400
    if tipo not in ("Desafio", "Projeto"):
        return jsonify({"error": "O tipo deve ser 'Desafio' ou 'Projeto'."}), 400

    payload = {field: (data.get(field) or "") for field in EDITABLE_RECORD_FIELDS}
    payload["titulo"] = titulo
    payload["tipo"] = tipo
    payload["id"] = gen_uuid()
    payload["origem_arquivo"] = "Cadastro manual"
    _recalculate_texto_e_completude(payload)
    payload["extras"] = {}

    record = Record.from_parsed(payload)
    db.session.add(record)
    db.session.commit()
    cache_invalidate_all()
    return jsonify(record.to_dict()), 201


@records_bp.put("/projects/<record_id>")
@admin_required
def update_project(record_id):
    """Edita um registro existente. Disponível apenas para administradores."""
    record = Record.query.get(record_id)
    if not record:
        return jsonify({"error": "Registro não encontrado."}), 404

    data = request.get_json(silent=True) or {}

    if "titulo" in data and not (data["titulo"] or "").strip():
        return jsonify({"error": "O título não pode ficar vazio."}), 400
    if "tipo" in data and data["tipo"] not in ("Desafio", "Projeto"):
        return jsonify({"error": "O tipo deve ser 'Desafio' ou 'Projeto'."}), 400

    for field in EDITABLE_RECORD_FIELDS:
        if field in data:
            setattr(record, field, (data[field] or "").strip() if isinstance(data[field], str) else data[field])

    payload = record.to_dict()
    _recalculate_texto_e_completude(payload)
    record.texto_completo = payload["texto_completo"]
    record.palavras = payload["palavras"]
    record.completude = payload["completude"]

    db.session.commit()
    cache_invalidate_all()
    return jsonify(record.to_dict())


@records_bp.delete("/projects/<record_id>")
@admin_required
def delete_project(record_id):
    record = Record.query.get(record_id)
    if not record:
        return jsonify({"error": "Registro não encontrado."}), 404
    db.session.delete(record)
    db.session.commit()
    cache_invalidate_all()
    return jsonify({"deleted": record_id})


@records_bp.delete("/projects")
@admin_required
def clear_projects():
    Record.query.delete()
    db.session.commit()
    cache_invalidate_all()
    return jsonify({"cleared": True})
