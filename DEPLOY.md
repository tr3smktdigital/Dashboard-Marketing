# Deploy da VPS

## Pré-requisitos

- VPS com Docker funcionando
- DNS de `dashboards.tr3smarketingdigital.com.br` apontando para a VPS
- portas `80` e `443` liberadas no firewall da VPS
- Supabase configurado com:
  - `Site URL`: `https://dashboards.tr3smarketingdigital.com.br`
  - `Redirect URLs`: `https://dashboards.tr3smarketingdigital.com.br/auth/confirm`

## Arquivos de ambiente

1. Copie o exemplo:

```bash
cp .env.production.example .env.production
```

2. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://amxhtvttegehinwsdmnd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=seu_publishable_key
APP_DOMAIN=dashboards.tr3smarketingdigital.com.br
APP_URL=https://dashboards.tr3smarketingdigital.com.br
```

## Subida pela VPS

No diretório do projeto:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## O que sobe

- `app`: Next.js 16 em modo `standalone`
- `web`: Caddy fazendo reverse proxy e emitindo TLS automaticamente

## Verificações

Depois do deploy:

```bash
docker compose -f docker-compose.prod.yml ps
docker logs dashboard-marketing-app --tail 100
docker logs dashboard-marketing-web --tail 100
```

Teste:

- `https://dashboards.tr3smarketingdigital.com.br/login`
- `https://dashboards.tr3smarketingdigital.com.br/sign-up`
- `https://dashboards.tr3smarketingdigital.com.br/api/health`

## Portainer

O caminho mais estável é subir primeiro pelo terminal da VPS com `docker compose`.
Depois disso, os containers aparecem no Portainer para gestão diária.

Se quiser usar Stack no Portainer depois, aproveite este mesmo `docker-compose.prod.yml`, mas lembre que builds a partir de Git no Portainer têm limitações.
