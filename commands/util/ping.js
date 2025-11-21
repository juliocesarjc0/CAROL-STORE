const { ApplicationCommandType, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping", 
    description: "[🤖] Veja o PING do bot!", 
    type: ApplicationCommandType.ChatInput,
    run: async(client, interaction) => { 
        const start = Date.now();
        
        await interaction.reply({ 
            content: `🏓 Calculando ping...`, 
            flags: 64
        });

        const end = Date.now();
        const ping = end - start;

        const embed = new EmbedBuilder()
            .setTitle("🏓 Pong!")
            .setColor("#00FFFF")
            .addFields(
                { name: "📡 Latência do Bot", value: `\`${ping}ms\``, inline: true },
                { name: "💓 Latência da API", value: `\`${client.ws.ping}ms\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Requisitado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        interaction.editReply({
            content: null,
            embeds: [embed]
        });
    }
}
