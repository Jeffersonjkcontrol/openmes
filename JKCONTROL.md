# OpenMES — versão JKControl

Este repositório é uma cópia do [OpenMES](https://github.com/Mes-Open/OpenMes) usada pela JKControl.
O código do OpenMES fica **intocado** sempre que possível. O que é nosso fica em outros repositórios:

| Repositório | O que tem |
|---|---|
| `openmes` (este) | Núcleo do OpenMES. Só recebe mudanças que não cabem num módulo (ex.: tradução pt-BR). |
| `openmes-jkcontrol` | Módulo `JkControl`: cartão RFID → operador, motivo de parada digitado na máquina. |
| [`openmes-connector`](https://github.com/Jeffersonjkcontrol/openmes-connector) | Serviço que lê a API do jkcontrol.online e alimenta o OpenMES. |

O próprio OpenMES bloqueia commit de módulos dentro deste repositório (hook `.githooks/pre-commit`):
módulos vivem em repositórios separados e são colocados em `backend/modules/<Nome>`, que é ignorado pelo git.

## Branches

- `jk` — a nossa linha, criada a partir da versão estável `v0.27.0`.
- O código oficial vem do remoto `upstream`.

## Montar o ambiente de desenvolvimento (WSL)

```bash
git clone https://github.com/Jeffersonjkcontrol/openmes.git && cd openmes
git remote add upstream https://github.com/Mes-Open/OpenMes.git
git clone https://github.com/Jeffersonjkcontrol/openmes-jkcontrol.git backend/modules/JkControl
./install.sh --dev
```

Depois: **Admin → Modules → JKControl Integration → Enable**. O fuso da fábrica é ajustado em
**Configurações** (o OpenMES guarda no banco; o `APP_TIMEZONE` do `.env` é só o padrão).

## Atualizar para uma versão nova do OpenMES

```bash
git fetch upstream --tags
git checkout jk
git merge v0.28.0          # a versão desejada
```

Como quase nada do núcleo é alterado aqui, o merge costuma vir sem conflito. Rode os testes do
módulo depois de atualizar (`php artisan test modules/JkControl/tests`, dentro do container).
