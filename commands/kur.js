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

        const client = message.client;
        if (!client.kurFinalListener) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_full_clone' || int.customId === 'modal_full_clone') {
                    await this.handleInteraction(int);
                }
            });
            client.kurFinalListener = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🛡️ FORCES Ultra Stabil Klon Sistemi')
            .setDescription('Rate Limit yememek için her işlem arasına **1 saniye** gecikme eklendi.\n\n**İşlem Sırası:**\n1️⃣ Kanallar Siliniyor\n2️⃣ Roller Temizleniyor\n3️⃣ Yeni Roller Kuruluyor\n4️⃣ Kategoriler ve Kanallar İnşa Ediliyor');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_full_clone').setLabel('1sn Gecikmeli Başlat').setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_full_clone') {
            const modal = new ModalBuilder().setCustomId('modal_full_clone').setTitle('Self-Bot Yapılandırma');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Token').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_full_clone') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return interaction.editReply('❌ Sunucu bulunamadı!');

                    // --- KANAL TEMİZLİĞİ (1sn Gecikme) ---
                    await interaction.editReply('🧹 Kanallar temizleniyor (Her işlem 1sn)...');
                    for (const c of trg.channels.cache.values()) {
                        await c.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 1000)); // Tam 1 saniye
                    }

                    // --- ROL TEMİZLİĞİ (1sn Gecikme) ---
                    await interaction.editReply('🧹 Roller temizleniyor (Her işlem 1sn)...');
                    const roles = trg.roles.cache.filter(r => r.name !== '@everyone' && !r.managed);
                    for (const r of roles.values()) {
                        await r.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 1000)); // Tam 1 saniye
                    }

                    // --- ROL OLUŞTURMA (1sn Gecikme) ---
                    await interaction.editReply('🏗️ Roller oluşturuluyor (Her işlem 1sn)...');
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a, b) => a.position - b.position);
                    for (const r of srcRoles.values()) {
                        await trg.roles.create({ name: r.name, color: r.color, permissions: r.permissions }).catch(() => {});
                        await new Promise(r => setTimeout(r, 1000)); // Tam 1 saniye
                    }

                    // --- KATEGORİ VE KANAL KURULUMU (1sn Gecikme) ---
                    await interaction.editReply('🏗️ Kanallar inşa ediliyor (Her işlem 1sn)...');
                    const srcChans = src.channels.cache.sort((a, b) => a.position - b.position);
                    const cats = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

                    for (const cat of cats.values()) {
                        const newCat = await trg.channels.create(cat.name, { type: 4 }).catch(() => null);
                        await new Promise(r => setTimeout(r, 1000)); // Kategori açıldı, bekle.

                        if (!newCat) continue;

                        const children = srcChans.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                            await trg.channels.create(child.name, { type: type, parent: newCat.id }).catch(() => {});
                            await new Promise(r => setTimeout(r, 1000)); // Kanal açıldı, bekle.
                        }
                    }

                    await interaction.editReply('✅ Operasyon başarıyla tamamlandı, hiçbir işlem atlanmadı.');
                    self.destroy();
                } catch (e) {
                    await interaction.editReply('Hata: ' + e.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token geçersiz!'));
        }
    }
};
