## Dashboard Marketing

Projeto Next.js (App Router) com base inicial de ETL em worker separado.

## Rodar web

```bash
npm install
npm run dev
```

## Rodar worker ETL (loop simples)

Em outro terminal:

```bash
npm run etl:run
```

## Endpoints da Fase 1

- `POST /api/sync` -> enfileira sync manual (`status = queued`)
- `GET /api/sync-runs/:id` -> consulta status do sync run
