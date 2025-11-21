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
    AttachmentBuilder, 
    UserSelectMenuBuilder 
} = require("discord.js");
const { db, owner, tk } = require("../../database/index");
const { panel, roleStaff, channelConfig, functionTicket, panelConfig } = require("../../function/panel");
const { formatDate, genProtocol, createTranscript } = require("../../utils/functions");

module.exports = {
    name: "interactionCreate",
    run: async(interaction, client) => {
        const { customId, user, guild, channel, member } = interaction;
        if(!customId) return;

        // ============================================================
        // FUNÇÃO AUXILIAR PARA ATUALIZAR LOG
        // ============================================================
        async function updateTicketLog(ticketChannel, ticket, action, user, extraInfo = {}) {
            const definition = await db.get("definition");
            const logs = client.channels.cache.get(definition.channels.logs);
            if(!logs) return;

            const logMessageId = ticket.logMessageId;
            
            let actionText = "";
            let color = "#00FFFF";
            
            switch(action) {
                case "opened":
                    actionText = `🟢 **Ticket Aberto**\n👤 Por: ${user.username}`;
                    color = "#00FF00";
                    break;
                case "assumed":
                    actionText = `✋ **Ticket Assumido**\n👷 Por: ${user.username}`;
                    color = "#FFA500";
                    break;
                case "closed":
                    actionText = `🔴 **Ticket Fechado**\n🔒 Por: ${user.username}`;
                    color = "#FF0000";
                    break;
                case "user_left":
                    actionText = `🚪 **Usuário Saiu**\n👤 ${user.username} saiu do ticket`;
                    color = "#FFA500";
                    break;
                case "member_added":
                    actionText = `➕ **Membro Adicionado**\n👤 ${extraInfo.targetUser} foi adicionado`;
                    color = "#00FF00";
                    break;
                case "member_removed":
                    actionText = `➖ **Membro Removido**\n👤 ${extraInfo.targetUser} foi removido`;
                    color = "#FF0000";
                    break;
                case "renamed":
                    actionText = `✏️ **Canal Renomeado**\n📝 Novo nome: ${extraInfo.newName}`;
                    color = "#00FFFF";
                    break;
                case "call_created":
                    actionText = `📞 **Call Criada**\n🎧 Call de voz iniciada`;
                    color = "#00FF00";
                    break;
                case "call_deleted":
                    actionText = `📞 **Call Deletada**\n🎧 Call de voz encerrada`;
                    color = "#FF0000";
                    break;
            }

            const embed = new EmbedBuilder()
                .setTitle(`📋 Ticket #${ticket.protocolo}`)
                .setColor(color)
                .addFields(
                    {
                        name: "👤 Criado por:",
                        value: `<@${ticket.owner.id}> | \`${ticket.owner.username}\``,
                        inline: true
                    },
                    {
                        name: "🔧 Assumido por:",
                        value: ticket.assumido ? `<@${ticket.assumido}>` : "`Ninguém`",
                        inline: true
                    },
                    {
                        name: "📂 Status:",
                        value: action === "closed" ? "🔴 `Fechado`" : "🟢 `Aberto`",
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
                    },
                    {
                        name: "📊 Última Atualização:",
                        value: actionText,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: "Carol Store - Sistema de Tickets" });

            const components = [];
            
            if(action === "closed") {
                if(extraInfo.transcriptUrl) {
                    console.log("✅ Adicionando botão do transcript");
                    components.push(
                        new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setURL(extraInfo.transcriptUrl)
                            .setLabel("Ver Transcript Online")
                            .setStyle(5)
                            .setEmoji("🌐")
                        )
                    );
                }
            } else {
                components.push(
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(ticketChannel.url)
                        .setLabel("Ir ao Ticket")
                        .setStyle(5)
                        .setEmoji("🎫")
                    )
                );
            }

            try {
                if(logMessageId) {
                    const logMessage = await logs.messages.fetch(logMessageId).catch(() => null);
                    if(logMessage) {
                        await logMessage.edit({
                            embeds: [embed],
                            components
                        });
                    }
                } else {
                    const newLogMessage = await logs.send({
                        embeds: [embed],
                        components
                    });
                    await tk.set(`${ticketChannel.id}.logMessageId`, newLogMessage.id);
                }
            } catch(error) {
                console.error("❌ Erro ao atualizar log:", error);
            }
        }
        
        // ============================================================
        // ABRIR TICKET (SEM MOTIVO)
        // ============================================================
        if(interaction.isStringSelectMenu() && customId === "painel-ticket" || interaction.isButton() && await db.get(`panel.functions.${customId}`)) {
            const panel = await db.get("panel");
            const definition = await db.get("definition");
            let ids;
            
            if(interaction.isStringSelectMenu()) {
                ids = interaction.values[0];
            } else {
                ids = customId;
            }
            
            const functionTicket = panel.functions[ids];
            if(!functionTicket) return interaction.reply({
                content: `❌ **| Não encontrei este Painel.**`, 
                flags: 64
            });
            
            const channelTicket = interaction.guild.channels.cache.find(a => a.topic === `TICKET - ${interaction.user.id} | ${interaction.user.username}`);
            if(channelTicket) return interaction.reply({
                content: `❌ **| Você já tem um Ticket!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channelTicket.url)
                        .setLabel("Ir ao Ticket")
                        .setEmoji("🎫")
                        .setStyle(5)
                    )
                ],
                flags: 64
            });
            
            if(!await db.get("system")) return interaction.reply({
                content: `❌ **| Sistema desabilitado.**`, 
                flags: 64
            });

            if(definition.functionsTicket.motivo) {
                const modal = new ModalBuilder()
                .setCustomId("ts" + ids)
                .setTitle("Motivo do Ticket");

                const text = new TextInputBuilder()
                .setCustomId("motivo")
                .setLabel("Qual motivo?")
                .setStyle(1)
                .setRequired(true)
                .setPlaceholder("Digite o motivo...");

                modal.addComponents(new ActionRowBuilder().addComponents(text));

                return interaction.showModal(modal);
            }

            await interaction.reply({
                content: `🔁 **| Criando seu Ticket...**`, 
                flags: 64
            });
            
            const functionCategory = functionTicket.category;
            const parent = functionCategory ? 
                guild.channels.cache.get(functionCategory)?.id : 
                guild.channels.cache.get(definition.channels.category)?.id || channel.parent;
            
            const desc = functionTicket.desc === "Não Definido" ? 
                `- Olá ${interaction.user}, Bem-Vindo ao atendimento.` : 
                functionTicket.desc;
            
            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: owner,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            ];
            
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push({
                id: role.id,
                allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
            });
            
            let msg = `${interaction.user} `;
            if(role) msg += `${role}`;

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("🚪"),
            );
            
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setEmoji("✋"),
            );
            
            const { notifyuser, assumir, call, renomear, gerenciar, motivo } = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar) row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("🛠️"),
            );
            
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(4)
                .setEmoji("🗑️"),
            );

            const ticketChannel = await interaction.guild.channels.create({
                name: `📂・${interaction.user.username}`,
                topic: `TICKET - ${interaction.user.id} | ${interaction.user.username}`,
                permissionOverwrites,
                parent,
            });

            await ticketChannel.send({
                content: `${msg}`,
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({ text: "Aguarde atendimento", iconURL: member.displayAvatarURL() })
                    .setTimestamp()
                    .addFields({
                        name: "📂 Motivo:",
                        value: `\`${ids}\``
                    })
                ],
                components: [row]
            });
            
            const protocolo = genProtocol(12);

            interaction.editReply({
                content: `✅ **| Ticket aberto!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(ticketChannel.url)
                        .setLabel("Ir ao Ticket")
                        .setStyle(5)
                        .setEmoji("🎫")
                    )
                ]
            });
            
            const ticketData = {
                owner: {
                    username: user.username,
                    id: user.id
                },
                type: ids,
                assumido: null,
                protocolo,
                motivo: ids,
                data: formatDate(new Date()),
                logMessageId: null
            };
            
            await tk.set(`${ticketChannel.id}`, ticketData);
            await updateTicketLog(ticketChannel, ticketData, "opened", user);
        }

        // ============================================================
        // ABRIR TICKET (COM MOTIVO)
        // ============================================================
        if(customId.startsWith("ts")) {
            const ids = customId.split("ts")[1];
            const panel = await db.get("panel");
            const definition = await db.get("definition");
            const functionTicket = panel.functions[ids];
            const motivo = interaction.fields.getTextInputValue("motivo");
            const channelTicket = interaction.guild.channels.cache.find(a => a.topic === `TICKET - ${interaction.user.id} | ${interaction.user.username}`);
            
            if(!functionTicket) return interaction.reply({
                content: `❌ **| Painel não encontrado.**`, 
                flags: 64
            });
            
            if(channelTicket) return interaction.reply({
                content: `❌ **| Você já tem um Ticket!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(channelTicket.url)
                        .setLabel("Ir ao Ticket")
                        .setEmoji("🎫")
                        .setStyle(5)
                    )
                ],
                flags: 64
            });
            
            if(!await db.get("system")) return interaction.reply({
                content: `❌ **| Sistema desabilitado.**`, 
                flags: 64
            });
            
            await interaction.reply({
                content: `🔁 **| Criando Ticket...**`, 
                flags: 64
            });
            
            const functionCategory = functionTicket.category;
            const parent = functionCategory ? 
                guild.channels.cache.get(functionCategory)?.id : 
                guild.channels.cache.get(definition.channels.category)?.id || channel.parent;
            
            const desc = functionTicket.desc === "Não Definido" ? 
                `- Olá ${interaction.user}, Bem-Vindo.` : 
                functionTicket.desc;
            
            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: owner,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles"]
                },
            ];
            
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push({
                id: role.id,
                allow: ["ViewChannel", "SendMessages", "AttachFiles", "ReadMessageHistory"]
            });
            
            let msg = `${interaction.user} `;
            if(role) msg += `${role}`;

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("🚪"),
            );
            
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setEmoji("✋"),
            );
            
            const { notifyuser, assumir, call, renomear, gerenciar } = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar) row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("🛠️"),
            );
            
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(4)
                .setEmoji("🗑️"),
            );

            const ticketChannel = await interaction.guild.channels.create({
                name: `📂・${interaction.user.username}`,
                topic: `TICKET - ${interaction.user.id} | ${interaction.user.username}`,
                permissionOverwrites,
                parent,
            });

            await ticketChannel.send({
                content: `${msg}`,
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({ text: "Aguarde atendimento", iconURL: member.displayAvatarURL() })
                    .setTimestamp()
                    .addFields({
                        name: "📂 Motivo:",
                        value: `\`${motivo}\``
                    })
                ],
                components: [row]
            });
            
            const protocolo = genProtocol(12);

            interaction.editReply({
                content: `✅ **| Ticket aberto!**`,
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setURL(ticketChannel.url)
                        .setLabel("Ir ao Ticket")
                        .setStyle(5)
                        .setEmoji("🎫")
                    )
                ]
            });
            
            const ticketData = {
                owner: {
                    username: user.username,
                    id: user.id
                },
                type: ids,
                assumido: null,
                protocolo,
                motivo,
                data: formatDate(new Date()),
                logMessageId: null
            };
            
            await tk.set(`${ticketChannel.id}`, ticketData);
            await updateTicketLog(ticketChannel, ticketData, "opened", user);
        }

        // ============================================================
        // SAIR DO TICKET
        // ============================================================
        if(customId === "sair_ticket") {
            const ticket = await tk.get(channel.id);
            await interaction.deferUpdate();
            if(ticket.owner.id !== interaction.user.id) return;
            
            await channel.permissionOverwrites.edit(user.id, {
                ViewChannel: false,
                SendMessages: false,
            });
            
            const definition = await db.get("definition");

            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji("🚪"),
            );
            
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setStyle(2)
                .setDisabled(true)
                .setEmoji("✋"),
            );
            
            const { notifyuser, assumir, call, renomear, gerenciar } = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar) row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("🛠️"),
            );
            
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(4)
                .setDisabled(true)
                .setEmoji("🗑️"),
            );

            await interaction.editReply({
                components: [row]
            });

            channel.send({
                embeds: [
                    new EmbedBuilder()
                    .setColor("DarkPurple")
                    .setTitle("Ticket Finalizado")
                    .setDescription(`Usuário saiu.`)
                ],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("deletar_ticket")
                        .setLabel("Deletar")
                        .setStyle(4)
                        .setEmoji("🗑️"),
                    )
                ]
            });
            
            await updateTicketLog(channel, ticket, "user_left", user);
        }

        // ============================================================
        // DELETAR TICKET COM TRANSCRIPT
        // ============================================================
        if(customId == "deletar_ticket") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);

            const actionId = `close_${channel.id}_${Date.now()}`;
            
            try {
                await client.anticrash.addPendingAction(actionId, {
                    type: 'close_ticket',
                    channelId: channel.id,
                    ticketData: ticket,
                    userId: user.id,
                    guildId: guild.id
                });

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle("🔄 Fechando Ticket...")
                        .setDescription("Gerando transcript...")
                        .setColor("#FFA500")
                    ],
                    components: []
                });

                console.log("📝 Gerando transcript...");
                const transcriptData = await createTranscript(channel, ticket, client);
                
                const logs = interaction.client.channels.cache.get(definition.channels.logs);
                let transcriptWebUrl = null;
                
                if(logs && transcriptData) {
                    try {
                        console.log("📤 Enviando transcript...");
                        
                        await logs.send({
                            content: `📄 **Transcript #${ticket.protocolo}** (Backup)\n👤 <@${ticket.owner.id}>\n🔒 ${user}\n⏰ \`${formatDate(new Date())}\``,
                            files: [transcriptData.attachment]
                        });
                        
                        transcriptWebUrl = transcriptData.webUrl;
                        console.log("✅ Transcript disponível em:", transcriptWebUrl);
                    } catch(error) {
                        console.error("❌ Erro transcript:", error);
                        await client.anticrash.logError('Erro transcript', error);
                    }
                }
                
                if(transcriptWebUrl) {
                    await updateTicketLog(channel, ticket, "closed", user, { transcriptUrl: transcriptWebUrl });
                } else {
                    await updateTicketLog(channel, ticket, "closed", user);
                }

                const ownerUser = interaction.client.users.cache.get(ticket.owner.id);
                if(ownerUser && transcriptData) {
                    try {
                        console.log("📨 Enviando DM...");
                        
                        const components = [
                            new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("stars_1")
                                .setLabel("1")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_2")
                                .setLabel("2")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_3")
                                .setLabel("3")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_4")
                                .setLabel("4")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_5")
                                .setStyle(3)
                                .setLabel("5")
                                .setEmoji("⭐")
                            )
                        ];
                        
                        if(transcriptWebUrl) {
                            components.unshift(
                                new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                    .setURL(transcriptWebUrl)
                                    .setLabel("Ver Transcript Online")
                                    .setStyle(5)
                                    .setEmoji("🌐")
                                )
                            );
                        }
                        
                        const msgSent = await ownerUser.send({
                            embeds: [
                                new EmbedBuilder()
                                .setTitle("🔒 Ticket Fechado")
                                .setColor("#00FFFF")
                                .setDescription(`Seu ticket foi fechado. ${transcriptWebUrl ? 'Clique no botão abaixo para visualizar online.' : 'Histórico anexado.'}`)
                                .addFields(
                                    {
                                        name: "👤 Fechado por:",
                                        value: `${user}`,
                                        inline: true
                                    },
                                    {
                                        name: "📂 Protocolo:",
                                        value: `#${ticket.protocolo}`,
                                        inline: true
                                    },
                                    {
                                        name: "🕒 Data:",
                                        value: `\`${formatDate(new Date())}\``,
                                        inline: true
                                    }
                                )
                                .setFooter({ text: `Avalie!` })
                                .setTimestamp()
                            ],
                            files: [transcriptData.attachment],
                            components
                        });
                        
                        await tk.set(`${msgSent.id}`, ticket);
                        console.log("✅ DM enviada!");
                    } catch (err) {
                        console.log("⚠️ DM bloqueada");
                    }
                }

                if(channels) await channels.delete().catch(() => {});
                
                console.log("⏳ Aguardando 5s...");
                setTimeout(async () => {
                    try {
                        await channel.delete();
                        await tk.delete(channel.id);
                        await client.anticrash.removePendingAction(actionId);
                        console.log("✅ Fechado!");
                    } catch(error) {
                        console.error("❌ Erro deletar:", error);
                        await client.anticrash.logError('Erro deletar', error);
                    }
                }, 5000);
                
            } catch(error) {
                console.error("❌ Erro crítico:", error);
                await client.anticrash.logError('Erro crítico', error);
                await client.anticrash.removePendingAction(actionId);
            }
        }

        // ============================================================
        // AVALIAÇÃO COM ESTRELAS
        // ============================================================
        if(customId.startsWith("stars_")) {
            const star = customId.split("stars_")[1];
            
            const modal = new ModalBuilder()
            .setCustomId(`starsmodal_${star}`)
            .setTitle("Avaliação");

            const text = new TextInputBuilder()
            .setCustomId("text")
            .setLabel("Deixe sua avaliação")
            .setStyle(2)
            .setPlaceholder("Digite...")
            .setRequired(true)
            .setMinLength(10)
            .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(text));

            return interaction.showModal(modal);
        }

        // ============================================================
        // PROCESSAR AVALIAÇÃO
        // ============================================================
        if(customId.startsWith("starsmodal_")) {
            const star = customId.split("starsmodal_")[1];
            const repeat = `⭐`.repeat(Number(star));
            await interaction.update({ components: [] });
            
            const ticket = await tk.get(interaction.message.id);
            const definition = await db.get("definition");
            const feedback = interaction.client.channels.cache.get(definition.channels.feedback);
            
            if(feedback) {
                await feedback.send({
                    embeds: [
                        new EmbedBuilder()
                        .setColor("Random")
                        .setTitle(`${feedback.guild.name} - Nova Avaliação`)
                        .addFields(
                            {
                                name: "👤 | Usuário",
                                value: `${user} | \`${user.username}\``,
                                inline: true
                            },
                            {
                                name: "⭐ | Avaliação",
                                value: `${repeat} (${star}/5)`,
                                inline: true
                            },
                            {
                                name: "🔧 | Atendido por",
                                value: `${ticket.assumido ? `<@${ticket.assumido}>` : "`Não Assumido`"}`,
                                inline: true
                            },
                            {
                                name: "✍️ | Feedback",
                                value: `\`\`\`${interaction.fields.getTextInputValue("text")}\`\`\``,
                                inline: false
                            },
                            {
                                name: "🕒 | Data",
                                value: `\`${formatDate(new Date())}\``,
                                inline: false
                            }
                        )
                        .setFooter({ text: `Protocolo: #${ticket.protocolo}` })
                        .setTimestamp()
                    ]
                });
            }
            
            await interaction.followUp({
                content: "✅ **Obrigado!**",
                flags: 64
            });
        }

        // ============================================================
        // ASSUMIR TICKET
        // ============================================================
        if(customId === "assumir_ticket") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const panel = await db.get("panel");
            const ids = ticket.type;
            const functionTicket = panel.functions[ids];

            const desc = functionTicket.desc === "Não Definido" ? 
                `- Olá <@${ticket.owner.id}>, Bem-Vindo.` : 
                functionTicket.desc;

            if(!member.roles.cache.has(definition.role) && interaction.user.id !== owner) {
                return interaction.deferUpdate();
            }

            await tk.set(`${channel.id}.assumido`, interaction.user.id);
            
            const row = new ActionRowBuilder();
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("sair_ticket")
                .setLabel("Sair")
                .setStyle(2)
                .setEmoji("🚪"),
            );
            
            if(definition.functionsTicket.assumir) row.addComponents(
                new ButtonBuilder()
                .setCustomId("assumir_ticket")
                .setLabel("Assumir")
                .setDisabled(true)
                .setStyle(2)
                .setEmoji("✋"),
            );
            
            const { notifyuser, assumir, call, renomear, gerenciar } = definition.functionsTicket;
            if(notifyuser || call || renomear || gerenciar) row.addComponents(
                new ButtonBuilder()
                .setCustomId("painel_staff")
                .setLabel("Painel Staff")
                .setStyle(2)
                .setEmoji("🛠️"),
            );
            
            row.addComponents(
                new ButtonBuilder()
                .setCustomId("deletar_ticket")
                .setLabel("Deletar")
                .setStyle(4)
                .setEmoji("🗑️"),
            );
            
            interaction.update({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                    .setDescription(`${desc}`)
                    .setColor("#00FFFF")
                    .setImage(functionTicket.banner)
                    .setFooter({ text: "Sistema de ticket", iconURL: member.displayAvatarURL() })
                    .setTimestamp()
                    .addFields(
                        {
                            name: "📂 Motivo:",
                            value: `\`${ticket.motivo || ticket.type}\``
                        },
                        {
                            name: "👷 Assumido por:",
                            value: `${user} | \`@${user.username}\``
                        }
                    )
                ],
                components: [row]
            });
            
            const updatedTicket = await tk.get(channel.id);
            await updateTicketLog(channel, updatedTicket, "assumed", user);
        }

        // ============================================================
        // PAINEL STAFF
        // ============================================================
        if(customId == "painel_staff") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const { notifyuser, call, renomear, gerenciar } = definition.functionsTicket;
            
            if(!member.roles.cache.has(definition.role) && interaction.user.id !== owner) {
                return interaction.deferUpdate();
            }
            
            const select = new StringSelectMenuBuilder()
            .setCustomId("panelstaff")
            .setPlaceholder("🔧 Selecione")
            .setMaxValues(1)
            .setMinValues(1);

            if(notifyuser) select.addOptions({
                label: "Notificar Usuário",
                description: "Notificar",
                emoji: "🔔",
                value: "notify"
            });

            if(gerenciar) {
                select.addOptions(
                    {
                        label: "Adicionar Membro",
                        value: "addmember",
                        description: "Adicionar",
                        emoji: "➕"
                    },
                    {
                        label: "Remover Membro",
                        value: "removemember",
                        description: "Remover",
                        emoji: "➖"
                    }
                );
            }

            if(renomear) select.addOptions({
                label: "Renomear",
                description: "Alterar nome",
                emoji: "✏️",
                value: "rename"
            });

            if(call) select.addOptions({
                label: "Chamada",
                description: "Gerenciar call",
                value: "panel_chamada",
                emoji: "📞"
            });

            interaction.reply({
                content: `Selecione:`,
                components: [new ActionRowBuilder().addComponents(select)],
                flags: 64
            });
        }

        // ============================================================
        // OPÇÕES DO PAINEL STAFF
        // ============================================================
        if(customId === "panelstaff") {
            const options = interaction.values[0];
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const ownerUser = interaction.client.users.cache.get(ticket.owner.id);

            if(options == "notify") {
                if(!ownerUser) return interaction.update({
                    content: `❌ **| Usuário não encontrado.**`,
                    components: []
                });
                
                ownerUser.send({
                    embeds: [
                        new EmbedBuilder()
                        .setDescription(`*Olá **${ownerUser}**, tem um staff te chamando!*`)
                        .setColor("#00FFFF")
                    ],
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setURL(channel.url)
                            .setLabel("Ir ao Ticket")
                            .setStyle(5)
                            .setEmoji("🎫")
                        )
                    ]
                }).then(() => {
                    interaction.update({
                        content: `✅ **| Notificado!**`,
                        components: []
                    });
                }).catch(() => {
                    interaction.update({
                        content: `❌ **| DM bloqueada!**`,
                        components: []
                    });
                });
            } else if(options === "addmember") {
                interaction.update({
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                            .setCustomId("addmemberselect")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Selecione")
                        )
                    ]
                });
            } else if(options == "removemember") {
                interaction.update({
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new UserSelectMenuBuilder()
                            .setCustomId("removememberselect")
                            .setMaxValues(1)
                            .setMinValues(1)
                            .setPlaceholder("Selecione")
                        )
                    ]
                });
            } else if(options === "rename") {
                const modal = new ModalBuilder()
                .setCustomId("renamemodal")
                .setTitle("Renomear");

                const text = new TextInputBuilder()
                .setCustomId("text")
                .setLabel("Novo nome:")
                .setStyle(1)
                .setRequired(true)
                .setMaxLength(60)
                .setPlaceholder("Ex: Pedido Entregue");

                modal.addComponents(new ActionRowBuilder().addComponents(text));

                return interaction.showModal(modal);
            } else if(options === "panel_chamada") {
                await interaction.deferUpdate();
                panelChamada();
            }
        }

        // ============================================================
        // RENOMEAR TICKET
        // ============================================================
        if(customId === "renamemodal") {
            const name = interaction.fields.getTextInputValue("text");
            await channel.setName(name);
            interaction.reply({ 
                content: `✅ Nome: \`${name}\``, 
                flags: 64
            });
            
            const ticket = await tk.get(channel.id);
            await updateTicketLog(channel, ticket, "renamed", user, { newName: name });
        }

        // ============================================================
        // REMOVER MEMBRO
        // ============================================================
        if(customId === "removememberselect") {
            const targetUser = interaction.guild.members.cache.get(interaction.values[0]);
            await interaction.channel.permissionOverwrites.edit(interaction.values[0], {
                ViewChannel: false,
                SendMessages: false,
            });
            await interaction.update({
                content: `✅ Removido!`,
                components: []
            });
            
            const ticket = await tk.get(channel.id);
            await updateTicketLog(channel, ticket, "member_removed", user, { targetUser: targetUser.user.username });
        }

        // ============================================================
        // ADICIONAR MEMBRO
        // ============================================================
        if(customId === "addmemberselect") {
            const targetUser = interaction.guild.members.cache.get(interaction.values[0]);
            await interaction.channel.permissionOverwrites.edit(interaction.values[0], {
                ViewChannel: true,
                SendMessages: true,
            });
            await interaction.update({
                content: `✅ Adicionado!`,
                components: []
            });
            
            const ticket = await tk.get(channel.id);
            await updateTicketLog(channel, ticket, "member_added", user, { targetUser: targetUser.user.username });
        }

        // ============================================================
        // CRIAR CHAMADA
        // ============================================================
        if(customId === "criarcall") {
            await interaction.deferUpdate();

            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");

            const permissionOverwrites = [
                {
                    id: interaction.client.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect", "Speak"]
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect", "Speak"]
                },
                {
                    id: ticket.owner.id,
                    allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect", "Speak"]
                },
                {
                    id: guild.id,
                    deny: ["ViewChannel", "SendMessages", "AttachFiles", "Connect"]
                },
            ];
            
            const role = interaction.guild.roles.cache.get(definition.role);
            if(role) permissionOverwrites.push({
                id: role.id,
                allow: ["ViewChannel", "SendMessages", "AttachFiles", "Connect", "Speak"]
            });
            
            await interaction.guild.channels.create({
                name: `📞・${ticket.owner.username}`,
                permissionOverwrites,
                parent: interaction.channel.parent,
                type: ChannelType.GuildVoice
            });
            
            await updateTicketLog(channel, ticket, "call_created", user);
            panelChamada();
        }

        // ============================================================
        // APAGAR CHAMADA
        // ============================================================
        if(customId === "apagarcall") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) await channels.delete().catch(() => {});
            
            await updateTicketLog(channel, ticket, "call_deleted", user);
            panelChamada();
        }

        // ============================================================
        // ADICIONAR USUÁRIO NA CALL
        // ============================================================
        if(customId === "addusercall") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                        .setCustomId("addusercallselect")
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder("Escolha")
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("newvolt")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // ============================================================
        // REMOVER USUÁRIO DA CALL
        // ============================================================
        if(customId === "removeusercall") {
            interaction.update({
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new UserSelectMenuBuilder()
                        .setCustomId("removeusercallselect")
                        .setMaxValues(1)
                        .setMinValues(1)
                        .setPlaceholder("Escolha")
                    ),
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId("newvolt")
                        .setEmoji("◀️")
                        .setStyle(2)
                    )
                ]
            });
        }

        // ============================================================
        // ADICIONAR USUÁRIO NA CALL (SELECT)
        // ============================================================
        if(customId === "addusercallselect") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) channels.permissionOverwrites.edit(interaction.values[0], {
                ViewChannel: true,
                SendMessages: true,
                Connect: true,
                Speak: true
            });
            panelChamada();
        }

        // ============================================================
        // REMOVER USUÁRIO DA CALL (SELECT)
        // ============================================================
        if(customId === "removeusercallselect") {
            await interaction.deferUpdate();
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            if(channels) channels.permissionOverwrites.edit(interaction.values[0], {
                ViewChannel: false,
                SendMessages: false,
                Connect: false,
                Speak: false
            });
            panelChamada();
        }

        // ============================================================
        // VOLTAR DO PAINEL DE CHAMADA
        // ============================================================
        if(customId == "newvolt") {
            await interaction.deferUpdate();
            panelChamada();
        }

        // ============================================================
        // FUNÇÃO AUXILIAR PARA PAINEL DE CHAMADA
        // ============================================================
        async function panelChamada() {
            const ticket = await tk.get(channel.id);
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            const row = new ActionRowBuilder();
            
            if(!channels) {
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("criarcall")
                    .setLabel("Criar Call")
                    .setStyle(3)
                    .setEmoji("📞"),
                    new ButtonBuilder()
                    .setCustomId("apagarcall")
                    .setLabel("Apagar")
                    .setStyle(4)
                    .setEmoji("🗑️")
                    .setDisabled(true),
                    new ButtonBuilder()
                    .setCustomId("addusercall")
                    .setLabel("Adicionar")
                    .setStyle(2)
                    .setEmoji("➕")
                    .setDisabled(true),
                    new ButtonBuilder()
                    .setCustomId("removeusercall")
                    .setLabel("Remover")
                    .setStyle(2)
                    .setEmoji("➖")
                    .setDisabled(true)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder()
                    .setURL(channels.url)
                    .setLabel("Ir Call")
                    .setStyle(5)
                    .setEmoji("🎧"),
                    new ButtonBuilder()
                    .setCustomId("apagarcall")
                    .setLabel("Apagar")
                    .setStyle(4)
                    .setEmoji("🗑️"),
                    new ButtonBuilder()
                    .setCustomId("addusercall")
                    .setLabel("Adicionar")
                    .setStyle(2)
                    .setEmoji("➕"),
                    new ButtonBuilder()
                    .setCustomId("removeusercall")
                    .setLabel("Remover")
                    .setStyle(2)
                    .setEmoji("➖")
                );
            }

            interaction.editReply({
                content: "",
                embeds: [
                    new EmbedBuilder()
                    .setTitle("📞 Painel de Chamada")
                    .setColor("#00FFFF")
                    .setDescription(`Selecione:`)
                    .addFields({
                        name: "Status",
                        value: `${channels ? "🟢 **Ativa**" : "🔴 **Inativa**"}`
                    })
                    .setTimestamp()
                ],
                components: [row]
            });
        }

        // ============================================================
        // HANDLERS DO COMANDO /ticket
        // ============================================================
        
        if(customId === "assumir_ticket_cmd") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const staffRoleId = definition.role;
            
            const hasStaffRole = staffRoleId && member.roles.cache.has(staffRoleId);
            const isOwner = interaction.user.id === owner;

            if(!hasStaffRole && !isOwner) {
                return interaction.reply({
                    content: `❌ **| Sem permissão!**\n📋 **Necessário:** ${staffRoleId ? `<@&${staffRoleId}>` : "`Cargo não configurado`"}`,
                    flags: 64
                });
            }

            if(ticket.assumido) {
                return interaction.reply({
                    content: `⚠️ **| Já assumido por** <@${ticket.assumido}>`,
                    flags: 64
                });
            }

            const panel = await db.get("panel");
            const ids = ticket.type;
            const functionTicket = panel.functions[ids];

            await interaction.deferUpdate();
            await tk.set(`${channel.id}.assumido`, interaction.user.id);
            
            const updatedTicket = await tk.get(channel.id);
            await updateTicketLog(channel, updatedTicket, "assumed", user);
            
            await interaction.followUp({
                content: `✅ **Assumido por ${user}!**`,
                flags: 64
            });

            const messages = await channel.messages.fetch({ limit: 10 });
            const systemMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title?.includes("Sistema de Ticket"));
            
            if(systemMessage) {
                const desc = functionTicket.desc === "Não Definido" ? 
                    `- Olá <@${ticket.owner.id}>, Bem-Vindo.` : 
                    functionTicket.desc;

                const row = new ActionRowBuilder();
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("sair_ticket")
                    .setLabel("Sair")
                    .setStyle(2)
                    .setEmoji("🚪")
                );
                
                if(definition.functionsTicket.assumir) {
                    row.addComponents(
                        new ButtonBuilder()
                        .setCustomId("assumir_ticket")
                        .setLabel("Assumir")
                        .setDisabled(true)
                        .setStyle(2)
                        .setEmoji("✋")
                    );
                }
                
                const { notifyuser, assumir, call, renomear, gerenciar } = definition.functionsTicket;
                if(notifyuser || call || renomear || gerenciar) {
                    row.addComponents(
                        new ButtonBuilder()
                        .setCustomId("painel_staff")
                        .setLabel("Painel Staff")
                        .setStyle(2)
                        .setEmoji("🛠️")
                    );
                }
                
                row.addComponents(
                    new ButtonBuilder()
                    .setCustomId("deletar_ticket")
                    .setLabel("Deletar")
                    .setStyle(4)
                    .setEmoji("🗑️")
                );

                try {
                    await systemMessage.edit({
                        embeds: [
                            new EmbedBuilder()
                            .setTitle(`Sistema de Ticket | ${interaction.guild.name}`)
                            .setDescription(`${desc}`)
                            .setColor("#00FFFF")
                            .setImage(functionTicket.banner)
                            .setFooter({ text: "Sistema de ticket", iconURL: interaction.member.displayAvatarURL() })
                            .setTimestamp()
                            .addFields(
                                {
                                    name: "📂 Motivo:",
                                    value: `\`${ticket.motivo || ticket.type}\``
                                },
                                {
                                    name: "👷 Assumido por:",
                                    value: `${user} | \`@${user.username}\``
                                }
                            )
                        ],
                        components: [row]
                    });
                } catch(error) {
                    console.error("❌ Erro ao atualizar:", error);
                }
            }
        }

        if(customId === "painel_staff_cmd") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const staffRoleId = definition.role;
            const { notifyuser, call, renomear, gerenciar } = definition.functionsTicket;
            
            const hasStaffRole = staffRoleId && member.roles.cache.has(staffRoleId);
            const isOwner = interaction.user.id === owner;

            if(!hasStaffRole && !isOwner) {
                return interaction.reply({
                    content: `❌ **| Sem permissão!**\n📋 **Necessário:** ${staffRoleId ? `<@&${staffRoleId}>` : "`Cargo não configurado`"}`,
                    flags: 64
                });
            }
            
            const select = new StringSelectMenuBuilder()
            .setCustomId("panelstaff")
            .setPlaceholder("🔧 Selecione")
            .setMaxValues(1)
            .setMinValues(1);

            if(notifyuser) select.addOptions({
                label: "Notificar Usuário",
                description: "Notificar",
                emoji: "🔔",
                value: "notify"
            });

            if(gerenciar) {
                select.addOptions(
                    {
                        label: "Adicionar Membro",
                        value: "addmember",
                        description: "Adicionar",
                        emoji: "➕"
                    },
                    {
                        label: "Remover Membro",
                        value: "removemember",
                        description: "Remover",
                        emoji: "➖"
                    }
                );
            }

            if(renomear) select.addOptions({
                label: "Renomear",
                description: "Alterar nome",
                emoji: "✏️",
                value: "rename"
            });

            if(call) select.addOptions({
                label: "Chamada",
                description: "Gerenciar call",
                value: "panel_chamada",
                emoji: "📞"
            });

            interaction.reply({
                content: `Selecione:`,
                components: [new ActionRowBuilder().addComponents(select)],
                flags: 64
            });
        }

        if(customId === "deletar_ticket_cmd") {
            const ticket = await tk.get(channel.id);
            const definition = await db.get("definition");
            const staffRoleId = definition.role;
            
            const hasStaffRole = staffRoleId && member.roles.cache.has(staffRoleId);
            const isOwner = interaction.user.id === owner;

            if(!hasStaffRole && !isOwner) {
                return interaction.reply({
                    content: `❌ **| Sem permissão!**\n📋 **Necessário:** ${staffRoleId ? `<@&${staffRoleId}>` : "`Cargo não configurado`"}`,
                    flags: 64
                });
            }

            await interaction.deferUpdate();
            
            const channels = guild.channels.cache.find(a => a.name === `📞・${ticket.owner.username}`);
            const actionId = `close_${channel.id}_${Date.now()}`;
            
            try {
                await client.anticrash.addPendingAction(actionId, {
                    type: 'close_ticket',
                    channelId: channel.id,
                    ticketData: ticket,
                    userId: user.id,
                    guildId: guild.id
                });

                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle("🔄 Fechando...")
                        .setDescription("Gerando transcript...")
                        .setColor("#FFA500")
                    ],
                    flags: 64
                });

                console.log("📝 Gerando transcript...");
                const transcriptData = await createTranscript(channel, ticket, client);
                
                const logs = interaction.client.channels.cache.get(definition.channels.logs);
                let transcriptWebUrl = null;
                
                if(logs && transcriptData) {
                    try {
                        console.log("📤 Enviando transcript...");
                        
                        await logs.send({
                            content: `📄 **Transcript #${ticket.protocolo}** (Backup)\n👤 <@${ticket.owner.id}>\n🔒 ${user}\n⏰ \`${formatDate(new Date())}\``,
                            files: [transcriptData.attachment]
                        });
                        
                        transcriptWebUrl = transcriptData.webUrl;
                        console.log("✅ Disponível em:", transcriptWebUrl);
                    } catch(error) {
                        console.error("❌ Erro transcript:", error);
                        await client.anticrash.logError('Erro transcript', error);
                    }
                }
                
                if(transcriptWebUrl) {
                    await updateTicketLog(channel, ticket, "closed", user, { transcriptUrl: transcriptWebUrl });
                } else {
                    await updateTicketLog(channel, ticket, "closed", user);
                }

                const ownerUser = interaction.client.users.cache.get(ticket.owner.id);
                if(ownerUser && transcriptData) {
                    try {
                        console.log("📨 Enviando DM...");
                        
                        const components = [
                            new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("stars_1")
                                .setLabel("1")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_2")
                                .setLabel("2")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_3")
                                .setLabel("3")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_4")
                                .setLabel("4")
                                .setStyle(2)
                                .setEmoji("⭐"),
                                new ButtonBuilder()
                                .setCustomId("stars_5")
                                .setStyle(3)
                                .setLabel("5")
                                .setEmoji("⭐")
                            )
                        ];
                        
                        if(transcriptWebUrl) {
                            components.unshift(
                                new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                    .setURL(transcriptWebUrl)
                                    .setLabel("Ver Transcript Online")
                                    .setStyle(5)
                                    .setEmoji("🌐")
                                )
                            );
                        }
                        
                        const msgSent = await ownerUser.send({
                            embeds: [
                                new EmbedBuilder()
                                .setTitle("🔒 Ticket Fechado")
                                .setColor("#00FFFF")
                                .setDescription(`Ticket fechado. ${transcriptWebUrl ? 'Clique no botão para ver online.' : 'Histórico anexado.'}`)
                                .addFields(
                                    {
                                        name: "👤 Fechado por:",
                                        value: `${user}`,
                                        inline: true
                                    },
                                    {
                                        name: "📂 Protocolo:",
                                        value: `#${ticket.protocolo}`,
                                        inline: true
                                    },
                                    {
                                        name: "🕒 Data:",
                                        value: `\`${formatDate(new Date())}\``,
                                        inline: true
                                    }
                                )
                                .setFooter({ text: `Avalie!` })
                                .setTimestamp()
                            ],
                            files: [transcriptData.attachment],
                            components
                        });
                        
                        await tk.set(`${msgSent.id}`, ticket);
                        console.log("✅ DM enviada!");
                    } catch (err) {
                        console.log("⚠️ DM bloqueada");
                    }
                }

                if(channels) await channels.delete().catch(() => {});
                
                console.log("⏳ Aguardando 5s...");
                setTimeout(async () => {
                    try {
                        await channel.delete();
                        await tk.delete(channel.id);
                        await client.anticrash.removePendingAction(actionId);
                        console.log("✅ Fechado!");
                    } catch(error) {
                        console.error("❌ Erro deletar:", error);
                        await client.anticrash.logError('Erro deletar', error);
                    }
                }, 5000);
                
            } catch(error) {
                console.error("❌ Erro crítico:", error);
                await client.anticrash.logError('Erro crítico', error);
                await client.anticrash.removePendingAction(actionId);
            }
        }
    }
}