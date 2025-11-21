const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { db, owner, tk } = require("../../database/index");

module.exports = {
    name: "ticket",
    description: "[🎫] Gerenciar ticket atual",
    type: ApplicationCommandType.ChatInput,
    run: async(client, interaction) => {
        const ticket = await tk.get(interaction.channel.id);
        
        if(!ticket) {
            return interaction.reply({
                content: `❌ **| Este comando só funciona em canais de ticket!**`,
                flags: 64
            });
        }

        const definition = await db.get("definition");
        const staffRoleId = definition.role;
        
        const hasStaffRole = staffRoleId && interaction.member.roles.cache.has(staffRoleId);
        const isOwner = interaction.user.id === owner;

        if(!hasStaffRole && !isOwner) {
            return interaction.reply({
                content: `❌ **| Você não tem permissão para usar este comando!**\n📋 **Cargo Necessário:** ${staffRoleId ? `<@&${staffRoleId}>` : "`Cargo não configurado no painel`"}`,
                flags: 64
            });
        }

        const panel = await db.get("panel");
        const ids = ticket.type;
        const functionTicket = panel.functions[ids];

        const row = new ActionRowBuilder();
        
        if(definition.functionsTicket.assumir && !ticket.assumido) {
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket_cmd")
                .setLabel("Assumir Ticket")
                .setStyle(3)
                .setEmoji("✋")
            );
        } else if(ticket.assumido) {
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket_cmd")
                .setLabel("Já Assumido")
                .setStyle(3)
                .setEmoji("✅")
                .setDisabled(true)
            );
        }

        const { notifyuser, call, renomear, gerenciar } = definition.functionsTicket;
        if(notifyuser || call || renomear || gerenciar) {
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff_cmd")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("🛠️")
            );
        }

        row.addComponents(
            new ButtonBuilder()
            .setCustomId("deletar_ticket_cmd")
            .setLabel("Fechar Ticket")
            .setStyle(4)
            .setEmoji("🗑️")
        );

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setTitle("🎫 Gerenciamento de Ticket")
                .setColor("#00FFFF")
                .setDescription(`**Painel de controle do ticket:**`)
                .addFields(
                    {
                        name: "📂 Protocolo:",
                        value: `\`#${ticket.protocolo}\``,
                        inline: true
                    },
                    {
                        name: "👤 Criado por:",
                        value: `<@${ticket.owner.id}>`,
                        inline: true
                    },
                    {
                        name: "🔧 Assumido por:",
                        value: ticket.assumido ? `<@${ticket.assumido}>` : "`Ninguém`",
                        inline: true
                    },
                    {
                        name: "📝 Tipo:",
                        value: `\`${ticket.type}\``,
                        inline: true
                    },
                    {
                        name: "📄 Motivo:",
                        value: `\`${ticket.motivo || "Não especificado"}\``,
                        inline: true
                    },
                    {
                        name: "⏰ Aberto em:",
                        value: `\`${ticket.data}\``,
                        inline: true
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Gerenciado por: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            ],
            components: row.components.length > 0 ? [row] : [],
            flags: 64
        });
    }
}
