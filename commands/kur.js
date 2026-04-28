const { 
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
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES | Ultra Sunucu Kopyalayıcı', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('⚡ Sunucu Klonlama Sihirbazı')
            .setDescription(
                `Aşağıdaki butona bastığınızda kurulum formu açılacaktır.\n\n` +
                `**Neler Yapılacak?**\n` +
                `▫️ Hedef sunucu tamamen sıfırlanacak.\n` +
                `▫️ Kaynak sunucunun rolleri ve kanalları taşınacak.\n` +
                `▫️ İşlem adımları size **DM üzerinden** anlık bildirilecek.`
            )
            .setFooter({ text: 'FORCES Development' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_clone_start')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛠️')
        );

        await message.reply({ embeds: [embed], components: [row] });

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.isButton() && int.customId === 'btn_clone_start') {
                    const modal = new ModalBuilder().setCustomId('modal_clone_config').setTitle('Klonlama Ayarları');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('token').setLabel('Hesap Tokeniniz').setStyle(TextInputStyle.Short).setPlaceholder('İşlem yapacak hesabın tokeni').setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('src_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('trg_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    await int.showModal(modal);
                }

                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_clone_config') {
                    await int.deferReply({ ephemeral: true });

                    const userToken = int.fields.getTextInputValue('token');
                    const sourceGuildId = int.fields.getTextInputValue('src_id');
                    const targetGuildId = int.fields.getTextInputValue('trg_id');

                    const self = new SelfClient({ checkUpdate: false });
                    const owner = int.user;

                    self.on('ready', async () => {
                        try {
                            const sourceGuild = self.guilds.cache.get(sourceGuildId);
                            const targetGuild = self.guilds.cache.get(targetGuildId);

                            if (!sourceGuild || !targetGuild) {
                                await owner.send("❌ **Hata:** Sunucular bulunamadı. Tokenin iki sunucuda da olduğundan emin ol.");
                                return self.destroy();
                            }

                            // --- BAŞLANGIÇ BİLDİRİMİ ---
                            await int.editReply({ content: '🚀 Klonlama işlemi başladı! DM kutunuzu kontrol edin.' });
                            await owner.send(`▶️ **Klonlama Başlatıldı:** \`${sourceGuild.name}\` -> \`${targetGuild.name}\``);

                            // 1. ADIM: İSİM VE İKON
                            await targetGuild.setName(sourceGuild.name).catch(() => {});
                            if (sourceGuild.iconURL()) await targetGuild.setIcon(sourceGuild.iconURL()).catch(() => {});
                            await owner.send("🖼️ **Bölüm 1:** Sunucu ismi ve ikonu güncellendi.");

                            // 2. ADIM: TEMİZLİK
                            await owner.send("🧹 **Bölüm 2:** Hedef sunucu temizleniyor, kanallar siliniyor...");
                            const targetChannels = await targetGuild.channels.fetch();
                            for (const channel of targetChannels.values()) {
                                await channel.delete().catch(() => {});
                                await new Promise(r => setTimeout(r, 500));
                            }

                            // 3. ADIM: KATEGORİLER VE KANALLAR
                            await owner.send("🏗️ **Bölüm 3:** Kanallar ve kategoriler inşa ediliyor...");
                            const sourceChannels = await sourceGuild.channels.fetch();
                            const categories = sourceChannels.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4).sort((a, b) => a.position - b.position);
                            
                            for (const cat of categories.values()) {
                                const newCat = await targetGuild.channels.create(cat.name, { type: 4 }).catch(() => null);
                                
                                if (newCat) {
                                    const children = sourceChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                                    for (const child of children.values()) {
                                        let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                                        await targetGuild.channels.create(child.name, { 
                                            type: type, 
                                            parent: newCat.id 
                                        }).catch(() => {});
                                        await new Promise(r => setTimeout(r, 1000));
                                    }
                                    await owner.send(`📁 **Kategori Oluşturuldu:** \`${cat.name}\` ve içindeki kanallar taşındı.`);
                                }
                            }

                            // 4. ADIM: BOŞTAKİ KANALLAR
                            const orphans = sourceChannels.filter(c => !c.parentId && c.type !== 'GUILD_CATEGORY' && c.type !== 4);
                            if (orphans.size > 0) {
                                for (const orphan of orphans.values()) {
                                    let type = (orphan.type === 'GUILD_VOICE' || orphan.type === 2) ? 2 : 0;
                                    await targetGuild.channels.create(orphan.name, { type: type }).catch(() => {});
                                }
                                await owner.send("📎 **Bölüm 4:** Kategorisiz kanallar oluşturuldu.");
                            }

                            await owner.send(`✅ **İŞLEM BAŞARIYLA BİTTİ!** \nSunucu \`${sourceGuild.name}\` artık hazır.`);
                            self.destroy();

                        } catch (error) {
                            await owner.send(`❌ **Hata:** ${error.message}`);
                            self.destroy();
                        }
                    });

                    self.login(userToken).catch(() => int.editReply({ content: '❌ Token geçersiz!' }));
                }
            });
            client.kurListenerSet = true;
        }
    }
};
