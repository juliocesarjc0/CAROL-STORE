const { db } = require('../database/index');

class AntiCrash {
    constructor(client) {
        this.client = client;
        this.webhookUrl = process.env.WEBHOOK_ERROR_URL;
        this.pendingActions = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        process.on('unhandledRejection', async (reason, promise) => {
            console.error('🚫 Unhandled Rejection:', reason);
            await this.logError('Unhandled Rejection', reason, promise);
        });

        process.on('uncaughtException', async (error, origin) => {
            console.error('🚫 Uncaught Exception:', error);
            await this.logError('Uncaught Exception', error, origin);
        });

        process.on('warning', async (warning) => {
            console.warn('⚠️ Warning:', warning);
        });

        process.on('SIGINT', async () => {
            console.log('\n🔄 Salvando ações pendentes...');
            await this.savePendingActions();
            console.log('✅ Ações salvas! Encerrando...');
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🔄 Salvando ações pendentes...');
            await this.savePendingActions();
            console.log('✅ Ações salvas! Encerrando...');
            process.exit(0);
        });
    }

    async logError(type, error, extra = null) {
        const errorMessage = {
            embeds: [{
                title: `❌ ${type}`,
                color: 0xFF0000,
                fields: [
                    {
                        name: '🔴 Erro',
                        value: `\`\`\`js\n${error?.stack || error?.toString() || 'Erro desconhecido'}\`\`\``.substring(0, 1024)
                    },
                    {
                        name: '📍 Origem',
                        value: `\`\`\`${extra?.toString() || 'N/A'}\`\`\``.substring(0, 1024)
                    },
                    {
                        name: '⏰ Timestamp',
                        value: `<t:${Math.floor(Date.now() / 1000)}:F>`
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Carol Store - Sistema Anti-Crash'
                }
            }]
        };

        if(this.webhookUrl) {
            try {
                await fetch(this.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(errorMessage)
                });
                console.log('📤 Erro enviado para webhook!');
            } catch (err) {
                console.error('❌ Erro ao enviar para webhook:', err);
            }
        } else {
            console.warn('⚠️ WEBHOOK_ERROR_URL não configurada no .env');
        }
    }

    async addPendingAction(actionId, data) {
        this.pendingActions.set(actionId, {
            ...data,
            timestamp: Date.now()
        });
        await db.set(`pendingActions.${actionId}`, data);
        console.log(`💾 Ação pendente salva: ${actionId}`);
    }

    async removePendingAction(actionId) {
        this.pendingActions.delete(actionId);
        await db.delete(`pendingActions.${actionId}`);
        console.log(`🗑️ Ação pendente removida: ${actionId}`);
    }

    async savePendingActions() {
        for (const [id, data] of this.pendingActions) {
            await db.set(`pendingActions.${id}`, data);
        }
        console.log(`💾 ${this.pendingActions.size} ações pendentes salvas`);
    }

    async loadPendingActions() {
        const actions = await db.get('pendingActions') || {};
        return actions;
    }

    async processPendingActions() {
        console.log('🔄 Verificando ações pendentes...');
        const actions = await this.loadPendingActions();
        const actionCount = Object.keys(actions).length;
        
        if(actionCount === 0) {
            console.log('✅ Nenhuma ação pendente encontrada.');
            return;
        }
        
        console.log(`📝 ${actionCount} ação(ões) pendente(s) encontrada(s)`);
        
        for (const [id, data] of Object.entries(actions)) {
            try {
                console.log(`📝 Processando ação: ${id}`);
                await this.executeAction(data);
                await db.delete(`pendingActions.${id}`);
                console.log(`✅ Ação ${id} processada!`);
            } catch (error) {
                console.error(`❌ Erro ao processar ${id}:`, error);
                await this.logError(`Erro ao processar ação pendente ${id}`, error);
            }
        }
    }

    async executeAction(data) {
        switch(data.type) {
            case 'close_ticket':
                console.log(`Executando: Fechar ticket ${data.channelId}`);
                const channel = this.client.channels.cache.get(data.channelId);
                if(channel) {
                    try {
                        await channel.delete();
                        console.log('✅ Canal deletado com sucesso!');
                    } catch(error) {
                        console.error('❌ Erro ao deletar canal:', error);
                    }
                }
                break;
            case 'create_transcript':
                console.log(`Executando: Criar transcript ${data.ticketId}`);
                break;
            default:
                console.log(`⚠️ Tipo de ação desconhecido: ${data.type}`);
        }
    }
}

module.exports = AntiCrash;