# ESCALA SWIPE — Ofertas escaladas (React + Supabase + Cloudflare R2 + Stripe)

Plataforma de assinatura para afiliados: cada oferta traz a VSL original, os vídeos dos anúncios da Biblioteca de Anúncios do Meta, site oficial, landing page, pack de criativos e o **gráfico de escala por dia** (anúncios ativos por dia).

---

## Onde cada coisa fica guardada

| O quê | Onde |
|---|---|
| Vídeos da VSL, capa, vídeos dos anúncios, packs | **Cloudflare R2** (bucket privado, links temporários) |
| Dados da oferta, URLs (site, landing, biblioteca de anúncios) e gráfico de escala | Supabase (`es_offers`) |
| Contas (1 por e-mail) e assinaturas (1 por conta) | Supabase Auth + `es_profiles` + `es_subscriptions` |

O navegador nunca vê as chaves do R2: o painel pede uma URL temporária às Edge Functions do Supabase (`get-upload-url` para o admin enviar, `get-download-url` para assinantes assistirem/baixarem).

## Regras de acesso

- Cada e-mail só pode ter **uma conta** (Supabase Auth).
- Criar a conta **não libera acesso**: o membro vai para o Stripe com `client_reference_id` = ID da conta.
- O webhook do Stripe marca a assinatura como `active` **somente para a conta que pagou**. Uma assinatura não libera duas contas.
- Sem assinatura ativa, o site mostra a tela de pagamento.

---

## 📂 Estrutura

```
supabase/
  full_setup.sql                       # Instalação nova (tabelas, RLS, funções)
  migrations/20261015_escala_swipe.sql # Rode no projeto JÁ existente
  functions/
    _shared/r2.ts                      # Cliente R2 + verificação de acesso
    get-upload-url/                    # URL PUT temporária (só admin)
    get-download-url/                  # URLs GET temporárias (assinante ativo ou admin)
    stripe-webhook/                    # Libera/bloqueia a conta conforme o Stripe
    cancel-subscription/               # Cancela a assinatura da conta logada
admin/   # Site (Vite + React) publicado na Vercel: landing, área de membros e painel admin
mobile/  # App Expo
```

---

## ⚡ Configuração (uma vez)

### 1. Banco de dados
No **SQL Editor** do Supabase, rode **somente** `supabase/full_setup.sql`. Ele cria as tabelas `es_profiles`, `es_subscriptions` e `es_offers` (prefixo `es_`) sem tocar em nenhuma tabela, função ou gatilho de outro app que use o mesmo projeto Supabase.

⚠️ Não rode `schema.sql`, `rls.sql`, `seed.sql` nem `storage.sql`: são do modelo antigo e criam tabelas com nomes genéricos (`user_profiles`, `subscriptions`…) que conflitam com o outro app.

### 2. Cloudflare R2
1. Crie o bucket (padrão: `club-particular`) e um **API Token** com permissão de leitura/escrita.
2. Em **Settings → CORS Policy** do bucket, libere o site:
```json
[
  {
    "AllowedOrigins": ["https://SEU-SITE.vercel.app", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Edge Functions (Supabase CLI)
```bash
supabase secrets set R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=club-particular \
  STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_...

supabase functions deploy get-upload-url
supabase functions deploy get-download-url
supabase functions deploy cancel-subscription
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 4. Stripe
No painel do Stripe, crie um webhook apontando para `https://<PROJETO>.supabase.co/functions/v1/stripe-webhook` com os eventos:
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

### 5. Vercel
Variáveis de ambiente do projeto: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_R2_BUCKET`, `VITE_STRIPE_CHECKOUT_URL`, `VITE_STRIPE_PORTAL_URL`. Cada push no GitHub publica o site automaticamente.

---

## Rodando localmente

```bash
cd admin
npm install
npm run dev     # http://localhost:3000
```

```bash
cd mobile
npm install
npx expo start
```
