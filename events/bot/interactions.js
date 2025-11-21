const { InteractionType } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    run: async(interaction, client) => {
        if(interaction.type === InteractionType.ApplicationCommand) {
            const cmd = client.slashCommands.get(interaction.commandName);
            
            if (!cmd) return;
            
            interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);
            
            try {
                await cmd.run(client, interaction);
            } catch (error) {
                console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
                
                if(client.anticrash) {
                    await client.anticrash.logError(`Erro no comando: ${interaction.commandName}`, error);
                }
                
                const errorMsg = {
                    content: '❌ Ocorreu um erro ao executar este comando.',
                    flags: 64
                };
                
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(errorMsg).catch(() => {});
                } else {
                    await interaction.reply(errorMsg).catch(() => {});
                }
            }
        }
    }
}