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
    name: 'kur', // !kur şeklinde çalışması için index'teki komut işleyicisine bağlıdır
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        // Interaction (Buton/Modal) dinleyicisini kuruyoruz
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
            .setAuthor({ name: 'FORCES Ultra Cloner | Raporlama Sistemi' })
            .setTitle('👑 Sunucu Kopyalama Başlatılsın mı?')
            .setDescription(
                `Bu işlem sırasında şu adımlar izlenecek:\n\n` +
                `1️⃣ **Kimlik Aktarımı:** İsim ve ikon kopyalanır.\n` +
                `2️⃣ **Saha Temizliği:** Hedefteki eski kanallar silinir.\n` +
                `3️⃣ **Mimari İnşa:** Kategori ve kanallar sırayla dizilir.\n` +
                `4️⃣ **Anlık Rapor:** Her adımda DM üzerinden bilgi verilir.\n\n` +
                `**Hız:** 1.2sn / İşlem (Güvenli Mod)`
            )
            .setFooter({ text: 'Onaylamak için aşağıdaki butona tıkla.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_ultra_copy')
                .setLabel('Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Success)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        // Modal Formunu Göster
        if (interaction.isButton() && interaction.customId === 'btn_ultra_copy') {
            const modal = new ModalBuilder().setCustomId('modal_ultra_copy').setTitle('Ultra Klonlama Formu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // Modal Formu Onaylandığında
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_ultra_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ checkUpdate: false });
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) {
                        await owner.send("❌ **Hata:** Sunuculara erişilemedi. Tokenin her iki sunucuda da olduğundan emin ol.");
                        return self.destroy();
                    }

                    // --- RAPORLAMA VE İŞLEM BAŞLANGICI ---
                    await owner.send(`🚀 **Klonlama İşlemi Tetiklendi!**\n📦 **Kaynak:** ${src.name}\n🎯 **Hedef:** ${trg.name}\n----------------------------`);

                    // ADIM 1: Kimlik
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                    await owner.send("🖼️ **Adım 1/3 Tamam:** Sunucu kimliği (isim/ikon) başarıyla kopyalandı.");

                    // ADIM 2: Temizlik
                    await owner.send("🧹 **Adım 2/3:** Hedef sunucu temizleniyor...");
                    const currentChans = await trg.channels.fetch();
                    for (const c of currentChans.values()) {
                        await c.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 800));
                    }

                    // ADIM 3: İnşa
                    await owner.send("🏗️ **Adım 3/3:** Mimari yapı (Kategori ve Kanallar) inşa ediliyor...");
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

                    await owner.send(`✅ **İŞLEM BAŞARIYLA BİTTİ!**\nSunucu artık orijinalinin ikizi oldu.`);
                    await interaction.editReply('✅ İşlem tamam! DM kutunu kontrol et.');
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ **Hata Oluştu:** ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Girdiğin token hatalı!'));
        }
    }
};
