"""
routes/activity_routes.py
----------------------------
Relatório de atividade (somente administradores):

  GET /api/admin/activity -> usuários online/ativos, histórico de uploads
                              de planilhas e histórico de logins, com KPIs
                              e séries diárias para os gráficos.
"""
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from core.security import admin_required
from extensions import db
from models import User, UploadLog, LoginLog

activity_bp = Blueprint("activity", __name__, url_prefix="/api/admin")


def _daily_series(rows, days: int, keys: list[str]) -> list[dict]:
    """Preenche dias sem ocorrência com zero para o gráfico não ter buracos."""
    today = datetime.utcnow().date()
    by_day = {r[0]: r[1:] for r in rows}
    series = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        values = by_day.get(day, (0,) * len(keys))
        item = {"dia": day.strftime("%d/%m")}
        item.update({k: int(v or 0) for k, v in zip(keys, values)})
        series.append(item)
    return series


@activity_bp.get("/activity")
@admin_required
def activity_report():
    limit = min(int(request.args.get("limit", 100)), 500)
    now = datetime.utcnow()
    since_7d = now - timedelta(days=7)
    since_14d = now - timedelta(days=14)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    users = User.query.order_by(User.ultima_atividade.desc().nullslast()).all()
    usuarios = [u.to_dict() for u in users]

    uploads = UploadLog.query.order_by(UploadLog.criado_em.desc()).limit(limit).all()
    logins = LoginLog.query.order_by(LoginLog.criado_em.desc()).limit(limit).all()

    total_uploads = UploadLog.query.count()
    uploads_ok = UploadLog.query.filter_by(status="sucesso").count()
    registros_importados = db.session.query(func.coalesce(func.sum(UploadLog.registros_importados), 0)).scalar()

    logins_hoje = (
        db.session.query(func.count(func.distinct(LoginLog.user_id)))
        .filter(LoginLog.sucesso.is_(True), LoginLog.criado_em >= today_start)
        .scalar()
    )
    falhas_7d = LoginLog.query.filter(LoginLog.sucesso.is_(False), LoginLog.criado_em >= since_7d).count()

    uploads_por_dia = (
        db.session.query(
            func.date(UploadLog.criado_em),
            func.count(UploadLog.id),
            func.coalesce(func.sum(UploadLog.registros_importados), 0),
        )
        .filter(UploadLog.criado_em >= since_14d)
        .group_by(func.date(UploadLog.criado_em))
        .all()
    )
    logins_por_dia = (
        db.session.query(
            func.date(LoginLog.criado_em),
            func.count(func.distinct(LoginLog.user_id)),
        )
        .filter(LoginLog.sucesso.is_(True), LoginLog.criado_em >= since_14d)
        .group_by(func.date(LoginLog.criado_em))
        .all()
    )

    uploads_por_usuario = (
        db.session.query(
            UploadLog.nome,
            func.count(UploadLog.id),
            func.coalesce(func.sum(UploadLog.registros_importados), 0),
        )
        .filter(UploadLog.status == "sucesso")
        .group_by(UploadLog.nome)
        .order_by(func.count(UploadLog.id).desc())
        .limit(8)
        .all()
    )

    return jsonify({
        "resumo": {
            "usuarios_online": sum(1 for u in usuarios if u["online"]),
            "usuarios_ativos_hoje": int(logins_hoje or 0),
            "total_usuarios": len(usuarios),
            "total_uploads": total_uploads,
            "uploads_com_erro": total_uploads - uploads_ok,
            "registros_importados": int(registros_importados or 0),
            "falhas_login_7d": falhas_7d,
            "janela_online_min": User.ONLINE_WINDOW_MINUTES,
        },
        "usuarios": usuarios,
        "uploads": [u.to_dict() for u in uploads],
        "logins": [l.to_dict() for l in logins],
        "series": {
            "uploads": _daily_series(uploads_por_dia, 14, ["uploads", "registros"]),
            "logins": _daily_series(logins_por_dia, 14, ["usuarios"]),
        },
        "uploads_por_usuario": [
            {"nome": n or "—", "uploads": int(c), "registros": int(r)} for n, c, r in uploads_por_usuario
        ],
    })
