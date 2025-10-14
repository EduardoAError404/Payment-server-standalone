# 🚀 Guia de Deploy no Coolify - Payment Server

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Acesso ao Coolify
- ✅ Site principal (Flask) já deployado em https://0nlyfaans.com

## 🔧 Passo a Passo

### 1️⃣ Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `onlyfans-payment-server`
3. Descrição: "Payment server for OnlyFans Clone"
4. Visibilidade: **Public** ou **Private**
5. **NÃO** marque "Add a README file"
6. Clique em **"Create repository"**

### 2️⃣ Fazer Upload do Código

No seu computador local, execute:

```bash
# Navegue até a pasta do projeto
cd onlyfans-payment-server

# Inicialize o Git
git init

# Adicione todos os arquivos
git add .

# Faça o commit inicial
git commit -m "Initial commit: Payment server standalone"

# Renomeie a branch para main
git branch -M main

# Adicione o repositório remoto (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/onlyfans-payment-server.git

# Faça o push
git push -u origin main
```

### 3️⃣ Configurar no Coolify

#### 3.1 Criar Novo Recurso

1. Acesse seu Coolify
2. Vá para **"Projects"**
3. Selecione um projeto existente ou crie um novo
4. Clique em **"+ Add New Resource"**
5. Selecione **"Git Repository"**

#### 3.2 Configurar Repositório

- **Repository URL:** `https://github.com/SEU_USUARIO/onlyfans-payment-server`
- **Branch:** `main`
- **Build Pack:** `Dockerfile`
- **Port:** `3000`

#### 3.3 Configurar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

| Nome | Valor |
|------|-------|
| `FLASK_API_URL` | `https://0nlyfaans.com` |
| `STRIPE_SECRET_chave` | `*****` |
| `STRIPE_PUBLISHABLE_chave` | `*********` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

**⚠️ IMPORTANTE:** Marque todas as variáveis como **"Runtime Only"** (não Build Time).

#### 3.4 Configurar Domínio

**Opção A: Subdomínio (Recomendado)**

1. Vá em **"Domains"**
2. Adicione: `payment.0nlyfaans.com`
3. Configure o DNS do seu domínio:
   - Tipo: `CNAME`
   - Nome: `payment`
   - Valor: `seu-servidor-coolify.com` (IP ou domínio do Coolify)

**Opção B: URL Gerada pelo Coolify**

1. Deixe o Coolify gerar uma URL automática
2. Exemplo: `payment-abc123.coolify.io`

### 4️⃣ Fazer Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (pode levar 2-3 minutos)
3. Verifique os logs para confirmar que iniciou:
   ```
   🚀 Payment Server iniciando...
   📡 Flask API URL: https://0nlyfaans.com
   🚀 Payment Server rodando!
   📡 Porta: 3000
   ```

### 5️⃣ Testar o Payment Server

Abra o navegador ou use curl:

```bash
curl https://payment.0nlyfaans.com/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "Payment server is running",
  "flask_api": "https://0nlyfaans.com",
  "timestamp": "2025-10-14T21:00:00.000Z"
}
```

### 6️⃣ Atualizar Site Principal

No **projeto do Flask** no Coolify:

1. Vá em **"Environment Variables"**
2. Atualize ou adicione:
   ```
   PAYMENT_SERVER_URL=https://payment.0nlyfaans.com
   ```
3. Clique em **"Redeploy"**

### 7️⃣ Testar Integração Completa

1. Acesse https://0nlyfaans.com
2. Clique em **"Subscribe"**
3. Verifique se o modal de pagamento abre
4. Teste um pagamento (use cartão de teste do Stripe)

## 🎯 Cartões de Teste do Stripe

| Número do Cartão | Resultado |
|------------------|-----------|
| `4242 4242 4242 4242` | Pagamento bem-sucedido |
| `4000 0000 0000 0002` | Cartão recusado |
| `4000 0025 0000 3155` | Requer autenticação 3D Secure |

- **Data de validade:** Qualquer data futura
- **CVV:** Qualquer 3 dígitos
- **CEP:** Qualquer CEP válido

## 🔄 Atualizar o Payment Server

Quando fizer mudanças no código:

```bash
git add .
git commit -m "Descrição da mudança"
git push origin main
```

No Coolify, clique em **"Redeploy"** para aplicar as mudanças.

## 🐛 Troubleshooting

### Deploy falha no build

**Erro:** `npm install failed`

**Solução:**
1. Verifique se `package.json` está no repositório
2. Verifique os logs de build no Coolify

### Container não inicia

**Erro:** `Application failed to start`

**Solução:**
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique os logs do container
3. Confirme que a porta 3000 está exposta

### Health check falha

**Erro:** `Health check failed`

**Solução:**
1. Verifique se o servidor está rodando na porta 3000
2. Verifique se o healthcheck no Dockerfile está correto
3. Aguarde 40 segundos (start-period do healthcheck)

### Site principal não se conecta ao payment server

**Erro:** `Cannot connect to payment server`

**Solução:**
1. Verifique se `PAYMENT_SERVER_URL` no Flask está correto
2. Teste o health check do payment server
3. Verifique se o CORS está configurado corretamente

## 📊 Monitoramento

### Logs

Para ver os logs do payment server no Coolify:

1. Acesse o projeto
2. Clique em **"Logs"**
3. Selecione **"Application Logs"**

### Métricas

O Coolify mostra automaticamente:
- CPU usage
- Memory usage
- Network traffic
- Uptime

## 🔐 Segurança

### Produção

Quando for para produção:

1. **Altere as chaves do Stripe** para modo live:
   - `STRIPE_SECRET_chave=sk_live_...`
   - `STRIPE_PUBLISHABLE_chave=pk_live_...`

2. **Configure webhook no Stripe:**
   - URL: `https://payment.0nlyfaans.com/webhook`
   - Eventos: `checkout.session.completed`, `checkout.session.expired`
   - Copie o **Signing secret** e atualize `STRIPE_WEBHOOK_SECRET`

3. **Use HTTPS** (o Coolify configura automaticamente com Let's Encrypt)

## 📞 Suporte

- **Coolify:** https://coolify.io/docs
- **Stripe:** https://stripe.com/docs
- **GitHub:** https://docs.github.com

---

**Última atualização:** 14/10/2025

