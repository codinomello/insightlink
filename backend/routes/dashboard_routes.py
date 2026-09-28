"""
routes/dashboard_routes.py
-----------------------------
Endpoints de indicadores, análises avançadas e relatórios:

  GET /api/dashboard/summary    -> KPIs e agregados básicos
  GET /api/dashboard/analytics  -> cruzamentos de dados (heatmap, radar, treemap...)
  GET /api/reports/pdf          -> relatório em PDF
  GET /api/reports/xlsx         -> relatório em Excel
"""
import io
from collections import Counter

from flask import Blueprint, jsonify, send_file

from models import Record
from core.security import login_required
from core.cache import cache_get, cache_set
from services.analytics import build_full_analytics
from services.reports import build_pdf_report, build_xlsx_report

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


def _all_records_as_dicts() -> list[dict]:
    return [r.to_dict() for r in Record.query.order_by(Record.importado_em.desc()).all()]


def _compute_summary() -> dict:
    records = _all_records_as_dicts()
    total = len(records)
    desafios = sum(1 for r in records if r.get("tipo") == "Desafio")
    projetos = sum(1 for r in records if r.get("tipo") == "Projeto")
    empresas = len({r.get("empresa") for r in records if r.get("empresa")})
    proponentes = len({r.get("proponente") for r in records if r.get("proponente")})
    completude_media = round(sum(r.get("completude", 0) for r in records) / total, 1) if total else 0
    palavras_media = round(sum(r.get("palavras", 0) for r in records) / total, 1) if total else 0

    por_empresa = Counter(r.get("empresa") for r in records if r.get("empresa"))
    por_cargo = Counter(r.get("cargo") for r in records if r.get("cargo"))
    por_tipo = Counter(r.get("tipo") for r in records if r.get("tipo"))

    return {
        "total": total,
        "desafios": desafios,
        "projetos": projetos,
        "empresas": empresas,
        "proponentes": proponentes,
        "completude_media": completude_media,
        "palavras_media": palavras_media,
        "por_empresa": [{"nome": k, "quantidade": v} for k, v in por_empresa.most_common(10)],
        "por_cargo": [{"nome": k, "quantidade": v} for k, v in por_cargo.most_common(10)],
        "por_tipo": [{"nome": k, "quantidade": v} for k, v in por_tipo.most_common()],
    }


@dashboard_bp.get("/dashboard/summary")
@login_required
def dashboard_summary():
    cached = cache_get("summary")
    if cached is not None:
        return jsonify(cached)
    summary = _compute_summary()
    cache_set("summary", summary)
    return jsonify(summary)


@dashboard_bp.get("/dashboard/analytics")
@login_required
def dashboard_analytics():
    """Cruzamentos de dados: heatmap empresa x cargo, correlações, radar, treemap."""
    cached = cache_get("analytics")
    if cached is not None:
        return jsonify(cached)
    records = _all_records_as_dicts()
    analytics = build_full_analytics(records)
    cache_set("analytics", analytics)
    return jsonify(analytics)


@dashboard_bp.get("/reports/pdf")
@login_required
def report_pdf():
    records = _all_records_as_dicts()
    summary = cache_get("summary") or _compute_summary()
    analytics = cache_get("analytics") or build_full_analytics(records)
    pdf_bytes = build_pdf_report(summary, analytics, records)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name="insightlink_relatorio.pdf",
    )


@dashboard_bp.get("/reports/xlsx")
@login_required
def report_xlsx():
    records = _all_records_as_dicts()
    summary = cache_get("summary") or _compute_summary()
    analytics = cache_get("analytics") or build_full_analytics(records)
    xlsx_bytes = build_xlsx_report(summary, analytics, records)
    return send_file(
        io.BytesIO(xlsx_bytes),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="insightlink_relatorio.xlsx",
    )
