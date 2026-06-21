#!/usr/bin/env python3
"""Gera o Diagrama Entidade-Relacionamento (DER) da Clínica Médica DELT
em SVG, com notação "pé-de-galinha" (Crow's Foot).

Uso:
    python docs/gerar_der.py            # escreve docs/der.svg

O SVG é autossuficiente (sem fontes/recursos externos) e pode ser
convertido para PNG/PDF com o LibreOffice:
    soffice --headless --convert-to png docs/der.svg
"""
from __future__ import annotations

import math
from pathlib import Path

ROW_H = 24
HEADER_H = 28
WIDTH = 210

# nome -> (x, y, [(coluna, tag)])  tag em {"PK", "FK", "PK·FK", ""}
ENTIDADES = {
    "ESPECIALIDADE": (60, 30, [
        ("especialidadeID", "PK"), ("nome", "")]),
    "PROFISSIONAL": (60, 210, [
        ("profissionalID", "PK"), ("nome", ""), ("crm", ""),
        ("celular", ""), ("especialidadeID", "FK")]),
    "TURNO": (60, 470, [
        ("turnoNome", "PK"), ("horarioInicio", ""), ("horarioFim", "")]),
    "DISPONIBILIDADE": (370, 450, [
        ("disponibilidadeID", "PK"), ("dia", ""),
        ("turnoNome", "FK"), ("profissionalID", "FK")]),
    "CONSULTA": (640, 250, [
        ("consultaID", "PK"), ("data", ""), ("horario", ""),
        ("estado", ""), ("descricao", ""), ("profissionalID", "FK"),
        ("pacienteID", "FK"), ("salaID", "FK")]),
    "PACIENTE": (950, 60, [
        ("pacienteID", "PK"), ("nome", ""), ("cpf", ""),
        ("email", ""), ("celular", "")]),
    "SALA": (950, 400, [
        ("salaID", "PK"), ("nome", "")]),
}

# (parent_one, child_many, [pontos polyline], direção-no-filho, rótulo, rótulo_xy)
LIGACOES = [
    ("ESPECIALIDADE", "PROFISSIONAL",
     [(165, 106), (165, 210)], (0, 1), "possui", (175, 162)),
    ("PROFISSIONAL", "DISPONIBILIDADE",
     [(165, 358), (165, 410), (475, 410), (475, 450)], (0, 1), "pertence", (300, 402)),
    ("TURNO", "DISPONIBILIDADE",
     [(270, 516), (320, 516), (320, 512), (370, 512)], (1, 0), "possui", (300, 506)),
    ("PROFISSIONAL", "CONSULTA",
     [(270, 270), (560, 270), (560, 300), (640, 300)], (1, 0), "pertence", (470, 263)),
    ("PACIENTE", "CONSULTA",
     [(950, 134), (915, 134), (915, 300), (850, 300)], (-1, 0), "possui", (864, 250)),
    ("SALA", "CONSULTA",
     [(950, 438), (915, 438), (915, 400), (850, 400)], (-1, 0), "acontece em", (866, 360)),
]

CABECALHO = "#2c5f8a"
LINHA = "#5b6b7b"
TEXTO = "#1b2b3a"
TAG = "#9a3b2e"


def altura(ent):
    return HEADER_H + ROW_H * len(ENTIDADES[ent][2])


