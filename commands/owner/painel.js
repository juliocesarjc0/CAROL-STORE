const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { db, owner, tk } = require("../../database/index");

module.exports = {
    name: "painel",
    description: "painel de controle do bot",
    type: ApplicationCommandType.ChatInput,
    run: async(client, interaction) => {
        if(owner !== interaction.user.id) {
            return interaction.reply({
                content: `❌ **| Você não tem permissão de usar este comando.**`, 
                flags: 64
            });
        }
        
        const system = await db.get("system");
        
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setAuthor({ name: "Painel de Controle", iconURL: client.user.avatarURL() })
                .setDescription(`Bom dia, **${interaction.member.displayName}**! Aqui você pode controlar o bot.`)
                .addFields(
                    {
                        name: "Status:",
                        value: `${system ? "✅ `Ligado`" : "❌ `Desligado`"}`,
                        inline: true
                    },
                    {
                        name: "Versão:",
                        value: `\`1.1.0\``,
                        inline: true
                    },
                    {
                        name: "Ping:",
                        value: `\`${client.ws.ping}ms\``,
                        inline: true
                    },
                )
                .setColor("#00FFFF")
                .setTimestamp()
                .setFooter({ text: "Carol Store - Sistema de Tickets" })
            ],
            components: [
                new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId("systemtrueorfalse")
                    .setEmoji(system ? "✅" : "❌")
                    .setStyle(system ? 3 : 4),
                    new ButtonBuilder()
                    .setCustomId("configpanel")
                    .setLabel("Configurar Painel")
                    .setStyle(1)
                    .setEmoji("⚙️"),
                    new ButtonBuilder()
                    .setCustomId("definition")
                    .setLabel("Definições")
                    .setStyle(2)
                    .setEmoji("📋")
                )
            ],
            flags: 64
        });
    }
}
