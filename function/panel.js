const { ApplicationCommandType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } = require("discord.js");
const { db, owner, tk } = require("../database/index");

async function panel(interaction) {
    const system = await db.get("system");
    await interaction.editReply({
        content: "",
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: "Painel de Controle", iconURL: interaction.client.user.avatarURL() })
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
                    value: `\`${interaction.client.ws.ping}ms\``,
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

async function roleStaff(interaction) {
    const role = interaction.guild.roles.cache.get(await db.get("definition.role")) || "`Não Definido`";
    interaction.editReply({
        content: "",
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: "Configuração de Cargo", iconURL: interaction.client.user.avatarURL() })
            .setDescription(`Configure o cargo que terá permissão de gerenciar tickets.`)
            .addFields({
                name: "👤 Cargo de Staff:",
                value: `${role}`
            })
            .setColor("#00FFFF")
            .setTimestamp()
        ],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("configrolekk")
                .setLabel("Configurar Cargo")
                .setStyle(2)
                .setEmoji("⚙️"),
                new ButtonBuilder()
                .setStyle(2)
                .setCustomId("definition")
                .setEmoji("◀️")
            )
        ]
    });
}

async function channelConfig(interaction) {
    const channels = await db.get("definition.channels");
    const logs = interaction.client.channels.cache.get(channels.logs) || "`Não Definido`";
    const feedback = interaction.client.channels.cache.get(channels.feedback) || "`Não Definido`";
    const category = interaction.client.channels.cache.get(channels.category) || "`Não Definido`";

    await interaction.editReply({
       content: "",
       embeds: [
        new EmbedBuilder()
        .setAuthor({ name: "Configuração de Canais", iconURL: interaction.client.user.avatarURL() })
        .setDescription(`Configure os canais que serão usados pelo bot.`)
        .setColor("#00FFFF")
        .addFields(
            {
                name: "📋 Canal de Logs",
                value: `${logs}`,
                inline: true
            },
            {
                name: "⭐ Canal de FeedBacks",
                value: `${feedback}`,
                inline: true
            },
            {
                name: "📁 Categoria Padrão de Tickets",
                value: `${category}`,
                inline: true
            },
        )
        .setFooter({ text: "A categoria padrão é usada quando nenhuma categoria específica é definida na função" })
        .setTimestamp()
       ],
       components: [
        new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("configchannellogs")
            .setLabel("Configurar Logs")
            .setStyle(2)
            .setEmoji("📋"),
            new ButtonBuilder()
            .setCustomId("configchannelfeedback")
            .setLabel("Configurar FeedBack")
            .setStyle(2)
            .setEmoji("⭐"),
            new ButtonBuilder()
            .setCustomId("configchannelcategory")
            .setLabel("Configurar Categoria")
            .setStyle(2)
            .setEmoji("📁"),
            new ButtonBuilder()
            .setStyle(2)
            .setCustomId("definition")
            .setEmoji("◀️")
        )
       ]
    });
}

async function functionTicket(interaction) {
    const functions = await db.get("definition.functionsTicket");
    const notify = functions.notifyuser ? "✅" : "❌";
    const assumir = functions.assumir ? "✅" : "❌";
    const call = functions.call ? "✅" : "❌";
    const renomear  = functions.renomear ? "✅" : "❌";
    const gerenciar = functions.gerenciar ? "✅" : "❌";
    const motivo = functions.motivo ? "✅" : "❌";

    await interaction.editReply({
        content: "",
        embeds: [
            new EmbedBuilder()
            .setAuthor({ name: "Funções de Ticket", iconURL: interaction.client.user.avatarURL() })
            .setColor("#00FFFF")
            .setDescription(`Configure as funções que estarão disponíveis dentro do ticket.`)
            .addFields(
                {
                    name: `🔔 Notificar Usuário: \`${notify}\``,
                    value: "Notificar o usuário apenas apertando um botão."
                },
                {
                    name: `✋ Assumir Ticket: \`${assumir}\``,
                    value: "Assumir o ticket apenas apertando um botão."
                },
                {
                    name: `📞 Criar Call: \`${call}\``,
                    value: "Criar uma call apenas apertando um botão."
                },
                {
                    name: `✏️ Renomear Canal: \`${renomear}\``,
                    value: "Renomear o canal do Ticket."
                },
                {
                    name: `👥 Gerenciar Membros: \`${gerenciar}\``,
                    value: "Adicionar/remover membros do ticket."
                },
                {
                    name: `❓ Motivo do Ticket: \`${motivo}\``,
                    value: "Usuário deverá informar o motivo ao abrir."
                },
            )
            .setTimestamp()
        ],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("functionSelectcConfig")
                .setMaxValues(1)
                .setMinValues(1)
                .setPlaceholder("Ativar/Desativar uma opção")
                .addOptions(
                    {
                        label: "Voltar ao Painel Principal",
                        description: "Voltar ao menu anterior",
                        value: "voltarpanel",
                        emoji: "◀️"
                    },
                    {
                        label: "Notificar Usuário",
                        description: "Ativar/Desativar",
                        value: "notifyuser",
                        emoji: "🔔"
                    },
                    {
                        label: "Assumir Ticket",
                        description: "Ativar/Desativar",
                        value: "assumir",
                        emoji: "✋"
                    },
                    {
                        label: "Criar Call",
                        description: "Ativar/Desativar",
                        value: "call",
                        emoji: "📞"
                    },
                    {
                        label: "Renomear Canal",
                        description: "Ativar/Desativar",
                        value: "renomear",
                        emoji: "✏️"
                    },
                    {
                        label: "Gerenciar Membros",
                        description: "Ativar/Desativar",
                        value: "gerenciar",
                        emoji: "👥"
                    },
                    {
                        label: "Motivo Ticket",
                        description: "Ativar/Desativar",
                        value: "motivo",
                        emoji: "❓"
                    },
                )
            )
        ]
    });
}

