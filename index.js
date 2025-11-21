const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");
require('dotenv').config();
console.clear();

const client = new Client({
  intents: Object.keys(GatewayIntentBits),
  partials: Object.keys(Partials)
});

module.exports = client;
client.slashCommands = new Collection();

const token = process.env.TOKEN;

if (!token) {
  console.error("❌ Token não encontrado! Configure o TOKEN no arquivo .env");
  console.error("📝 Copie o arquivo .env.example para .env e adicione seu token");
  process.exit(1);
}

const AntiCrash = require('./utils/anticrash');
const anticrash = new AntiCrash(client);


client.login(token).catch(error => {
  console.error("❌ Erro ao fazer login:", error);
  console.error("🔑 Verifique se o token está correto no arquivo .env");
  process.exit(1);
});

const evento = require("./handler/Events");
evento.run(client);
require("./handler/index")(client);

client.once('clientReady', async () => {
    console.log('🔄 Carregando ações pendentes...');
    await anticrash.processPendingActions();
    console.log('✅ Sistema anti-crash ativo!');
});

client.anticrash = anticrash;
