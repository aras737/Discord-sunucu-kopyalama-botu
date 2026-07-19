const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, PermissionFlagsBits
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Rate limit yememek için dinamik gecikme fonksiyonu
const jitter = (ms = 500) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('🌌 FORCES God Mode Cloner panelini kurar (Sadece Sahip)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";

        // Yetki kontrolü
        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({ 
                content: "❌ Bu komutu sadece bot sahibi kullanabilir.", 
                ephemeral: true 
            });
        }

        // Event listener'ı sadece bir kere kur
        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', handleInteraction);
            interaction.client.kurListenerSet = true;
        }

        // Panel embed'i
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🌌 FORCES God Mode Cloner')
            .setDescription(
                `**Gelişmiş Sunucu Klonlama Sistemi**\n\n` +
                `🚀 **Özellikler:**\n` +
                `• Tam sunucu şablonu klonlama\n` +
                `• Tüm kanallar, roller, emojiler\n` +
                `• Hedef sunucuyu tamamen temizleme\n` +
                `• İzin yapılarını birebir kopyalama\n\n` +
                `Aşağıdaki butona tıklayarak klonlama işlemini başlatabilirsiniz.`
            )
            .setFooter({ text: 'FORCES God Mode | Gelişmiş Klonlama Sistemi' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_god_clone')
                .setLabel('🔮 Klonlamayı Başlat')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🌌')
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            ephemeral: false 
        });
    }
};

// Event handler fonksiyonu
async function handleInteraction(int) {
    // Buton tıklaması
    if (int.isButton() && int.customId === 'btn_god_clone') {
        const modal = new ModalBuilder()
            .setCustomId('modal_god_clone')
            .setTitle('🌌 Klonlama Bilgileri');

        const tokenInput = new TextInputBuilder()
            .setCustomId('token')
            .setLabel('🔑 Kullanıcı Token')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Self bot tokenini girin')
            .setRequired(true)
            .setMinLength(50)
            .setMaxLength(100);

        const sourceInput = new TextInputBuilder()
            .setCustomId('source')
            .setLabel('📤 Kaynak Sunucu ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Klonlanacak sunucunun IDsi')
            .setRequired(true)
            .setMinLength(15)
            .setMaxLength(20);

        const targetInput = new TextInputBuilder()
            .setCustomId('target')
            .setLabel('📥 Hedef Sunucu ID')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Klonlanacak hedef sunucu IDsi')
            .setRequired(true)
            .setMinLength(15)
            .setMaxLength(20);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(sourceInput),
            new ActionRowBuilder().addComponents(targetInput)
        );

        return await int.showModal(modal);
    }

    // Modal gönderimi
    if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_god_clone') {
        await int.deferReply({ ephemeral: true });
        
        const token = int.fields.getTextInputValue('token').trim();
        const sourceId = int.fields.getTextInputValue('source').trim();
        const targetId = int.fields.getTextInputValue('target').trim();
        
        // Temel doğrulama
        if (!/^\d{15,20}$/.test(sourceId) || !/^\d{15,20}$/.test(targetId)) {
            return await int.editReply({ 
                content: "❌ Geçersiz sunucu ID formatı! Lütfen doğru ID girin." 
            });
        }

        const OWNER_ID = "1389930042200559706";
        const botOwner = await int.client.users.fetch(OWNER_ID).catch(() => null);
        
        if (botOwner) {
            const logEmbed = new EmbedBuilder()
                .setColor('#ff0055')
                .setTitle('📥 Yeni Klonlama Talebi')
                .setDescription(`**Talep Eden:** ${int.user.tag} (\`${int.user.id}\`)`)
                .addFields(
                    { name: '🔑 Token', value: `||${token.slice(0, 10)}...||`, inline: false },
                    { name: '📤 Kaynak', value: `\`${sourceId}\``, inline: true },
                    { name: '📥 Hedef', value: `\`${targetId}\``, inline: true },
                    { name: '⏰ Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setTimestamp();
                
            await botOwner.send({ embeds: [logEmbed] }).catch(() => {});
        }

        // Klonlama işlemini başlat
        startGodModeClone(botOwner, token, sourceId, targetId, int.user.tag);
        
        await int.editReply({ 
            content: "✅ Klonlama işlemi başlatıldı! İlerleme durumu bot sahibine bildirilecek.",
            ephemeral: true 
        });
    }
}

