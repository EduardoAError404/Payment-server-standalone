# Payment Server - Sistema de Assinaturas

Servidor Node.js separado para processar pagamentos via Stripe.

## 🚀 Características

- **Integração com Stripe**: Processamento seguro de pagamentos
- **3 Planos de Assinatura**: 1, 3 e 6 meses
- **Descontos Progressivos**: 10% para 3 meses, 20% para 6 meses
- **Banco de Dados Compartilhado**: Usa o mesmo SQLite do sistema principal
- **Webhooks**: Atualização automática de status de pagamento
- **API RESTful**: Endpoints para integração com o frontend

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Stripe (modo teste ou produção)
- Sistema principal OnlyFans rodando

## 🔧 Instalação

1. Instalar dependências:
```bash
cd payment_server
npm install
```

2. Configurar variáveis de ambiente:
```bash
cp .env.example .env
```

3. Editar `.env` com suas chaves do Stripe:
```env
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret
PORT=3000
FRONTEND_URL=http://localhost:5000
```

## 🎯 Como Obter as Chaves do Stripe

1. Acesse [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Faça login ou crie uma conta
3. Vá em **Developers** → **API keys**
4. Copie a **Secret key** e **Publishable key**
5. Para o webhook:
   - Vá em **Developers** → **Webhooks**
   - Clique em **Add endpoint**
   - URL: `http://seu-dominio.com/api/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.expired`
   - Copie o **Signing secret**

## ▶️ Executar

### Modo desenvolvimento:
```bash
npm run dev
```

### Modo produção:
```bash
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 📡 Endpoints da API

### Health Check
```
GET /health
```

### Obter Perfil
```
GET /api/profile/:username
```

### Obter Planos de Assinatura
```
GET /api/subscription-plans/:username
```
Retorna os 3 planos com preços calculados baseados no preço mensal do perfil.

### Criar Sessão de Checkout
```
POST /api/create-checkout-session
Body: {
  "username": "babymatosao",
  "planId": "3-months",
  "customerEmail": "cliente@email.com",
  "customerName": "Nome do Cliente"
}
```

### Webhook do Stripe
```
POST /api/webhook
```
Recebe eventos do Stripe para atualizar status de pagamentos.

### Verificar Pagamento
```
GET /api/verify-payment/:sessionId
```

### Listar Assinaturas (Admin)
```
GET /api/subscriptions/:username
```

## 💳 Planos de Assinatura

Os planos são calculados automaticamente baseados no preço mensal configurado em cada perfil:

| Plano | Duração | Desconto |
|-------|---------|----------|
| Básico | 1 mês | 0% |
| Popular | 3 meses | 10% |
| Premium | 6 meses | 20% |

**Exemplo**: Se o preço mensal é $9.99:
- 1 mês: $9.99
- 3 meses: $26.97 (economia de $2.99)
- 6 meses: $47.95 (economia de $11.99)

## 🗄️ Banco de Dados

O servidor cria automaticamente a tabela `subscriptions` no banco SQLite principal:

```sql
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    profile_username TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_session_id TEXT,
    plan_type TEXT NOT NULL,
    plan_months INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (profile_id) REFERENCES profile (id)
)
```

## 🔒 Segurança

- Todas as transações são processadas pelo Stripe
- Nenhum dado de cartão é armazenado no servidor
- Webhooks verificados com assinatura do Stripe
- CORS configurado para aceitar apenas o domínio do frontend
- Variáveis sensíveis em arquivo `.env` (não versionado)

## 🚀 Deploy

### Com Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Com PM2:
```bash
npm install -g pm2
pm2 start server.js --name payment-server
pm2 save
pm2 startup
```

## 🔗 Integração com Frontend

No frontend, use a chave publicável do Stripe:

```javascript
const stripe = Stripe('pk_test_sua_chave_publicavel');

// Criar checkout
const response = await fetch('http://localhost:3000/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        username: 'babymatosao',
        planId: '3-months',
        customerEmail: 'cliente@email.com',
        customerName: 'Nome do Cliente'
    })
});

const { url } = await response.json();
window.location.href = url; // Redireciona para checkout do Stripe
```

## 📝 Logs

O servidor registra:
- ✅ Conexões bem-sucedidas
- ❌ Erros de processamento
- 💳 Pagamentos completados
- 🔔 Eventos de webhook

## 🆘 Troubleshooting

### Erro: "Cannot find module 'stripe'"
```bash
npm install
```

### Erro: "Database locked"
Certifique-se de que o sistema principal não está usando o banco em modo exclusivo.

### Webhook não funciona
1. Verifique se a URL está acessível publicamente
2. Use ngrok para testes locais: `ngrok http 3000`
3. Configure a URL do ngrok no Stripe Dashboard

## 📄 Licença

ISC

