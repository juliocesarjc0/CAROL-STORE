const { 
    ApplicationCommandType, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    RoleSelectMenuBuilder, 
    ChannelSelectMenuBuilder, 
    CategoryChannel, 
    ChannelType, 
    ModalBuilder, 
    TextInputBuilder, 
    StringSelectMenuBuilder, 
    AttachmentBuilder 
} = require("discord.js");
const { db, owner, tk } = require("../../database/index");
const { panel, roleStaff, channelConfig, functionTicket, panelConfig } = require("../../function/panel");

module.exports = {
    name: "interactionCreate",
    run: async(interaction, client) => {
        const { customId, user, guild, channel, member } = interaction;
        if(!customId) return;
        
        // Sistema liga/desliga
        if(customId === "systemtrueorfalse") {
            await interaction.deferUpdate();
            const systemt = await db.get("system");
            await db.set(`system`, !systemt);
            panel(interaction);
        }

        // Menu de definições
        if(customId === "definition") {
            interaction.update({
                content: `⚙️ O que precisa configurar?`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("functionsTicket")
                        .setLabel("Funções de Ticket")
                        .setStyle(1)
                        .setEmoji("🎫"),
                        new ButtonBuilder()
                        .setCustomId("channelsconfig")
                        .setLabel("Canais")
                        .setStyle(2)
                        .setEmoji("📺"),
                        new ButtonBuilder()
                        .setLabel("Cargos")
                        .setCustomId("rolesconfig")
                        .setStyle(2)
                        .setEmoji("👤"),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("voltar")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Funções de ticket
        if(customId === "functionsTicket") {
            await interaction.deferUpdate();
            functionTicket(interaction);
        }

        // Select de funções
        if(customId === "functionSelectcConfig") {
            const option = interaction.values[0];
            if(option === "voltarpanel") return interaction.update({
                content: `⚙️ O que precisa configurar?`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("functionsTicket")
                        .setLabel("Funções de Ticket")
                        .setStyle(1)
                        .setEmoji("🎫"),
                        new ButtonBuilder()
                        .setCustomId("channelsconfig")
                        .setLabel("Canais")
                        .setStyle(2)
                        .setEmoji("📺"),
                        new ButtonBuilder()
                        .setLabel("Cargos")
                        .setCustomId("rolesconfig")
                        .setStyle(2)
                        .setEmoji("👤"),
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("voltar")
                        .setEmoji("◀️")
                    )
                ]
            });
            await interaction.deferUpdate();
            await db.set(`definition.functionsTicket.${option}`, !await db.get(`definition.functionsTicket.${option}`));
            functionTicket(interaction);
        }

        // Voltar ao painel principal
        if(customId === "voltar") {
            await interaction.deferUpdate();
            panel(interaction);
        }

        // Configurar cargos
        if(customId === "rolesconfig") {
            await interaction.deferUpdate();
            roleStaff(interaction);
        }

        // Selecionar cargo
        if(customId === "configrolekk") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new RoleSelectMenuBuilder()
                        .setCustomId("selectconfigroles")
                        .setPlaceholder("Selecione o cargo de Staff")
                        .setMaxValues(1)
                        .setMinValues(1)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("rolesconfig")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Salvar cargo selecionado
        if(customId === "selectconfigroles") {
            await interaction.deferUpdate();
            await db.set(`definition.role`, interaction.values[0]);
            roleStaff(interaction);
        }

        // Configurar canais
        if(customId === "channelsconfig") {
            await interaction.deferUpdate();
            channelConfig(interaction);
        }

        // Selecionar canal
        if(customId.startsWith("configchannel")) {
            const id = customId.split("configchannel")[1];

            const select = new ChannelSelectMenuBuilder()
            .setCustomId(`selectconfigchannel${id}`)
            .setChannelTypes(id === "category" ? ChannelType.GuildCategory : ChannelType.GuildText)
            .setMaxValues(1)
            .setPlaceholder("Escolha o Canal");

            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("channelsconfig")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Salvar canal selecionado
        if(customId.startsWith("selectconfigchannel")) {
            const id = customId.split("selectconfigchannel")[1];
            await interaction.deferUpdate();
            await db.set(`definition.channels.${id}`, interaction.values[0]);
            channelConfig(interaction);
        }

        // Configurar painel
        if(customId === "configpanel") {
            await interaction.deferUpdate();
            panelConfig(interaction);
        }

        // Trocar entre embed e mensagem
        if(customId === "trocarembedcontent") {
            await interaction.deferUpdate();
            await db.set("panel.mensagem.content", !await db.get("panel.mensagem.content"));
            panelConfig(interaction);
        }

        // Alterar botão/select
        if(customId === "alterarbotaoselect") {
            await interaction.deferUpdate();
            await db.set("panel.button", !await db.get("panel.button"));
            panelConfig(interaction);
        }

        // Resetar tudo
        if(customId === "resetartudofunction") {
            const modal = new ModalBuilder()
            .setCustomId("resetartudofunctionmodal")
            .setTitle("Resetar Tudo");

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Você tem certeza?")
            .setStyle(1)
            .setMaxLength(3)
            .setRequired(true)
            .setMinLength(3)
            .setPlaceholder("sim");

            modal.addComponents(new ActionRowBuilder().addComponents(text));

            return interaction.showModal(modal);
        }

        // Confirmar reset
        if(customId === "resetartudofunctionmodal") {
            const text = interaction.fields.getTextInputValue("text").toLowerCase();
            await interaction.deferUpdate();
            if(text !== "sim") return;

            await db.set("panel", {
                "mensagem": {
                    "content": false,
                    "embeds": {
                        "title": "Não Definido",
                        "desc": "Não Definido",
                        "banner": null,
                        "cor": "#00FFFF"
                    },
                    "msg": {
                        "content": "Não Definido",
                        "banner": null
                    }
                },
                "functions": {},
                "button": false,
                "messages": []
            });
            panelConfig(interaction);
        }
        
        // Adicionar função
        if(customId === "addfunction") {
            const modal = new ModalBuilder()
            .setCustomId("addfunctionmodal")
            .setTitle("Adicionar Função");

            const nome = new TextInputBuilder()
            .setCustomId("nome")
            .setStyle(1)
            .setLabel("Nome da função")
            .setRequired(true)
            .setMaxLength(40)
            .setPlaceholder("Ex: Suporte, Compra");

            const predesc = new TextInputBuilder()
            .setCustomId("predesc")
            .setLabel("Pré-descrição")
            .setStyle(1)
            .setRequired(true)
            .setMaxLength(60)
            .setPlaceholder("Descrição curta");

            const desc = new TextInputBuilder()
            .setCustomId("desc")
            .setLabel("Descrição completa")
            .setRequired(false)
            .setMaxLength(4000)
            .setStyle(2)
            .setPlaceholder("Descrição detalhada");

            const banner = new TextInputBuilder()
            .setCustomId("banner")
            .setLabel("Banner (opcional)")
            .setRequired(false)
            .setPlaceholder("URL da imagem")
            .setStyle(1);

            const emoji = new TextInputBuilder()
            .setCustomId("emoji")
            .setLabel("Emoji (opcional)")
            .setStyle(1)
            .setPlaceholder("🎫")
            .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nome),
                new ActionRowBuilder().addComponents(predesc),
                new ActionRowBuilder().addComponents(desc),
                new ActionRowBuilder().addComponents(banner),
                new ActionRowBuilder().addComponents(emoji)
            );

            return interaction.showModal(modal);
        }

        // Salvar nova função
        if(customId === "addfunctionmodal") {
            const nome = interaction.fields.getTextInputValue("nome");
            const predesc = interaction.fields.getTextInputValue("predesc");
            const desc = interaction.fields.getTextInputValue("desc") || "Não Definido";
            const banner = interaction.fields.getTextInputValue("banner") || null;
            const emoji = interaction.fields.getTextInputValue("emoji") || null;
            await interaction.deferUpdate();
            
            if(await db.get(`panel.functions.${nome}`)) {
                return interaction.followUp({
                    content: "❌ Já existe uma função com este nome!",
                    ephemeral: true
                });
            }
            
            await db.set(`panel.functions.${nome}`, {
                "predesc": predesc,
                "desc": desc,
                "banner": banner,
                "emoji": emoji,
                "category": null
            });
            panelConfig(interaction);
        }

        // Editar função
        if(customId === "editfunction") {
            const panel = await db.get("panel");
            const all = Object.entries(panel.functions);
            const select = new StringSelectMenuBuilder()
            .setCustomId("editfunctionrsrs")
            .setPlaceholder("Selecione uma função para editar")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((a) => {
                const id = a["0"];
                const data = a["1"];
                select.addOptions({
                    label: `${id}`,
                    description: `${data.predesc}`,
                    value: id
                });
            });
            
            interaction.update({
                embeds: [],
                content: `${interaction.user}, Qual função deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Remover função
        if(customId === "removefunction") {
            const panel = await db.get("panel");
            const all = Object.entries(panel.functions);
            const select = new StringSelectMenuBuilder()
            .setCustomId("removefunctionrsrs")
            .setPlaceholder("Selecione uma função para remover")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((a) => {
                const id = a["0"];
                const data = a["1"];
                select.addOptions({
                    label: `${id}`,
                    description: `${data.predesc}`,
                    value: id
                });
            });
            
            interaction.update({
                embeds: [],
                content: `${interaction.user}, Qual função deseja remover?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(select),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Confirmar remoção
        if(customId == "removefunctionrsrs") {
            const id = interaction.values[0];
            await interaction.deferUpdate();
            await db.delete(`panel.functions.${id}`);
            panelConfig(interaction);
        }

        // Selecionar função para editar
        if(customId === "editfunctionrsrs") {
            const id = interaction.values[0];
            const data = await db.get(`panel.functions.${id}`);
            
            const categoryChannel = data.category ? interaction.guild.channels.cache.get(data.category) : null;
            
            interaction.update({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`📝 Editando: ${id}`)
                    .setColor("#00FFFF")
                    .addFields(
                        {
                            name: "📋 Informações Atuais",
                            value: `**Pré-descrição:** \`${data.predesc}\`\n**Emoji:** ${data.emoji || "`Nenhum`"}\n**Categoria:** ${categoryChannel ? categoryChannel : "`Padrão`"}`
                        }
                    )
                    .setTimestamp()
                ],
                content: `${interaction.user}, O que deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId(`editinfo_${id}`)
                        .setLabel("Editar Info")
                        .setStyle(2)
                        .setEmoji("✏️"),
                        new ButtonBuilder()
                        .setCustomId(`editcategory_${id}`)
                        .setLabel("Definir Categoria")
                        .setStyle(2)
                        .setEmoji("📁"),
                        new ButtonBuilder()
                        .setCustomId("editfunction")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // Editar informações da função
        if(customId.startsWith("editinfo_")) {
            const id = customId.split("editinfo_")[1];
            const data = await db.get(`panel.functions.${id}`);
            
            const modal = new ModalBuilder()
            .setCustomId("editinfomodal_" + id)
            .setTitle("Editar Informações");

            const nome = new TextInputBuilder()
            .setCustomId("nome")
            .setStyle(1)
            .setLabel("Nome da função")
            .setRequired(true)
            .setValue(id)
            .setMaxLength(40);

            const predesc = new TextInputBuilder()
            .setCustomId("predesc")
            .setLabel("Pré-descrição")
            .setStyle(1)
            .setRequired(true)
            .setValue(data.predesc)
            .setMaxLength(60);

            const desc = new TextInputBuilder()
            .setCustomId("desc")
            .setLabel("Descrição")
            .setRequired(false)
            .setMaxLength(4000)
            .setStyle(2);
            if(data.desc !== "Não Definido") desc.setValue(data.desc);

            const banner = new TextInputBuilder()
            .setCustomId("banner")
            .setLabel("Banner (opcional)")
            .setRequired(false)
            .setStyle(1);
            if(data.banner) banner.setValue(data.banner);

            const emoji = new TextInputBuilder()
            .setCustomId("emoji")
            .setLabel("Emoji (opcional)")
            .setStyle(1)
            .setRequired(false);
            if(data.emoji) emoji.setValue(data.emoji);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nome),
                new ActionRowBuilder().addComponents(predesc),
                new ActionRowBuilder().addComponents(desc),
                new ActionRowBuilder().addComponents(banner),
                new ActionRowBuilder().addComponents(emoji)
            );

            return interaction.showModal(modal);
        }

        // Salvar edição de informações
        if(customId.startsWith("editinfomodal_")) {
            const id = customId.split("editinfomodal_")[1];
            const oldData = await db.get(`panel.functions.${id}`);
            const nome = interaction.fields.getTextInputValue("nome");
            const predesc = interaction.fields.getTextInputValue("predesc");
            const desc = interaction.fields.getTextInputValue("desc") || "Não Definido";
            const banner = interaction.fields.getTextInputValue("banner") || null;
            const emoji = interaction.fields.getTextInputValue("emoji") || null;
            await interaction.deferUpdate();
            
            await db.delete(`panel.functions.${id}`);
            await db.set(`panel.functions.${nome}`, {
                "predesc": predesc,
                "desc": desc,
                "banner": banner,
                "emoji": emoji,
                "category": oldData.category || null
            });
            panelConfig(interaction);
        }

        // Definir categoria da função
        if(customId.startsWith("editcategory_")) {
            const id = customId.split("editcategory_")[1];
            
            interaction.update({
                embeds: [],
                content: `📁 Selecione a categoria onde os tickets da função **${id}** serão criados:`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                        .setCustomId(`savecategory_${id}`)
                        .setChannelTypes(ChannelType.GuildCategory)
                        .setPlaceholder("Selecione uma categoria")
                        .setMaxValues(1)
                        .setMinValues(0)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId(`removecategory_${id}`)
                        .setLabel("Usar Categoria Padrão")
                        .setStyle(4)
                        .setEmoji("🗑️"),
                        new ButtonBuilder()
                        .setCustomId(`editfunctionback_${id}`)
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // Salvar categoria selecionada
        if(customId.startsWith("savecategory_")) {
            const id = customId.split("savecategory_")[1];
            await interaction.deferUpdate();
            
            if(interaction.values.length > 0) {
                await db.set(`panel.functions.${id}.category`, interaction.values[0]);
                await interaction.followUp({
                    content: `✅ Categoria definida com sucesso!`,
                    ephemeral: true
                });
            }
            
            // Voltar para o menu de edição
            const data = await db.get(`panel.functions.${id}`);
            const categoryChannel = data.category ? interaction.guild.channels.cache.get(data.category) : null;
            
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`📝 Editando: ${id}`)
                    .setColor("#00FFFF")
                    .addFields({
                        name: "📋 Informações Atuais",
                        value: `**Pré-descrição:** \`${data.predesc}\`\n**Emoji:** ${data.emoji || "`Nenhum`"}\n**Categoria:** ${categoryChannel ? categoryChannel : "`Padrão`"}`
                    })
                    .setTimestamp()
                ],
                content: `${interaction.user}, O que deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId(`editinfo_${id}`)
                        .setLabel("Editar Info")
                        .setStyle(2)
                        .setEmoji("✏️"),
                        new ButtonBuilder()
                        .setCustomId(`editcategory_${id}`)
                        .setLabel("Definir Categoria")
                        .setStyle(2)
                        .setEmoji("📁"),
                        new ButtonBuilder()
                        .setCustomId("editfunction")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // Remover categoria (usar padrão)
        if(customId.startsWith("removecategory_")) {
            const id = customId.split("removecategory_")[1];
            await interaction.deferUpdate();
            
            await db.set(`panel.functions.${id}.category`, null);
            
            await interaction.followUp({
                content: `✅ Categoria removida! Será usada a categoria padrão.`,
                ephemeral: true
            });
            
            // Voltar para o menu de edição
            const data = await db.get(`panel.functions.${id}`);
            const categoryChannel = data.category ? interaction.guild.channels.cache.get(data.category) : null;
            
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`📝 Editando: ${id}`)
                    .setColor("#00FFFF")
                    .addFields({
                        name: "📋 Informações Atuais",
                        value: `**Pré-descrição:** \`${data.predesc}\`\n**Emoji:** ${data.emoji || "`Nenhum`"}\n**Categoria:** ${categoryChannel ? categoryChannel : "`Padrão`"}`
                    })
                    .setTimestamp()
                ],
                content: `${interaction.user}, O que deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId(`editinfo_${id}`)
                        .setLabel("Editar Info")
                        .setStyle(2)
                        .setEmoji("✏️"),
                        new ButtonBuilder()
                        .setCustomId(`editcategory_${id}`)
                        .setLabel("Definir Categoria")
                        .setStyle(2)
                        .setEmoji("📁"),
                        new ButtonBuilder()
                        .setCustomId("editfunction")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // Voltar do menu de categoria
        if(customId.startsWith("editfunctionback_")) {
            const id = customId.split("editfunctionback_")[1];
            await interaction.deferUpdate();
            
            const data = await db.get(`panel.functions.${id}`);
            const categoryChannel = data.category ? interaction.guild.channels.cache.get(data.category) : null;
            
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`📝 Editando: ${id}`)
                    .setColor("#00FFFF")
                    .addFields({
                        name: "📋 Informações Atuais",
                        value: `**Pré-descrição:** \`${data.predesc}\`\n**Emoji:** ${data.emoji || "`Nenhum`"}\n**Categoria:** ${categoryChannel ? categoryChannel : "`Padrão`"}`
                    })
                    .setTimestamp()
                ],
                content: `${interaction.user}, O que deseja editar?`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId(`editinfo_${id}`)
                        .setLabel("Editar Info")
                        .setStyle(2)
                        .setEmoji("✏️"),
                        new ButtonBuilder()
                        .setCustomId(`editcategory_${id}`)
                        .setLabel("Definir Categoria")
                        .setStyle(2)
                        .setEmoji("📁"),
                        new ButtonBuilder()
                        .setCustomId("editfunction")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }
        
        // Definir aparência
        if(customId === "definitraparenciafunction") {
            const modal = new ModalBuilder()
            .setCustomId("definitraparenciafunctionmodal")
            .setTitle("Editar Aparência");
            const panel = await db.get("panel");

            if(panel.mensagem.content) {
                const content = new TextInputBuilder()
                .setCustomId("content")
                .setLabel("Mensagem")
                .setPlaceholder("Texto da mensagem")
                .setMaxLength(2000)
                .setStyle(2)
                .setRequired(true);

                const banner = new TextInputBuilder()
                .setCustomId("banner")
                .setLabel("Banner (opcional)")
                .setRequired(false)
                .setPlaceholder("URL da imagem")
                .setStyle(1);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(content),
                    new ActionRowBuilder().addComponents(banner)
                );
                return interaction.showModal(modal);
            } else {
                const title = new TextInputBuilder()
                .setCustomId("title")
                .setLabel("Título")
                .setRequired(true)
                .setMaxLength(200)
                .setStyle(1)
                .setPlaceholder("Ex: Central de Atendimento");
    
                const desc = new TextInputBuilder()
                .setCustomId("desc")
                .setLabel("Descrição")
                .setPlaceholder("Descrição do painel")
                .setStyle(2)
                .setRequired(true)
                .setMaxLength(4000);
    
                const banner = new TextInputBuilder()
                .setCustomId("banner")
                .setLabel("Banner (opcional)")
                .setRequired(false)
                .setPlaceholder("URL da imagem")
                .setStyle(1);
    
                const cor = new TextInputBuilder()
                .setCustomId("cor")
                .setLabel("Cor (opcional)")
                .setRequired(false)
                .setPlaceholder("#00FFFF")
                .setStyle(1);
    
                modal.addComponents(
                    new ActionRowBuilder().addComponents(title),
                    new ActionRowBuilder().addComponents(desc),
                    new ActionRowBuilder().addComponents(banner),
                    new ActionRowBuilder().addComponents(cor)
                );
    
                return interaction.showModal(modal);
            }
        }

        // Salvar aparência
        if(customId === "definitraparenciafunctionmodal") {
            const panel = await db.get("panel");
            
            if(panel.mensagem.content) {
                const content = interaction.fields.getTextInputValue("content");
                const banner = interaction.fields.getTextInputValue("banner") || null;
    
                await interaction.deferUpdate();
    
                await db.set("panel.mensagem.msg", {
                    content,
                    banner
                });
    
                panelConfig(interaction);
            } else {
                const title = interaction.fields.getTextInputValue("title");
                const desc = interaction.fields.getTextInputValue("desc");
                const banner = interaction.fields.getTextInputValue("banner") || null;
                const cor = interaction.fields.getTextInputValue("cor") || "#00FFFF";
    
                await interaction.deferUpdate();
    
                await db.set("panel.mensagem.embeds", {
                    title,
                    desc,
                    banner,
                    cor
                });
    
                panelConfig(interaction);
            }
        }

        // Testar mensagem
        if(customId === "testmsg") {
            await interaction.deferUpdate();
            const panel = await db.get("panel");
            const components = [];
            const all = Object.entries(panel.functions);
            const row = new ActionRowBuilder();
            
            all.forEach((rs) => {
                const id = rs["0"];
                const data = rs["1"];
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
                    .setPlaceholder("Selecione uma opção")
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
                    components,
                    ephemeral: true
                };
            } else {
                const m = panel.mensagem.embeds;
                const embed1 = new EmbedBuilder()
                .setTitle(m.title)
                .setDescription(m.desc)
                .setImage(m.banner)
                .setColor(m.cor);
        
                is = {
                    content: ``,
                    embeds: [embed1],
                    components,
                    ephemeral: true
                };
            }
            interaction.followUp(is);
        }

        // Postar mensagem
        if(customId === "postmsg") {
            interaction.update({
                content: `${interaction.user}, Selecione um canal:`,
                embeds: [],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ChannelSelectMenuBuilder()
                        .setCustomId("postmsgchannel")
                        .setMaxValues(1)
                        .setPlaceholder("Selecione um canal")
                        .setMinValues(1)
                        .setChannelTypes(ChannelType.GuildText)
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setStyle(2)
                        .setCustomId("configpanel")
                        .setEmoji("◀️")
                    )
                ]
            });
        }

        // Confirmar postagem
        if(customId === "postmsgchannel") {
            const channel = interaction.guild.channels.cache.get(interaction.values[0]);
            await interaction.update({
                content: `📤 Enviando mensagem...`,
                embeds: [],
                components: []
            });
            
            const panel = await db.get("panel");
            const components = [];
            const all = Object.entries(panel.functions);
            const row = new ActionRowBuilder();
            const select = new StringSelectMenuBuilder()
            .setCustomId("painel-ticket")
            .setPlaceholder("Selecione uma função")
            .setMaxValues(1)
            .setMinValues(1);

            all.forEach((rs) => {
                const id = rs["0"];
                const data = rs["1"];
                if(panel.button) {
                    const button = new ButtonBuilder()
                    .setCustomId(id)
                    .setLabel(`${id}`)
                    .setStyle(2);
        
                    if(data.emoji) button.setEmoji(data.emoji);
                    
                    row.addComponents(button);
                } else {
                    const a = {
                        label: `${id}`,
                        value: id,
                        description: `${data.predesc}`
                    }
                    if(data.emoji) a.emoji = data.emoji;
                    select.addOptions(a);
                }
            });
            
            if(all.length > 0) {
                if(!panel.button) {
                    components.push(
                        new ActionRowBuilder().addComponents(select)
                    );
                } else {
                    components.push(row);
                }
            }
        
            let is;
            if(panel.mensagem.content) {
                let files = [];
                if(panel.mensagem.msg.banner) {
                    files = [new AttachmentBuilder(panel.mensagem.msg.banner)];
                }
                is = {
                    content: `${panel.mensagem.msg.content}`,
                    components,
                    files
                };
            } else {
                const m = panel.mensagem.embeds;
                const embed1 = new EmbedBuilder()
                .setTitle(m.title)
                .setDescription(m.desc)
                .setImage(m.banner)
                .setColor(m.cor);
        
                is = {
                    content: ``,
                    embeds: [embed1],
                    components
                };
            }

            await channel.send(is);
            interaction.editReply({
                content: `✅ Mensagem enviada com sucesso!`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channel.url)
                        .setStyle(5)
                        .setLabel("Ver Mensagem")
                        .setEmoji("🔗")
                    )
                ],
                embeds: []
            });
        }
    }
}