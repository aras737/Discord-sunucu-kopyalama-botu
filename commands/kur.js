const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ChannelType 
} = require('discord.js');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: 'FORCES | Sunucu Klonlama', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('🚀 Kurulum Sihirbazı Hazır')
            .setDescription(
                `Bu işlem hedef sunucuyu tamamen temizleyip kaynak sunucunun **kanallarını, kategorilerini ve rollerini** kopyalar.\n\n` +
                `**Uyarı:** Bu işlem geri alınamaz!`
            )
            .setFooter({ text: 'FORCES Development • Güvenli Klonlama Sistemi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_clone_start')
                .setLabel('Sihirbazı Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛠️')
        );

        await message.reply({ embeds: [embed], components: [row] });

        const client = message.client;
        if (client.kurListenerSet) return;

        client.on('interactionCreate', async (int) => {
            // Modal Açma
            if (int.isButton() && int.customId === 'btn_clone_start') {
                const modal = new ModalBuilder().setCustomId('modal_clone_config').setTitle('Klonlama Ayarları');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('src_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('trg_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                );
                return await int.showModal(modal);
            }

            // İşlemi Başlatma
            if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_clone_config') {
                await int.deferReply({ ephemeral: true });

                const sourceGuild = client.guilds.cache.get(int.fields.getTextInputValue('src_id'));
                const targetGuild = client.guilds.cache.get(int.fields.getTextInputValue('trg_id'));

                if (!sourceGuild || !targetGuild) {
                    return int.editReply('❌ Bot her iki sunucuda da yönetici yetkisine sahip olmalıdır.');
                }

                try {
                    // 1. ADIM: Hedef Sunucuyu Temizle (Kanallar ve Roller)
                    const targetChannels = await targetGuild.channels.fetch();
                    for (const channel of targetChannels.values()) {
                        await channel.delete().catch(() => {});
                    }

                    // 2. ADIM: Rolleri Klonla (Opsiyonel ama izinler için gerekli)
                    const roleMap = new Map();
                    const sourceRoles = await sourceGuild.roles.fetch();
                    
                    // Önce rolleri oluştur ki kanal izinlerinde kullanabilelim
                    for (const role of sourceRoles.values()) {
                        if (role.managed || role.name === '@everyone') {
                            roleMap.set(role.id, targetGuild.roles.everyone.id);
                            continue;
                        }
                        const newRole = await targetGuild.roles.create({
                            name: role.name,
                            color: role.color,
                            hoist: role.hoist,
                            permissions: role.permissions,
                            mentionable: role.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(role.id, newRole.id);
                    }

                    // 3. ADIM: Kanalları Klonla
                    const sourceChannels = await sourceGuild.channels.fetch();
                    
                    // Fonksiyon: İzinleri Yeni Rollere Göre Düzenle
                    const getNewPermissions = (channel) => {
                        return channel.permissionOverwrites.cache.map(p => ({
                            id: roleMap.get(p.id) || p.id, // Eğer rol kopyalandıysa yeni ID'yi kullan
                            allow: p.allow.toArray(),
                            deny: p.deny.toArray()
                        })).filter(p => targetGuild.roles.cache.has(p.id)); // Sadece var olan roller/üyeler için
                    };

                    // Kategorileri Oluştur
                    const categories = sourceChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
                    
                    for (const cat of categories.values()) {
                        const newCat = await targetGuild.channels.create({
                            name: cat.name,
                            type: ChannelType.GuildCategory,
                            permissionOverwrites: getNewPermissions(cat)
                        });

                        const children = sourceChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                        for (const child of children.values()) {
                            await targetGuild.channels.create({
                                name: child.name,
                                type: child.type,
                                parent: newCat.id,
                                topic: child.topic,
                                nsfw: child.nsfw,
                                rateLimitPerUser: child.rateLimitPerUser,
                                permissionOverwrites: getNewPermissions(child)
                            });
                            await new Promise(r => setTimeout(r, 750)); // Rate limit koruması
                        }
                    }

                    await int.editReply({ content: '✅ **İşlem Tamamlandı!** Roller ve kanallar başarıyla senkronize edildi.' });

                } catch (error) {
                    console.error("Klonlama Hatası:", error);
                    await int.editReply({ content: '❌ Kritik bir hata oluştu. Konsolu kontrol et.' });
                }
            }
        });
        client.kurListenerSet = true;
    }
};
