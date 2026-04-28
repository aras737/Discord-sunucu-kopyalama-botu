const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        // Interaction dinleyicisini bir kez tanımlıyoruz
        const client = message.client;
        if (!client.fullCopyListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_ultra_copy' || int.customId === 'modal_ultra_copy') {
                    await this.handleInteraction(int);
                }
            });
            client.fullCopyListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES Ultra Cloner v2026' })
            .setTitle('👑 Tam Teşekküllü Sunucu Kopyalama')
            .setDescription(
                `Bu komut şu işlemleri sırasıyla gerçekleştirir:\n\n` +
                `🖼️ **Kimlik:** Sunucu ismi ve ikonunu kopyalar.\n` +
                `🧹 **Temizlik:** Hedefteki tüm kanal ve kategorileri siler.\n` +
                `🏗️ **İnşa:** Kategorileri ve içindeki kanalları sırasıyla kurar.\n` +
                `📩 **Rapor:** Her adımda sana DM üzerinden bilgi verir.`
            )
            .setFooter({ text: 'İşlemi başlatmak için butona tıklayın.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_ultra_copy')
                .setLabel('Ultra Klonlamayı Başlat')
                .setStyle(ButtonStyle.Success)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        // Modal Formunu Göster
        if (interaction.isButton() && interaction.customId === 'btn_ultra_copy') {
            const modal = new ModalBuilder().setCustomId('modal_ultra_copy').setTitle('Ultra Klonlama Bilgileri');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kullanıcı Tokenin').setStyle(TextInputStyle.Short).setPlaceholder('Hesap Tokenini Yaz').setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // Modal Formu Gönderildiğinde İşlemi Başlat
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_ultra_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ checkUpdate: false });
            const owner = interaction.user; // DM atılacak kişi

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) {
                        await owner.send("❌ **Hata:** Sunucular bulunamadı. Tokenin her iki sunucuda olduğundan emin ol.");
                        return self.destroy();
                    }

                    await owner.send(`🚀 **Klonlama Başladı!**\n**Kaynak:** ${src.name}\n**Hedef:** ${trg.name}\n----------------------------`);

                    // --- 1. KİMLİK KOPYALAMA ---
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                    await owner.send("🖼️ **1. Adım:** Sunucu adı ve ikonu başarıyla güncellendi.");

                    // --- 2. TEMİZLİK ---
                    await owner.send("🧹 **2. Adım:** Hedef sunucudaki eski kanallar temizleniyor...");
                    const channelsToDel = await trg.channels.fetch();
                    for (const c of channelsToDel.values()) {
                        await c.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 800));
                    }

                    // --- 3. KATEGORİ VE KANAL İNŞASI ---
                    await owner.send("🏗️ **3. Adım:** Kanal ve kategoriler orijinal sırasıyla kuruluyor...");
                    const srcChans = src.channels.cache.sort((a, b) => a.position - b.position);
                    const categories = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

                    for (const cat of categories.values()) {
                        const newCat = await trg.channels.create(cat.name, { type: 4 }).catch(() => null);
                        if (newCat) {
                            const children = srcChans.filter(c => c.parentId === cat.id);
                            for (const child of children.values()) {
                                let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                                await trg.channels.create(child.name, { 
                                    type: type, 
                                    parent: newCat.id 
                                }).catch(() => {});
                                await new Promise(r => setTimeout(r, 1200)); // Rate limit koruması
                            }
                        }
                    }

                    await owner.send("✅ **İŞLEM TAMAMLANDI:** Sunucu başarıyla kopyalandı.");
                    await interaction.editReply('✅ İşlem bitti! Detaylar DM kutuna gönderildi.');
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ **Kritik Hata:** ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token geçersiz kanka.'));
        }
    }
};
