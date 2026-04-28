Const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType,
    ChannelType
} = require('discord.js');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES | Sunucu Yapılandırma', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('⚡ Sunucu Klonlama Sistemi')
            .setDescription(
                `Aşağıdaki butona bastığınızda kurulum sihirbazı açılacaktır.\n\n` +
                `**Dikkat:** Hedef sunucudaki tüm kanallar silinecek ve kaynak sunucunun aynısı oluşturulacaktır.`
            )
            .setFooter({ text: 'FORCES Development' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_clone_start')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🛠️')
        );

        const response = await message.reply({ embeds: [embed], components: [row] });

        // --- OTOMATİK EVENT DİNLEYİCİ ---
        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.isButton() && int.customId === 'btn_clone_start') {
                    const modal = new ModalBuilder().setCustomId('modal_clone_config').setTitle('Klonlama Ayarları');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('src_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('trg_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    await int.showModal(modal);
                }

                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_clone_config') {
                    await int.deferReply({ ephemeral: true });

                    const sourceGuildId = int.fields.getTextInputValue('src_id');
                    const targetGuildId = int.fields.getTextInputValue('trg_id');

                    const sourceGuild = client.guilds.cache.get(sourceGuildId);
                    const targetGuild = client.guilds.cache.get(targetGuildId);

                    if (!sourceGuild || !targetGuild) {
                        return int.editReply({ content: '❌ Botun her iki sunucuda da olması gerekir!' });
                    }

                    try {
                        // 1. ADIM: Hedef Sunucuyu Temizle
                        const targetChannels = await targetGuild.channels.fetch();
                        for (const channel of targetChannels.values()) {
                            await channel.delete().catch(() => {});
                        }

                        // 2. ADIM: Kategorileri ve Kanalları Kopyala
                        const sourceChannels = await sourceGuild.channels.fetch();
                        
                        // Önce Kategorileri Oluştur
                        const categories = sourceChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
                        
                        for (const cat of categories.values()) {
                            const newCat = await targetGuild.channels.create({
                                name: cat.name,
                                type: ChannelType.GuildCategory,
                                permissionOverwrites: cat.permissionOverwrites.cache.map(p => ({
                                    id: p.id,
                                    allow: p.allow.toArray(),
                                    deny: p.deny.toArray()
                                }))
                            });

                            // Kategoriye Ait Kanalları Oluştur
                            const children = sourceChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                            for (const child of children.values()) {
                                await targetGuild.channels.create({
                                    name: child.name,
                                    type: child.type,
                                    parent: newCat.id,
                                    topic: child.topic,
                                    nsfw: child.nsfw,
                                    rateLimitPerUser: child.rateLimitPerUser,
                                    permissionOverwrites: child.permissionOverwrites.cache.map(p => ({
                                        id: p.id,
                                        allow: p.allow.toArray(),
                                        deny: p.deny.toArray()
                                    }))
                                });
                                // Rate limit yememek için kısa bekleme
                                await new Promise(r => setTimeout(r, 500));
                            }
                        }

                        // Kategoriye ait olmayan (boştaki) kanalları oluştur
                        const orphanChannels = sourceChannels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
                        for (const orphan of orphanChannels.values()) {
                            await targetGuild.channels.create({
                                name: orphan.name,
                                type: orphan.type,
                                topic: orphan.topic,
                                permissionOverwrites: orphan.permissionOverwrites.cache.map(p => ({
                                    id: p.id,
                                    allow: p.allow.toArray(),
                                    deny: p.deny.toArray()
                                }))
                            });
                        }

                        await int.editReply({ content: '✅ Sunucu başarıyla kopyalandı!' });

                    } catch (error) {
                        console.error(error);
                        await int.editReply({ content: '❌ İşlem sırasında bir hata oluştu. Yetkileri kontrol edin.' });
                    }
                }
            });
            client.kurListenerSet = true;
        }
