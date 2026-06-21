"""Pacote da aplicação da Clínica Médica DELT.

Arquitetura em camadas:
    database     -> conexão e inicialização do banco SQLite
    repositories -> acesso a dados (SELECT / INSERT / UPDATE)
    services     -> regras de negócio (validações, transições)
    ui           -> apresentação no terminal (cores, tabelas, input)
    cli          -> laço do menu principal
"""

__version__ = "1.0.0"