async function panelConfig(interaction) {
    const panel = await db.get("panel");
    const embed = new EmbedBuilder()
    .setAuthor({ name: "Configuração do Painel", iconURL: interaction.client.user.avatarURL() })
    .setColor("#00FFFF")
    .setDescription(`Configure a aparência e funcionamento do painel de tickets.`)
    .setTimestamp();

    const all = Object.entries(panel.functions);
    const components = [
        new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("trocarembedcontent")
            .setLabel(`Usar ${panel.mensagem.content ? "Embed" : "Mensagem"}`)
            .setStyle(2)
            .setEmoji("🎨"),
            new ButtonBuilder()
            .setCustomId("definitraparenciafunction")
            .setLabel("Editar Aparência")
            .setStyle(2)
            .setEmoji("✏️"),
            new ButtonBuilder()
            .setCustomId("resetartudofunction")
            .setLabel("Resetar Tudo")
            .setStyle(4)
            .setEmoji("🗑️")
        ),
        new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("addfunction")
            .setLabel("Adicionar Função")
            .setStyle(3)
            .setDisabled(all.length >= 5)
            .setEmoji("➕"),
            new ButtonBuilder()
            .setCustomId("editfunction")
            .setLabel("Editar Função")
            .setStyle(2)
            .setEmoji("✏️")
            .setDisabled(all.length < 1),
            new ButtonBuilder()
            .setCustomId("removefunction")
            .setLabel("Remover Função")
            .setStyle(4)
            .setEmoji("➖")
            .setDisabled(all.length < 1),
        ),
        new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("postmsg")
            .setLabel("Postar Mensagem")
            .setStyle(1)
            .setDisabled(all.length < 1)
            .setEmoji("📤"),
            new ButtonBuilder()
            .setCustomId("testmsg")
            .setLabel("Testar Mensagem")
            .setStyle(2)
            .setDisabled(all.length < 1)
            .setEmoji("🧪"),
        ),
        new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("alterarbotaoselect")
            .setLabel(`Usar ${panel.button ? "Select" : "Botões"}`)
            .setStyle(2)
            .setDisabled(all.length < 1)
            .setEmoji("🔄"),
            new ButtonBuilder()
            .setStyle(2)
            .setCustomId("voltar")
            .setEmoji("◀️")
        )
    ];
    
    const row = new ActionRowBuilder();
    all.forEach((rs) => {
        const id = rs["0"];
        const data = rs["1"];
        const categoryChannel = data.category ? interaction.guild.channels.cache.get(data.category) : null;
        
        embed.addFields({
            name: `🎫 Função: \`${id}\``,
            value: `**Pré-descrição:** \`${data.predesc}\`\n**Descrição:** ${!data.desc || data.desc === "Não Definido" ? "`Não Definido`" : data.desc.substring(0, 100) + "..."}\n**Banner:** ${!data.banner?.startsWith("https://") ? "`Não Definido`" : `[Link](${data.banner})`}\n**Emoji:** ${!data.emoji ? "`Não Definido`" : data.emoji}\n**Categoria:** ${categoryChannel ? categoryChannel : "`Padrão`"}`
        });
        
        if(panel.button) {
            const button = new ButtonBuilder()
            .setCustomId(id)
            .setLabel(`${id} (Teste)`)
            .setStyle(2)
            .setDisabled(true);

            if(data.emoji) button.setEmoji(data.emoji);
            
            row.addComponents(button);
        }
    });
    
    if(all.length > 0) {
        if(!panel.button) {
            const select = new StringSelectMenuBuilder()
            .setCustomId("test")
            .setPlaceholder("Selecione uma opção (Teste)")
            .setDisabled(true)
            .addOptions({ label: "Teste", value: "test" });
            
            components.push(
                new ActionRowBuilder().addComponents(select)
            );
        } else {
            components.push(row);
        }
    }

    let is;
    if(panel.mensagem.content) {
        is = {
            content: `${panel.mensagem.msg.content}`,
            embeds: [embed],
            components
        };
    } else {
        const m = panel.mensagem.embeds;
        const embed1 = new EmbedBuilder()
        .setTitle(m.title)
        .setDescription(m.desc)
        .setImage(m.banner)
        .setColor(m.cor);

        is = {
            embeds: [embed1, embed],
            components
        };
    }

    await interaction.editReply(is);
}

module.exports = {
    panel,
    roleStaff,
    channelConfig,
    functionTicket,
    panelConfig
};