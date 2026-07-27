# 👑 CLUB PARTICULAR - PLATAFORMA PREMIUM (REACT NATIVE EXPO + SUPABASE + STRIPE)

Plataforma luxuosa, moderna e profissional voltada a afiliados VIP, streaming & download de VSLs em 4K/1080p, biblioteca de criativos, copys validadas, chat privado em tempo real (Discord-style) e controle de assinatura Stripe (R$ 100/mês).

---

## 📂 Estrutura de Pastas do Projeto

```
c:\club particular\
├── supabase/
│   ├── schema.sql           # Schema SQL com todas as 13 tabelas, foreign keys e triggers
│   ├── rls.sql              # Políticas RLS (Row Level Security) rigorosas
│   ├── storage.sql          # 8 Buckets de armazenamento e políticas de Signed URLs
│   └── seed.sql             # Dados de teste (Ofertas VIP, VSLs, Copys, Demográficos)
├── mobile/                  # Aplicativo React Native (Expo Router v3)
│   ├── app/                 # Rotas (Auth, Tab Bar, Swipe TikTok/Netflix, Chat Realtime, Settings)
│   ├── components/          # Design System Luxuoso (Preto, Grafite e Dourado Metalizado #D4AF37)
│   ├── constants/           # Cores, Tipografia, Sombras e Espaçamentos
│   ├── services/            # Clientes Supabase, Stripe Portal & File Downloader com Progresso
│   ├── store/               # Estados globais Zustand (Auth, Offers, Realtime Chat)
│   └── package.json
├── admin/                   # Painel Administrativo Web (Vite + React + Lucide Icons)
│   ├── src/                 # Dashboard, CRUD de Ofertas, Drag & Drop (até 10GB), Disparo de Push
│   ├── index.html
│   └── package.json
└── stripe/                  # Integração Stripe & Webhook Serverless
    └── webhook.ts           # Handler para sincronização automática de assinaturas
```

---

## ⚡ Como Executar o Projeto

### 1. Configuração do Banco de Dados no Supabase
1. Acesse o seu painel do **Supabase**.
2. Abra o **SQL Editor** e execute na ordem:
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/storage.sql`
   - `supabase/seed.sql`

### 2. Rodando o Aplicativo Mobile (Expo)
```bash
cd "c:\club particular\mobile"
npm install
npx expo start
```
- Digite `w` para rodar na Web.
- Digite `a` para rodar no Emulador Android.
- Abra o aplicativo Expo Go no celular iOS/Android para testar diretamente no dispositivo físico.

### 3. Rodando o Painel Administrativo Web
```bash
cd "c:\club particular\admin"
npm install
npm run dev
```
Acesse `http://localhost:3000` no seu navegador para gerenciar ofertas, fazer upload de mídias de até 10 GB via Drag & Drop e disparar notificações push para os membros VIP.

---

## 💎 Funcionalidades Entregues

1. **Autenticação Completa**: Login por e-mail e senha, Cadastro, Recuperar senha e Sessão persistente via Supabase Auth.
2. **Assinatura Stripe (R$ 100/mês)**: Verificação automática da assinatura ao abrir o app, bloqueio total de áreas premium se inativa (`SubscriptionGate`), e modal de cancelamento com redirecionamento ao Portal Stripe.
3. **Swipe de Ofertas Estilo TikTok/Netflix**: Deslize horizontal fluido mostrando capa, logo, comissão, VSL online, download do vídeo original VSL com barra de progresso, biblioteca de anúncios, site oficial, landing page e copys de alta conversão.
4. **Chat Privado de Membros (Discord-Style)**: Supabase Realtime com fotos de perfil, cargos, indicador "digitando...", contador de mensagens não lidas, emojis rápidos, e exclusão de mensagens com permissões de moderador.
5. **Configurações Completa**: Perfil, segurança, suporte WhatsApp, termos, políticas e botão destacado de cancelar assinatura Stripe.
6. **Painel Web Administrativo**: CRUD completo de ofertas e mídias sem alterar código, suporte a uploads de até 10 GB com progresso e estatísticas.