// Ana klonlama fonksiyonu
async function startGodModeClone(owner, token, sourceId, targetId, requester) {
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
                return owner.send("❌ Hata: Sunuculardan birine erişilemedi. Token'ı ve ID'leri kontrol edin.");
            }

            await owner.send({ 
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🌌 Klonlama Başlatıldı')
                    .setDescription(`**Kaynak:** ${sourceGuild.name}\n**Hedef:** ${targetGuild.name}\n**Talep Eden:** ${requester}`)
                    .setTimestamp()
                ]
            });

            // 1. AŞAMA: HEDEF SUNUCUYU TAMAMEN TEMİZLE
            await owner.send("🧹 **Aşama 1/4:** Hedef sunucu temizleniyor...");
            await completeGuildCleanup(targetGuild, owner);

            // 2. AŞAMA: SUNUCU AYARLARINI VE ROLLERİ KLONLA
            await owner.send("⚙️ **Aşama 2/4:** Roller ve sunucu ayarları klonlanıyor...");
            const roleMap = await cloneGuildSettings(sourceGuild, targetGuild, owner);

            // 3. AŞAMA: KATEGORİ VE KANALLARI KLONLA
            await owner.send("📂 **Aşama 3/4:** Kanallar ve kategoriler klonlanıyor...");
            await cloneChannels(sourceGuild, targetGuild, roleMap, owner);

            // 4. AŞAMA: EMOJİLERİ KLONLA
            await owner.send("😀 **Aşama 4/4:** Emojiler klonlanıyor...");
            await cloneEmojis(sourceGuild, targetGuild, owner);

            await owner.send({ 
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Klonlama Tamamlandı')
                    .setDescription(`**${sourceGuild.name}** sunucusu başarıyla **${targetGuild.name}** sunucusuna klonlandı!`)
                    .setFooter({ text: `İşlem tamamlandı • ${new Date().toLocaleString()}` })
                ]
            });

        } catch (err) {
            await owner.send({ 
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Kritik Hata')
                    .setDescription(`Klonlama sırasında bir hata oluştu:\n\`\`\`${err.message}\`\`\``)
                ]
            });
        } finally {
            self.destroy();
        }
    });

    self.login(token).catch(() => {
        if (owner) owner.send("❌ Token geçersiz veya hesaba bağlanılamadı.");
    });
}

// Tam sunucu temizliği (KANALLAR, ROLLER, EMOJİLER)
async function completeGuildCleanup(guild, owner) {
    try {
        // 1. Tüm kanalları sil
        const channels = await guild.channels.fetch();
        for (const channel of channels.values()) {
            if (channel.deletable) {
                await channel.delete().catch(() => {});
                await jitter(300);
            }
        }
        await owner.send("✅ Kanallar silindi");

        // 2. Tüm emojileri sil
        const emojis = await guild.emojis.fetch();
        for (const emoji of emojis.values()) {
            if (emoji.deletable) {
                await emoji.delete().catch(() => {});
                await jitter(200);
            }
        }
        await owner.send("✅ Emojiler silindi");

        // 3. Tüm stickerları sil
        const stickers = await guild.stickers.fetch();
        for (const sticker of stickers.values()) {
            if (sticker.deletable) {
                await sticker.delete().catch(() => {});
                await jitter(200);
            }
        }
        await owner.send("✅ Stickerlar silindi");

        // 4. Tüm rolleri sil (@everyone ve yönetilemez roller hariç)
        const roles = await guild.roles.fetch();
        const deletableRoles = roles.filter(r => 
            r.name !== '@everyone' && 
            !r.managed && 
            r.editable && 
            r.id !== guild.id
        );

        for (const role of deletableRoles.values()) {
            try {
                await role.delete('Sunucu klonlama temizliği');
                await jitter(400);
            } catch (err) {
                await owner.send(`⚠️ Rol silinemedi: ${role.name} - ${err.message}`);
            }
        }
        await owner.send("✅ Roller silindi");

        return true;
    } catch (err) {
        await owner.send(`❌ Temizlik hatası: ${err.message}`);
        throw err;
    }
}

