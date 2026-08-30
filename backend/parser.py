"""
parser.py
----------
Responsável por transformar os arquivos exportados pela plataforma
ENIAC Link+ (PDF ou planilha) em registros estruturados que a aplicação
InsightLink consegue armazenar e exibir em dashboards.
"""
import re
import io
import uuid
from datetime import datetime

import pdfplumber
import pandas as pd

# Cabeçalhos (rótulos) conhecidos que aparecem nos templates do ENIAC Link+
HEADER_FIELDS = [
    ("Desafio", "titulo"),
    ("Nome do Projeto", "titulo"),
    ("Proponente", "proponente"),
    ("Mentor indicado", "mentor"),
    ("E-mail para contato", "email"),
    ("E-mail do mentor", "email_mentor"),
    ("E-mail", "email"),
    ("Telefone para contato", "telefone"),
    ("Telefone do mentor", "telefone_mentor"),
    ("Telefone", "telefone"),
    ("Empresa", "empresa"),
    ("Cargo", "cargo"),
]

# Perguntas-guia usadas nos templates para dividir o corpo do texto em seções
QUESTION_MARKERS = [
    "Qual é o objetivo principal deste desafio",
    "Qual é o objetivo principal deste projeto",
    "Em que contexto ou ambiente a solução será aplicada",
    "Quais são os requisitos técnicos e considerações de design",
    "Existem restrições de orçamento ou recursos",
    "Quais são os entregáveis esperados",
]

SECTION_KEYS = [
    "objetivo",
    "contexto_limitacoes",
    "requisitos_tecnicos",
    "restricoes",
    "entregaveis_sucesso",
]


def _clean(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text or "").strip()


def _extract_header_fields(text: str) -> dict:
    data = {}
    lines = text.split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        for label, key in HEADER_FIELDS:
            pattern = rf"^{re.escape(label)}\s*[:：]\s*(.+)$"
            m = re.match(pattern, line)
            if m and key not in data:
                data[key] = _clean(m.group(1))
                break
    return data


def _extract_sections(text: str) -> dict:
    """Divide o corpo do documento nas perguntas-guia conhecidas."""
    # Localiza a posição de cada pergunta conhecida dentro do texto
    positions = []
    for marker in QUESTION_MARKERS:
        idx = text.find(marker)
        if idx != -1:
            positions.append((idx, marker))
    positions.sort(key=lambda p: p[0])

    sections = {}
    for i, (idx, marker) in enumerate(positions):
        end = positions[i + 1][0] if i + 1 < len(positions) else len(text)
        chunk = text[idx:end]
        # Remove a própria pergunta do início do trecho
        chunk = chunk[len(marker):].strip(" ?\n")
        key_index = min(i, len(SECTION_KEYS) - 1)
        key = SECTION_KEYS[key_index]
        # Se já existe (ex: objetivo aparece com dois textos possíveis), concatena
        sections[key] = _clean(sections.get(key, "") + " " + chunk)
    return sections


def _detect_tipo(text: str) -> str:
    upper = text.upper()
    if "PROPOSTA DE DESAFIO" in upper or re.search(r"Desafio\s*:", text):
        return "Desafio"
    if "PROPOSTA DO PROJETO" in upper or "Nome do Projeto" in text:
        return "Projeto"
    return "Indefinido"


def _score_completude(record: dict) -> int:
    """Estima o quão completo está o registro (0-100), usado como KPI."""
    campos = ["titulo", "proponente", "email", "telefone", "empresa", "cargo"]
    campos += SECTION_KEYS
    preenchidos = sum(1 for c in campos if record.get(c))
    return round(100 * preenchidos / len(campos))


def parse_pdf(file_bytes: bytes, filename: str) -> dict:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text += page_text + "\n"

    header = _extract_header_fields(text)
    sections = _extract_sections(text)

    record = {
        "id": str(uuid.uuid4()),
        "origem_arquivo": filename,
        "tipo": _detect_tipo(text),
        "titulo": header.get("titulo") or filename.rsplit(".", 1)[0],
        "proponente": header.get("proponente", ""),
        "email": header.get("email", ""),
        "telefone": header.get("telefone", ""),
        "empresa": header.get("empresa", ""),
        "cargo": header.get("cargo", ""),
        "mentor": header.get("mentor", ""),
        "objetivo": sections.get("objetivo", ""),
        "contexto_limitacoes": sections.get("contexto_limitacoes", ""),
        "requisitos_tecnicos": sections.get("requisitos_tecnicos", ""),
        "restricoes": sections.get("restricoes", ""),
        "entregaveis_sucesso": sections.get("entregaveis_sucesso", ""),
        "texto_completo": _clean(text),
        "palavras": len(text.split()),
        "importado_em": datetime.utcnow().isoformat(),
    }
    record["completude"] = _score_completude(record)
    return record


# Possíveis nomes de colunas em uma planilha exportada e para qual campo mapeiam
XLSX_COLUMN_MAP = {
    "desafio": "titulo",
    "nome do projeto": "titulo",
    "nome": "titulo",
    "titulo": "titulo",
    "título": "titulo",
    "proponente": "proponente",
    "e-mail para contato": "email",
    "e-mail": "email",
    "email": "email",
    "telefone para contato": "telefone",
    "telefone": "telefone",
    "empresa": "empresa",
    "cargo": "cargo",
    "mentor indicado": "mentor",
    "status": "status",
    "tipo": "tipo",
}


