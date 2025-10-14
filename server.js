require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// URL do servidor Flask (onde está o banco de dados)
const FLASK_API_URL = process.env.FLASK_API_URL || 'https://0nlyfaans.com';

console.log('🚀 Payment Server iniciando...');
console.log(`📡 Flask API URL: ${FLASK_API_URL}`);

// Middleware
app.use(cors({
    origin: '*', // Permitir todas as origens
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== ROTAS ====================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Payment server is running',
        flask_api: FLASK_API_URL,
        timestamp: new Date().toISOString()
    });
});

// Obter informações do perfil via API do Flask
app.get('/api/profile/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        console.log(`📥 Buscando perfil: ${username} em ${FLASK_API_URL}/api/profile/${username}`);
        
        const response = await axios.get(`${FLASK_API_URL}/api/profile/${username}`, {
            timeout: 10000
        });
        
        console.log(`✅ Perfil encontrado: ${response.data.display_name}`);
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: error.response.data.error || 'Perfil não encontrado' 
            });
        }
        
        res.status(500).json({ 
            error: 'Erro ao conectar com o servidor principal',
            details: error.message 
        });
    }
});

// Calcular preços dos planos
function calculatePlanPrices(monthlyPrice, months) {
    const basePrice = monthlyPrice * months;
    let discount = 0;
    
    // Aplicar descontos
    if (months === 6) {
        discount = 0.20; // 20% de desconto para 6 meses
    } else if (months === 12) {
        discount = 0.35; // 35% de desconto para 12 meses
    }
    
    const finalPrice = basePrice * (1 - discount);
    
    return {
        basePrice: Math.round(basePrice * 100) / 100,
        discount: Math.round(discount * 100),
        finalPrice: Math.round(finalPrice * 100) / 100,
        priceInCents: Math.round(finalPrice * 100)
    };
}

// Obter planos de assinatura para um perfil
app.get('/api/subscription-plans/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
        console.log(`📊 Calculando planos para: ${username}`);
        
        // Buscar dados do perfil via API do Flask
        const response = await axios.get(`${FLASK_API_URL}/api/profile/${username}`, {
            timeout: 10000
        });
        
        const profile = response.data;
        const monthlyPrice = profile.subscription_price || 9.99;
        
        console.log(`💰 Preço mensal: $${monthlyPrice}`);
        
        const plans = [
            {
                id: '1-month',
                name: '1 Mês',
                months: 1,
                ...calculatePlanPrices(monthlyPrice, 1),
                popular: false
            },
            {
                id: '6-months',
                name: '6 Meses',
                months: 6,
                ...calculatePlanPrices(monthlyPrice, 6),
                popular: false
            },
            {
                id: '12-months',
                name: '12 Meses',
                months: 12,
                ...calculatePlanPrices(monthlyPrice, 12),
                popular: true
            }
        ];
        
        res.json({
            profile: {
                id: profile.id,
                username: profile.username,
                display_name: profile.display_name,
                monthly_price: monthlyPrice
            },
            plans
        });
        
    } catch (error) {
        console.error('❌ Erro ao calcular planos:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: error.response.data.error || 'Erro ao buscar perfil' 
            });
        }
        
        res.status(500).json({ 
            error: 'Erro ao conectar com o servidor principal',
            details: error.message 
        });
    }
});

// Criar sessão de checkout do Stripe
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { username, planId, customerEmail, customerName } = req.body;
        
        console.log(`🛒 Criando checkout: ${username} - ${planId}`);
        
        if (!username || !planId) {
            return res.status(400).json({ error: 'Username e planId são obrigatórios' });
        }
        
        // Buscar informações do perfil via API do Flask
        const profileResponse = await axios.get(`${FLASK_API_URL}/api/profile/${username}`, {
            timeout: 10000
        });
        
        const profile = profileResponse.data;
        
        // Determinar número de meses
        let months = 1;
        if (planId === '6-months') months = 6;
        else if (planId === '12-months') months = 12;
        
        const monthlyPrice = profile.subscription_price || 9.99;
        const pricing = calculatePlanPrices(monthlyPrice, months);
        
        console.log(`💵 Valor total: $${pricing.finalPrice} (${months} meses)`);
        
        try {
            // Criar sessão de checkout do Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: customerEmail,
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Assinatura ${months} ${months === 1 ? 'Mês' : 'Meses'} - ${profile.display_name}`,
                                description: `Acesso exclusivo ao perfil @${profile.username}`,
                                images: []
                            },
                            unit_amount: pricing.priceInCents
                        },
                        quantity: 1
                    }
                ],
                success_url: `${FLASK_API_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${FLASK_API_URL}/${username}`,
                metadata: {
                    profile_id: profile.id.toString(),
                    profile_username: profile.username,
                    plan_months: months.toString(),
                    customer_name: customerName || '',
                    customer_email: customerEmail || ''
                }
            });
            
            console.log(`✅ Sessão criada: ${session.id}`);
            
            res.json({ 
                sessionId: session.id,
                url: session.url
            });
            
        } catch (stripeError) {
            console.error('❌ Erro do Stripe:', stripeError.message);
            res.status(500).json({ 
                error: 'Erro ao criar sessão de pagamento',
                details: stripeError.message 
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: error.response.data.error || 'Erro ao processar requisição' 
            });
        }
        
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Buscar informações de uma sessão do Stripe
app.get('/api/session/:session_id', async (req, res) => {
    try {
        const { session_id } = req.params;
        
        console.log(`🔍 Buscando sessão: ${session_id}`);
        
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        console.log(`✅ Sessão encontrada:`, {
            id: session.id,
            amount: session.amount_total,
            status: session.payment_status
        });
        
        res.json({
            id: session.id,
            payment_status: session.payment_status,
            customer_email: session.customer_email,
            amount_total: session.amount_total,
            amount: session.amount_total / 100, // Converter de centavos para dólares
            currency: session.currency,
            metadata: session.metadata,
            transactionId: session.id, // ID da transação
            createdAt: session.created * 1000 // Timestamp em milissegundos
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar sessão:', error.message);
        res.status(500).json({ 
            error: 'Erro ao buscar sessão',
            details: error.message 
        });
    }
});

// Webhook do Stripe para processar eventos
app.post('/api/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`📨 Webhook recebido: ${event.type}`);
    
    // Processar eventos
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log(`✅ Pagamento confirmado: ${session.id}`);
            console.log(`   Cliente: ${session.customer_email}`);
            console.log(`   Valor: $${session.amount_total / 100}`);
            console.log(`   Perfil: @${session.metadata.profile_username}`);
            
            // Aqui você pode fazer um POST para o Flask API para salvar a assinatura
            // ou implementar outra lógica de notificação
            
            break;
            
        case 'customer.subscription.created':
            console.log('📝 Assinatura criada');
            break;
            
        case 'customer.subscription.updated':
            console.log('🔄 Assinatura atualizada');
            break;
            
        case 'customer.subscription.deleted':
            console.log('❌ Assinatura cancelada');
            break;
            
        default:
            console.log(`ℹ️ Evento não tratado: ${event.type}`);
    }
    
    res.json({ received: true });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 Payment Server rodando!');
    console.log(`📡 Porta: ${PORT}`);
    console.log(`🌐 Flask API: ${FLASK_API_URL}`);
    console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configurado ✅' : 'NÃO CONFIGURADO ❌'}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
});