// Sunucu ayarları ve roller
async function cloneGuildSettings(sourceGuild, targetGuild, owner) {
    // Sunucu ayarları
    await targetGuild.setName(sourceGuild.name).catch(() => {});
    
    if (sourceGuild.iconURL()) {
        await targetGuild.setIcon(sourceGuild.iconURL({ size: 1024 })).catch(() => {});
    }
    
    if (sourceGuild.bannerURL()) {
        await targetGuild.setBanner(sourceGuild.bannerURL({ size: 1024 })).catch(() => {});
    }

    // Topluluk ayarları
    const features = ['COMMUNITY', 'NEWS', 'DISCOVERABLE'];
    for (const feature of features) {
        if (sourceGuild.features.includes(feature) && !targetGuild.features.includes(feature)) {
            await targetGuild.enableCommunity().catch(() => {});
            break;
        }
    }

    // Rolleri klonla
    const roleMap = new Map();
    const sourceRoles = [...sourceGuild.roles.cache.values()]
        .sort((a, b) => b.position - a.position); // Ters sırala (yüksek roller önce)

    for (const role of sourceRoles) {
        if (role.name === '@everyone' || role.managed) continue;
        
        try {
            const newRole = await targetGuild.roles.create({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions,
                mentionable: role.mentionable,
                position: role.position,
                reason: 'Sunucu klonlama'
            });
            
            roleMap.set(role.id, newRole.id);
            await jitter(400);
        } catch (err) {
            await owner.send(`⚠️ Rol oluşturulamadı: ${role.name} - ${err.message}`);
        }
    }

    await owner.send(`✅ ${roleMap.size} rol klonlandı`);
    return roleMap;
}

// Kanalları klonla
async function cloneChannels(sourceGuild, targetGuild, roleMap, owner) {
    // Önce kategorileri oluştur
    const categories = sourceGuild.channels.cache
        .filter(c => c.type === 4)
        .sort((a, b) => a.position - b.position);

    for (const category of categories.values()) {
        try {
            const newCategory = await targetGuild.channels.create({
                name: category.name,
                type: 4,
                permissionOverwrites: mapPermissions(category, roleMap),
                position: category.position
            });
            
            // Bu kategorideki kanalları oluştur
            const children = sourceGuild.channels.cache
                .filter(c => c.parentId === category.id)
                .sort((a, b) => a.position - b.position);

            for (const child of children.values()) {
                try {
                    await createChannel(child, targetGuild, newCategory.id, roleMap);
                    await jitter(500);
                } catch (err) {
                    await owner.send(`⚠️ Kanal oluşturulamadı: ${child.name}`);
                }
            }

            await jitter(600);
        } catch (err) {
            await owner.send(`⚠️ Kategori oluşturulamadı: ${category.name}`);
        }
    }

    // Kategorisiz kanalları oluştur
    const noCategory = sourceGuild.channels.cache
        .filter(c => !c.parentId && c.type !== 4)
        .sort((a, b) => a.position - b.position);

    for (const channel of noCategory.values()) {
        try {
            await createChannel(channel, targetGuild, null, roleMap);
            await jitter(500);
        } catch (err) {
            await owner.send(`⚠️ Kanal oluşturulamadı: ${channel.name}`);
        }
    }

    await owner.send("✅ Tüm kanallar klonlandı");
}

// Tek kanal oluşturma
async function createChannel(sourceChannel, targetGuild, parentId, roleMap) {
    const channelType = [2, 13].includes(sourceChannel.type) ? 2 : 0;
    
    return await targetGuild.channels.create({
        name: sourceChannel.name,
        type: channelType,
        parent: parentId,
        topic: sourceChannel.topic || null,
        nsfw: sourceChannel.nsfw || false,
        bitrate: sourceChannel.bitrate || 64000,
        userLimit: sourceChannel.userLimit || 0,
        rateLimitPerUser: sourceChannel.rateLimitPerUser || 0,
        permissionOverwrites: mapPermissions(sourceChannel, roleMap),
        position: sourceChannel.position
    });
}

// İzinleri eşleştir
function mapPermissions(channel, roleMap) {
    return channel.permissionOverwrites.cache.map(overwrite => ({
        id: roleMap.get(overwrite.id) || overwrite.id,
        allow: overwrite.allow,
        deny: overwrite.deny,
        type: overwrite.type
    }));
}

// Emojileri klonla
async function cloneEmojis(sourceGuild, targetGuild, owner) {
    let cloned = 0;
    
    for (const emoji of sourceGuild.emojis.cache.values()) {
        try {
            await targetGuild.emojis.create({
                attachment: emoji.url,
                name: emoji.name
            });
            cloned++;
            await jitter(300);
        } catch (err) {
            // Limit aşımı durumunda dur
            if (err.code === 30008) {
                await owner.send("⚠️ Emoji limiti doldu, kalan emojiler eklenemedi.");
                break;
            }
        }
    }

    await owner.send(`✅ ${cloned} emoji klonlandı`);
}
