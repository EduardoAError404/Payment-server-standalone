#!/bin/bash

# Script de inicialização segura do Payment Server
# Garante que apenas uma instância esteja rodando

echo "🔍 Verificando processos antigos do payment server..."

# Encontrar e matar processos antigos do server.js
PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')

if [ -n "$PIDS" ]; then
    echo "⚠️  Encontrados processos antigos: $PIDS"
    echo "🛑 Parando processos antigos..."
    for PID in $PIDS; do
        kill $PID 2>/dev/null && echo "   ✅ Processo $PID parado"
    done
    sleep 2
else
    echo "✅ Nenhum processo antigo encontrado"
fi

# Verificar se a porta 3000 está livre
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Porta 3000 ainda em uso, aguardando liberação..."
    sleep 3
fi

# Navegar para o diretório correto
cd "$(dirname "$0")"

# Carregar variáveis de ambiente
if [ -f .env ]; then
    source .env
fi

echo ""
echo "🚀 Iniciando Payment Server..."
echo "📂 Diretório: $(pwd)"
echo "🗄️  Database: ../src/database/app.db"
echo ""

# Iniciar o servidor
node server.js
