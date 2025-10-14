# 💳 OnlyFans Payment Server

Servidor de pagamentos standalone para integração Stripe com o OnlyFans Clone.

## 📋 Descrição

Este é um servidor Node.js + Express separado que gerencia toda a lógica de pagamentos via Stripe, incluindo:

- ✅ Criação de sessões de checkout
- ✅ Cálculo de planos de assinatura  
- ✅ Processamento de webhooks do Stripe
- ✅ Busca de dados de perfil via API do site principal

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│   Site Principal (Flask)            │
│   https://0nlyfaans.com             │
│   - Interface do usuário            │
│   - Banco de dados                  │
│   - API de perfis                   │
└────────────┬────────────────────────┘
             │ HTTPS
             ▼
┌─────────────────────────────────────┐
│   Payment Server (Node.js)          │
│   - Integração Stripe               │
│   - Checkout sessions               │
│   - Webhooks                        │
└─────────────────────────────────────┘
```

## 🚀 Deploy no Coolify

### Passo 1: Criar novo projeto no GitHub

1. Crie um novo repositório no GitHub (ex: `onlyfans-payment-server`)
2. Faça upload deste projeto para o repositório

```bash
cd onlyfans-payment-server
git init
git add .
git commit -m "Initial commit: Payment server standalone"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/onlyfans-payment-server.git
git push -u origin main
```

### Passo 2: Configurar no Coolify

1. Acesse seu Coolify
2. Clique em **"New Project"** ou use um projeto existente
3. Clique em **"Add New Resource"** → **"Git Repository"**
4. Configure:
   - **Repository:** `https://github.com/SEU_USUARIO/onlyfans-payment-server`
   - **Branch:** `main`
   - **Build Pack:** Dockerfile

### Passo 3: Configurar Variáveis de Ambiente

No Coolify, adicione as seguintes variáveis de ambiente:

```bash
FLASK_API_URL=https://0nlyfaans.com
STRIPE_SECRET_KEY=*****
STRIPE_PUBLISHABLE_KEY=***
STRIPE_WEBHOOK_SECRET=whsec_placeholder
PORT=3000
NODE_ENV=production
```

### Passo 4: Configurar Domínio

Configure um domínio ou subdomínio para o payment server:

**Opções:**
- Subdomínio: `payment.0nlyfaans.com`
- Ou deixe o Coolify gerar uma URL automática

### Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar
3. Verifique os logs para confirmar que iniciou corretamente

### Passo 6: Atualizar Site Principal

Após o deploy, atualize a variável de ambiente no **projeto principal do Flask**:

```bash
PAYMENT_SERVER_URL=https://payment.0nlyfaans.com
```

Ou use a URL gerada pelo Coolify.

## 🧪 Testar

### Health Check

```bash
curl https://payment.0nlyfaans.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Payment server is running",
  "flask_api": "https://0nlyfaans.com",
  "timestamp": "..."
}
```

### Testar Criação de Checkout

```bash
curl -X POST https://payment.0nlyfaans.com/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "username": "babymatosao",
    "plan": "1_month"
  }'
```

## 📁 Estrutura do Projeto

```
onlyfans-payment-server/
├── server.js              # Servidor principal
├── package.json           # Dependências Node.js
├── Dockerfile             # Configuração Docker
├── .dockerignore          # Arquivos ignorados no build
├── .gitignore             # Arquivos ignorados no Git
├── .env.example           # Exemplo de variáveis de ambiente
└── README.md              # Este arquivo
```

## 🔧 Desenvolvimento Local

### Pré-requisitos

- Node.js 18+
- npm

### Instalação

```bash
# Instalar dependências
npm install

# Copiar .env.example para .env
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Iniciar servidor
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📊 Endpoints

### `GET /health`
Health check do servidor

**Resposta:**
```json
{
  "status": "ok",
  "message": "Payment server is running",
  "flask_api": "https://0nlyfaans.com",
  "timestamp": "2025-10-14T21:00:00.000Z"
}
```

### `POST /api/create-checkout-session`
Criar sessão de checkout no Stripe

**Body:**
```json
{
  "username": "babymatosao",
  "plan": "1_month"
}
```

**Resposta:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### `GET /api/session/:sessionId`
Buscar dados de uma sessão do Stripe

**Resposta:**
```json
{
  "id": "cs_test_...",
  "status": "complete",
  "customer_email": "user@example.com",
  ...
}
```

### `POST /webhook`
Webhook do Stripe (configurar no dashboard do Stripe)

## 🔐 Segurança

- ✅ Chaves do Stripe em variáveis de ambiente
- ✅ Validação de webhooks do Stripe
- ✅ CORS configurado
- ✅ Healthcheck para monitoramento

## 🐛 Troubleshooting

### Erro: "Cannot connect to Flask API"

**Solução:** Verifique se `FLASK_API_URL` está configurado corretamente e se o site principal está acessível.

### Erro: "Stripe authentication failed"

**Solução:** Verifique se `STRIPE_SECRET_KEY` está correto no dashboard do Stripe.

### Servidor não inicia

**Solução:** Verifique os logs do Coolify e confirme que todas as variáveis de ambiente estão configuradas.

## 📞 Suporte

Para problemas com:
- **Stripe:** Verifique o dashboard em https://dashboard.stripe.com
- **Deploy:** Verifique os logs do Coolify
- **Integração:** Verifique se o site principal está acessível

---

**Versão:** 1.0.0  
**Última atualização:** 14/10/2025

