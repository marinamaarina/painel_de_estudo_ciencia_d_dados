# Painel de Estudos — GitHub + Vercel + Turso

Painel de acompanhamento da jornada de estudos.

## Arquitetura

GitHub → Vercel → `/api/state` → Turso

O token do Turso fica somente nas variáveis de ambiente da Vercel e não é enviado ao navegador.

## Variáveis da Vercel

Configure:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

Depois faça um novo deploy.

## Teste

Abra o site publicado pela Vercel e altere algum item do painel. A aplicação deve enviar `POST /api/state`.

Para conferir no Turso:

```sql
SELECT user_key, state, updated_at
FROM estudos_painel;
```

## GitHub Pages

Esta versão **não deve ser publicada pelo GitHub Pages**, porque `/api/state` precisa ser executado em um ambiente server-side. O GitHub continua sendo o repositório do código; a publicação deve ser feita pela Vercel.
