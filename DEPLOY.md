# Deploy da VPS

## Pré-requisitos

- VPS com Docker funcionando
- DNS de `dashboards.tr3smarketingdigital.com.br` apontando para a VPS
- portas `80` e `443` liberadas no firewall da VPS
- Supabase configurado com:
  - `Site URL`: `https://dashboards.tr3smarketingdigital.com.br`
  - `Redirect URLs`: `https://dashboards.tr3smarketingdigital.com.br/auth/confirm`

## Cenário atual desta VPS

Esta VPS já tem:

- Docker Swarm ativo
- Traefik publicando `80/443`
- Portainer rodando separado

Por isso, o caminho mais simples é usar `docker-stack.swarm.yml` com o Traefik existente.
Nao use `docker-compose.prod.yml` com Caddy nesse servidor enquanto o Traefik estiver ativo.

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

## Build da imagem na VPS

No diretório do projeto:

```bash
source .env.production
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t dashboard-marketing:latest .
```

## Subida pela VPS em Swarm

No diretório do projeto:

```bash
source .env.production
docker stack deploy -c docker-stack.swarm.yml dashboards
```

## O que sobe

- `app`: Next.js 16 em modo `standalone`
- o roteamento e TLS ficam por conta do Traefik já existente na VPS

## Verificações

Depois do deploy:

```bash
docker stack services dashboards
docker service logs dashboards_app --tail 100
```

Teste:

- `https://dashboards.tr3smarketingdigital.com.br/login`
- `https://dashboards.tr3smarketingdigital.com.br/sign-up`
- `https://dashboards.tr3smarketingdigital.com.br/api/health`

## Portainer

O caminho mais estável é subir primeiro pelo terminal da VPS com `docker build` + `docker stack deploy`.
Depois disso, a stack aparece no Portainer para gestão diária.

<<<<<<< ours
Se quiser usar Stack no Portainer depois, aproveite `docker-stack.swarm.yml`.
=======
Se quiser usar Stack no Portainer depois, aproveite este mesmo `docker-compose.prod.yml`, mas lembre que builds a partir de Git no Portainer têm limitações.

## Deploy com Traefik (Docker Swarm/Portainer)

Se a VPS já possui Traefik no Swarm, use o arquivo `docker-stack.swarm.yml` para anexar apenas o app na rede pública do Traefik (`TR3S_Dashboards`) sem subir proxy dedicado.

1. Verifique se as variáveis estão no ambiente/Portainer (`APP_IMAGE`, `APP_URL`, `APP_DOMAIN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
   - Exemplo de `APP_IMAGE`: `seu-usuario/dashboard-marketing:2026-03-30-01` (imagem publicada em registry acessível pela VPS).
   - Se estiver usando arquivo `.env.production`, carregue no shell antes do build/deploy:

```bash
set -a
source .env.production
set +a
```
2. Defina o nome da stack (exemplo: `dashboard-marketing`) e faça o deploy:

```bash
STACK_NAME=dashboard-marketing
docker stack deploy --with-registry-auth -c docker-stack.swarm.yml "$STACK_NAME"
```

3. Confirme a renderização final do arquivo com:

```bash
cat docker-stack.swarm.yml
```

4. Se necessário, publique a imagem antes do deploy (executado na máquina que tem o código):

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t seu-usuario/dashboard-marketing:2026-03-30-01 .
docker push seu-usuario/dashboard-marketing:2026-03-30-01
```

> O build falha com `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL` se os `--build-arg` não forem enviados.

#### Sem Docker Hub (somente Swarm de 1 nó)

Se você ainda não tem conta em registry, dá para subir usando imagem local **apenas quando seu Swarm tem 1 único nó** (manager).

No terminal da VPS (na pasta do projeto):

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t dashboard-marketing:2026-03-30-01 .
export APP_IMAGE=dashboard-marketing:2026-03-30-01
STACK_NAME=dashboard-marketing
docker stack deploy -c docker-stack.swarm.yml "$STACK_NAME"
```

> Se houver mais de um nó no Swarm, use registry (Docker Hub/GHCR/ECR), senão os workers não encontrarão a imagem.

#### Playbook pronto (um comando)

Para evitar erro de ordem de comandos, use o script pronto no terminal da VPS:

```bash
cd /opt/dashboard-marketing
bash scripts/deploy_swarm_single_node.sh 2026-03-30-01 dashboard-marketing
```

O script executa automaticamente:
1. `source .env.production`
2. `docker build` com `--build-arg` obrigatórios
3. `docker stack deploy`
4. validação de serviço e logs

### Próximos passos (após subir a stack)

Se você já aplicou a stack e quer validar fim-a-fim, rode em sequência na VPS:

```bash
STACK_NAME=dashboard-marketing
docker stack ls
docker stack services "$STACK_NAME"
docker service ps "${STACK_NAME}_app" --no-trunc
docker service logs "${STACK_NAME}_app" --tail 100
```

Checklist rápido:

1. O serviço `${STACK_NAME}_app` deve estar com `1/1` réplicas.
2. Se aparecer `Rejected`/`Failed`, veja o motivo em `docker service ps` (imagem, rede, variável ausente etc.).
3. Confira se a rede overlay existe:

```bash
docker network ls | grep TR3S_Dashboards
```

4. Valide o domínio no Traefik (de fora da VPS):

```bash
curl -I https://dashboards.tr3smarketingdigital.com.br/api/health
```

Se retornar `200`, o roteamento + TLS estão ok.

### Troubleshooting rápido

- **`Nothing found in stack` / `no such service`**: a stack ainda não foi criada com esse nome. Rode `docker stack ls`, confirme o nome e use o mesmo `STACK_NAME` nos comandos de inspeção.
- **`No such image: dashboard-marketing:latest`**: em Swarm a imagem precisa estar em um registry (Docker Hub/GHCR/ECR etc.). Publique a imagem, ajuste `APP_IMAGE` e faça novo `docker stack deploy --with-registry-auth`.
- **Sem Docker Hub**: em ambiente de 1 nó você pode usar imagem local (`docker build -t dashboard-marketing:TAG .` e `APP_IMAGE=dashboard-marketing:TAG`). Em múltiplos nós, registry é obrigatório.
- **`curl: (60) SSL certificate problem: self-signed certificate`**: o domínio respondeu com certificado não confiável. Verifique se o router está no entrypoint TLS correto, se o `certresolver` está ativo no Traefik e se o DNS aponta para a VPS pública.

### Erro comum com variáveis no label do Traefik

O valor de `${APP_DOMAIN}` em `traefik.http.routers.dashboard-marketing.rule` é resolvido no momento do `docker stack deploy`.
Por isso, garanta que `APP_DOMAIN` esteja exportada no shell (ou definida no ambiente da Stack no Portainer) antes do deploy.
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
