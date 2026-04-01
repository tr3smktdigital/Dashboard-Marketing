# Worker ETL (fase 3 - Kommo v1)

Worker separado do runtime HTTP do Next.js.

```bash
npm run etl:run
```

Processa jobs `source='kommo'` a partir de `client_source_sync_runs`.

## Estrutura do connector Kommo

- `worker/connectors/kommo/client.ts`
- `worker/connectors/kommo/types.ts`
- `worker/connectors/kommo/status-classifier.ts`
- `worker/connectors/kommo/extractor.ts`
- `worker/connectors/kommo/transformer.ts`
- `worker/connectors/kommo/index.ts`

## Configuração mínima em `client_source_connections`

Para `source='kommo'`, `status='active'`, preencher em `config`:

- `base_url` (ex.: `https://SEU_SUBDOMINIO.kommo.com`)
- `access_token` (Bearer token)

## Checkpoint

- Escopo: `scope='source'` e `checkpoint_key='default'`.
- Tipo salvo: `{ lastSyncedUpdatedAt: number }`.
- Overlap aplicado na extração: 300 segundos.
