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
        const client = message.client;
        const args = message.content.split(' ').slice(1);

        // --- EVENT LISTENER (Kendi içinde döner) ---
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (interaction) => {
                if (interaction.customId === 'btn_ultra_copy' || interaction.customId === 'modal_ultra_copy') {
                    await this.handleInteraction(interaction);
                }
            });
            client.kurListenerSet = true;
        }

        // --- PANEL KOMUDU (!kur panel) ---
        if (args[0] === 'panel') {
            if (message.author.id !== OWNER_ID) return;

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ name: 'FORCES Ultra Cloner v2026', iconURL: client.user.displayAvatarURL() })
                .setTitle('👑 Sunucu Klonlama Sistemi')
                .setDescription(
                    `Bu işlem hedef sunucuyu tamamen temizler ve kaynak sunucuyu oraya inşa eder.\n\n` +
                    `▫️ **Kimlik:** Sunucu adı ve ikonu kopyalanır.\n` +
                    `▫️ **Düzen:** Kategoriler ve kanallar sırasıyla kurulur.\n` +
                    `▫️ **İzinler:** Kanal yetkileri (overwrites) taşınır.\n\n` +
                    `📩 **Bilgi:** Her adımda size DM üzerinden rapor verilir.`
                )
                .setFooter({ text: 'İşlemi başlatmak için aşağıdaki butona tıklayın.' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ultra_copy')
                    .setLabel('Kopyalamayı Başlat')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚙️')
            );

            await message.channel.send({ embeds: [embed], components: [row] });
            return message.delete().catch(() => {});
        }
    },

    async handleInteraction(interaction) {
        // 1. BUTON -> MODAL AÇMA
        if (interaction.isButton() && interaction.customId === 'btn_ultra_copy') {
            const modal = new ModalBuilder()
                .setCustomId('modal_ultra_copy')
                .setTitle('FORCES Klonlama Formu');

            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kendi Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // 2. MODAL -> İŞLEMİ BAŞLATMA
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_ultra_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t').trim();
            const srcId = interaction.fields.getTextInputValue('s').trim();
            const trgId = interaction.fields.getTextInputValue('h').trim();

            const self = new SelfClient({ checkUpdate: false });
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) {
                        await owner.send("❌ **Hata:** Sunucular bulunamadı! Tokenin her iki sunucuda da olduğundan emin ol.");
                        return self.destroy();
                    }

                    await owner.send(`🚀 **Klonlama Başladı!**\n**Kaynak:** ${src.name}\n**Hedef:** ${trg.name}`);

                    // KİMLİK
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL()).catch(() => {});
                    await owner.send("🖼️ **Adım 1:** İsim ve ikon güncellendi.");

                    // TEMİZLİK
                    await owner.send("🧹 **Adım 2:** Hedef sunucu temizleniyor...");
                    const channels = await trg.channels.fetch();
                    for (const c of channels.values()) {
                        await c.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 700));
                    }

                    // İNŞA
                    await owner.send("🏗️ **Adım 3:** Kanallar ve kategoriler kuruluyor...");
                    const srcChans = src.channels.cache.sort((a, b) => a.position - b.position);
                    const cats = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

                    for (const cat of cats.values()) {
                        const newCat = await trg.channels.create(cat.name, { type: 4 }).catch(() => null);
                        if (newCat) {
                            const children = srcChans.filter(c => c.parentId === cat.id);
                            for (const child of children.values()) {
                                let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                                await trg.channels.create(child.name, { type: type, parent: newCat.id }).catch(() => {});
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        }
                    }

                    await owner.send(`✅ **İŞLEM TAMAMLANDI!**\n${src.name} başarıyla kopyalandı.`);
                    await interaction.editReply('İşlem başarıyla bitti, DM kutunu kontrol et kanka!');
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ **Kritik Hata:** ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token hatalı kanka.'));
        }
    }
};