def parse_xlsx(file_bytes: bytes, filename: str) -> list:
    df = pd.read_excel(io.BytesIO(file_bytes))
    df.columns = [str(c).strip().lower() for c in df.columns]

    records = []
    for _, row in df.iterrows():
        record = {
            "id": str(uuid.uuid4()),
            "origem_arquivo": filename,
            "tipo": "Indefinido",
            "titulo": "",
            "proponente": "",
            "email": "",
            "telefone": "",
            "empresa": "",
            "cargo": "",
            "mentor": "",
            "objetivo": "",
            "contexto_limitacoes": "",
            "requisitos_tecnicos": "",
            "restricoes": "",
            "entregaveis_sucesso": "",
            "texto_completo": "",
            "palavras": 0,
            "importado_em": datetime.utcnow().isoformat(),
        }
        extras = {}
        for col, val in row.items():
            key = XLSX_COLUMN_MAP.get(col)
            if pd.isna(val):
                continue
            val = str(val).strip()
            if key:
                record[key] = val
            else:
                extras[col] = val
        if not record["titulo"]:
            # usa a primeira coluna textual como título de fallback
            record["titulo"] = next(iter(extras.values()), f"Registro {row.name + 1}")
        if record["tipo"] not in ("Desafio", "Projeto"):
            record["tipo"] = "Desafio" if "desafio" in " ".join(df.columns) else "Indefinido"
        record["extras"] = extras
        record["completude"] = _score_completude(record)
        records.append(record)
    return records


# Cabeçalhos do "Relatório da Plataforma" (export CSV do ENIAC Link+) e para
# qual campo do Record cada coluna mapeia. Colunas fora deste dicionário são
# preservadas em `extras`.
CSV_COLUMN_MAP = {
    "postado": "postado",
    "tipo": "classificacao",  # "real" / "ficticia" — não confundir com Record.tipo (Desafio/Projeto)
    "empresa": "empresa",
    "responsável": "proponente",
    "responsavel": "proponente",
    "e-mail": "email",
    "email": "email",
    "nro_de_projetos": "nro_de_projetos",
    "projetos": "projetos",
    "título do desafio": "titulo",
    "titulo do desafio": "titulo",
    "descrição do desafio": "descricao",
    "descricao do desafio": "descricao",
}


def _read_csv_bytes(file_bytes: bytes) -> pd.DataFrame:
    """Decodifica e localiza a linha de cabeçalho real do CSV exportado.

    O export da plataforma vem com ';' como separador, encoding Latin-1
    (Windows-1252) e uma primeira linha de título solta antes do cabeçalho
    de colunas (ex: "RELATÓRIO DE DESAFIOS COM PROJETOS;;;;;;").
    """
    for encoding in ("utf-8-sig", "cp1252", "latin1"):
        try:
            text = file_bytes.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise ValueError("Não foi possível decodificar o arquivo CSV.")

    lines = text.splitlines()
    header_idx = 0
    for i, line in enumerate(lines[:5]):
        if "POSTADO" in line.upper():
            header_idx = i
            break

    csv_text = "\n".join(lines[header_idx:])
    return pd.read_csv(io.StringIO(csv_text), sep=";", dtype=str, keep_default_na=False, engine="python")


def parse_csv(file_bytes: bytes, filename: str) -> list:
    df = _read_csv_bytes(file_bytes)
    df.columns = [str(c).strip().lower() for c in df.columns]

    records = []
    for i, row in df.iterrows():
        mapped = {}
        extras = {}
        for col, val in row.items():
            val = (val or "").strip()
            if not val:
                continue
            key = CSV_COLUMN_MAP.get(col)
            if key:
                mapped[key] = val
            else:
                extras[col] = val

        descricao = mapped.get("descricao", "")
        sections = _extract_sections(descricao) if descricao else {}

        record = {
            "id": str(uuid.uuid4()),
            "origem_arquivo": filename,
            "tipo": "Desafio",
            "titulo": mapped.get("titulo") or f"Desafio sem título ({i + 1})",
            "proponente": mapped.get("proponente", ""),
            "email": mapped.get("email", ""),
            "telefone": "",
            "empresa": mapped.get("empresa", ""),
            "cargo": "",
            "mentor": "",
            "objetivo": sections.get("objetivo", ""),
            "contexto_limitacoes": sections.get("contexto_limitacoes", ""),
            "requisitos_tecnicos": sections.get("requisitos_tecnicos", ""),
            "restricoes": sections.get("restricoes", ""),
            "entregaveis_sucesso": sections.get("entregaveis_sucesso", ""),
            "texto_completo": _clean(descricao),
            "palavras": len(descricao.split()) if descricao else 0,
            "importado_em": datetime.utcnow().isoformat(),
        }

        if mapped.get("postado"):
            extras["postado"] = mapped["postado"]
        if mapped.get("classificacao"):
            extras["classificacao"] = mapped["classificacao"]
        if mapped.get("nro_de_projetos"):
            extras["nro_de_projetos"] = mapped["nro_de_projetos"]
        if mapped.get("projetos"):
            extras["projetos"] = mapped["projetos"]

        record["extras"] = extras
        record["completude"] = _score_completude(record)
        records.append(record)
    return records


def parse_file(filename: str, file_bytes: bytes):
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return [parse_pdf(file_bytes, filename)]
    if lower.endswith(".xlsx") or lower.endswith(".xls"):
        return parse_xlsx(file_bytes, filename)
    if lower.endswith(".csv"):
        return parse_csv(file_bytes, filename)
    raise ValueError("Formato de arquivo não suportado. Envie um PDF, uma planilha (.xlsx) ou um CSV.")