def caixa(nome):
    x, y, cols = ENTIDADES[nome]
    h = HEADER_H + ROW_H * len(cols)
    s = [f'<g>']
    s.append(f'<rect x="{x}" y="{y}" width="{WIDTH}" height="{h}" rx="6" '
             f'fill="white" stroke="{CABECALHO}" stroke-width="1.5"/>')
    s.append(f'<rect x="{x}" y="{y}" width="{WIDTH}" height="{HEADER_H}" rx="6" '
             f'fill="{CABECALHO}"/>')
    s.append(f'<rect x="{x}" y="{y+HEADER_H-6}" width="{WIDTH}" height="6" '
             f'fill="{CABECALHO}"/>')
    s.append(f'<text x="{x+WIDTH/2}" y="{y+19}" text-anchor="middle" '
             f'fill="white" font-size="14" font-weight="bold" '
             f'font-family="DejaVu Sans, Arial, sans-serif">{nome}</text>')
    for i, (col, tag) in enumerate(cols):
        ry = y + HEADER_H + i * ROW_H
        if i:
            s.append(f'<line x1="{x}" y1="{ry}" x2="{x+WIDTH}" y2="{ry}" '
                     f'stroke="#dfe6ec" stroke-width="1"/>')
        peso = "bold" if tag == "PK" else "normal"
        deco = ' text-decoration="underline"' if tag == "PK" else ""
        s.append(f'<text x="{x+12}" y="{ry+16}" fill="{TEXTO}" font-size="12.5" '
                 f'font-weight="{peso}"{deco} '
                 f'font-family="DejaVu Sans, Arial, sans-serif">{col}</text>')
        if tag:
            s.append(f'<text x="{x+WIDTH-12}" y="{ry+16}" text-anchor="end" '
                     f'fill="{TAG}" font-size="10.5" font-weight="bold" '
                     f'font-family="DejaVu Sans, Arial, sans-serif">{tag}</text>')
    s.append('</g>')
    return "\n".join(s)


def pe_de_galinha(p, d):
    """Símbolo 'zero ou muitos' na ponta filho (p), entrando na direção d."""
    px, py = p
    dx, dy = d
    base = (px - dx * 18, py - dy * 18)
    perp = (-dy, dx)
    a = (px + perp[0] * 9, py + perp[1] * 9)
    b = (px - perp[0] * 9, py - perp[1] * 9)
    cx, cy = base[0] - dx * 6, base[1] - dy * 6
    out = []
    for q in (p, a, b):
        out.append(f'<line x1="{base[0]:.1f}" y1="{base[1]:.1f}" '
                   f'x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{LINHA}" '
                   f'stroke-width="1.6"/>')
    out.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="5" fill="white" '
               f'stroke="{LINHA}" stroke-width="1.6"/>')
    return "\n".join(out)


def traco_um(q, prox):
    """Símbolo 'um' (tracinho perpendicular) na ponta pai (q)."""
    sx, sy = prox[0] - q[0], prox[1] - q[1]
    n = math.hypot(sx, sy) or 1
    sx, sy = sx / n, sy / n
    perp = (-sy, sx)
    cx, cy = q[0] + sx * 12, q[1] + sy * 12
    a = (cx + perp[0] * 8, cy + perp[1] * 8)
    b = (cx - perp[0] * 8, cy - perp[1] * 8)
    return (f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" '
            f'y2="{b[1]:.1f}" stroke="{LINHA}" stroke-width="1.6"/>')


def ligacao(parent, child, pts, d, rotulo, rxy):
    s = []
    poly = " ".join(f"{x},{y}" for x, y in pts)
    s.append(f'<polyline points="{poly}" fill="none" stroke="{LINHA}" '
             f'stroke-width="1.6"/>')
    s.append(traco_um(pts[0], pts[1]))
    s.append(pe_de_galinha(pts[-1], d))
    mx, my = rxy
    s.append(f'<rect x="{mx-3}" y="{my-12}" width="{len(rotulo)*6.6+8}" '
             f'height="16" fill="#fbfcfe" opacity="0.9"/>')
    s.append(f'<text x="{mx+2}" y="{my}" fill="{LINHA}" font-size="12" '
             f'font-style="italic" '
             f'font-family="DejaVu Sans, Arial, sans-serif">{rotulo}</text>')
    return "\n".join(s)


def gerar():
    W, H = 1210, 600
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
           f'viewBox="0 0 {W} {H}" font-family="DejaVu Sans, Arial, sans-serif">']
    out.append(f'<rect width="{W}" height="{H}" fill="#fbfcfe"/>')
    out.append(f'<text x="{W/2}" y="24" text-anchor="middle" fill="{CABECALHO}" '
               f'font-size="16" font-weight="bold">Clínica Médica DELT — '
               f'Diagrama Entidade-Relacionamento (Crow\'s Foot)</text>')
    for lig in LIGACOES:
        out.append(ligacao(*lig))
    for nome in ENTIDADES:
        out.append(caixa(nome))
    out.append('</svg>')
    return "\n".join(out)


if __name__ == "__main__":
    destino = Path(__file__).resolve().parent / "der.svg"
    destino.write_text(gerar(), encoding="utf-8")
    print(f"DER gerado em {destino}")
