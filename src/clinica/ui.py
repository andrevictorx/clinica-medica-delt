"""Camada de apresentação no terminal: cores ANSI, tabelas e helpers de input."""
from __future__ import annotations

import os
import sys

# Habilita cores apenas quando a saída é um terminal interativo.
_USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _c(code: str) -> str:
    return code if _USE_COLOR else ""


RESET = _c("\033[0m")
BOLD = _c("\033[1m")
DIM = _c("\033[2m")
RED = _c("\033[31m")
GREEN = _c("\033[32m")
YELLOW = _c("\033[33m")
BLUE = _c("\033[34m")
CYAN = _c("\033[36m")
MAGENTA = _c("\033[35m")

# Cor por estado de consulta (usada nas listagens).
COR_ESTADO = {
    "Agendada": CYAN,
    "Realizada": GREEN,
    "Cancelada": YELLOW,
    "Faltou": RED,
}


# ---------------------------------------------------------------------
# Saída formatada
# ---------------------------------------------------------------------
def titulo(texto: str) -> None:
    linha = "═" * (len(texto) + 2)
    print(f"\n{BOLD}{BLUE}╔{linha}╗{RESET}")
    print(f"{BOLD}{BLUE}║ {texto} ║{RESET}")
    print(f"{BOLD}{BLUE}╚{linha}╝{RESET}")


def sucesso(msg: str) -> None:
    print(f"{GREEN}✔ {msg}{RESET}")


def erro(msg: str) -> None:
    print(f"{RED}✘ {msg}{RESET}")


def aviso(msg: str) -> None:
    print(f"{YELLOW}➜ {msg}{RESET}")


def info(msg: str) -> None:
    print(f"{DIM}{msg}{RESET}")


def estado_colorido(estado: str) -> str:
    cor = COR_ESTADO.get(estado, "")
    return f"{cor}{estado}{RESET}"


def tabela(cabecalhos: list[str], linhas: list[list[str]]) -> None:
    """Imprime uma tabela ASCII simples com larguras automáticas."""
    if not linhas:
        info("(sem registros)")
        return
    larguras = [len(h) for h in cabecalhos]
    for linha in linhas:
        for i, cel in enumerate(linha):
            larguras[i] = max(larguras[i], len(_strip_ansi(str(cel))))

    def fmt(celulas: list[str]) -> str:
        partes = []
        for i, cel in enumerate(celulas):
            visivel = len(_strip_ansi(str(cel)))
            pad = larguras[i] - visivel
            partes.append(f"{cel}{' ' * pad}")
        return " │ ".join(partes)

    sep = "─┼─".join("─" * w for w in larguras)
    print(f"{BOLD}{fmt(cabecalhos)}{RESET}")
    print(sep)
    for linha in linhas:
        print(fmt([str(c) for c in linha]))


def _strip_ansi(texto: str) -> str:
    import re
    return re.sub(r"\033\[[0-9;]*m", "", texto)


# ---------------------------------------------------------------------
# Entrada de dados
# ---------------------------------------------------------------------
def ler_texto(prompt: str, obrigatorio: bool = True) -> str:
    while True:
        valor = input(f"{CYAN}{prompt}{RESET} ").strip()
        if valor or not obrigatorio:
            return valor
        erro("Campo obrigatório.")


def ler_opcional(prompt: str) -> str | None:
    valor = input(f"{CYAN}{prompt}{RESET} ").strip()
    return valor or None


def ler_inteiro(prompt: str) -> int | None:
    valor = input(f"{CYAN}{prompt}{RESET} ").strip()
    if not valor:
        return None
    try:
        return int(valor)
    except ValueError:
        erro("Digite um número inteiro válido.")
        return ler_inteiro(prompt)


def confirmar(prompt: str) -> bool:
    return input(f"{CYAN}{prompt} (s/N){RESET} ").strip().lower() in ("s", "sim")


def pausar() -> None:
    input(f"{DIM}\nPressione ENTER para continuar...{RESET}")
