const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Jitter (Rate Limit yememek için dinamik gecikme)
const jitter = (ms = 700) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Forces God Mode Klonlama panelini açar.'),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            return await interaction.reply({ content: "❌ Bu komutu sadece bot sahibi kullanabilir.", ephemeral: true });
        }

        // Ana index.js yerine dinleyiciyi komutun ilk tetiklendiği an tek seferlik kuruyoruz
        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.isButton() && int.customId === 'btn_god_clone') {
                    const modal = new ModalBuilder().setCustomId('modal_god_clone').setTitle('God Mode Klonlama');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Token').setStyle(TextInputStyle.Short).setRequired(true)),
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
                    
                    startGodModeClone(int.user, t, s, h);
                    await int.editReply("🌌 God Mode aktif edildi! İşlem detayları DM'den geliyor.");
                }
            });
            interaction.client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🌌 FORCES God Mode Cloner')
            .setDescription(
                `**Aktif Modüller:**\n` +
                `🗑️ **Deep Purge:** Hedefteki her şeyi yok et.\n` +
                `⚙️ **Sunucu Ayarları:** Doğrulama, AFK, Sistem kanalları.\n` +
                `🎭 **Roller:** Renk, Yetki ve Hiyerarşi.\n` +
                `📁 **Kanallar:** NSFW, Yavaş Mod, Ses Kalitesi (Bitrate).\n` +
                `🎨 **Görsel:** İkon, Banner, Emojiler ve Çıkartmalar (Stickers).\n` +
                `🔨 **Yasaklar:** Ban listesi aktarımı.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_god_clone').setLabel('Her Şeyi Kopyala').setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};

async function startGodModeClone(owner, token, srcId, trgId) {
    const self = new SelfClient({ checkUpdate: false });
    
    self.on('ready', async () => {
        try {
            const src = self.guilds.cache.get(srcId);
            const trg = self.guilds.cache.get(trgId);

            if (!src || !trg) return owner.send("❌ Hata: Sunucu bulunamadı!");

            await owner.send(`🌌 **God Mode Başladı!** \`${trg.name}\` mezara gömülüyor...`);

            // --- AŞAMA 1: YOK ETME (WIPE) ---
            const chans = await trg.channels.fetch();
            for (const c of chans.values()) { await c.delete().catch(() => {}); await jitter(400); }

            const emojis = await trg.emojis.fetch();
            for (const e of emojis.values()) { await e.delete().catch(() => {}); await jitter(300); }
            
            const stickers = await trg.stickers.fetch();
            for (const s of stickers.values()) { await s.delete().catch(() => {}); await jitter(300); }

            const roles = await trg.roles.fetch();
            const toDeleteRoles = roles.filter(r => r.name !== '@everyone' && !r.managed && r.editable).sort((a,b) => a.position - b.position);
            for (const r of toDeleteRoles.values()) { await r.delete().catch(() => {}); await jitter(400); }

            await owner.send("🧹 **Aşama 1 Bitti:** Hedef sunucu tamamen temizlendi.");

            // --- AŞAMA 2: TEMEL AYARLAR VE ROLLER ---
            await trg.setName(src.name).catch(() => {});
            if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
            if (src.bannerURL()) await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});
            await trg.setVerificationLevel(src.verificationLevel).catch(() => {});
            await trg.setExplicitContentFilter(src.explicitContentFilter).catch(() => {});
            await trg.setDefaultMessageNotifications(src.defaultMessageNotifications).catch(() => {});

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
            await owner.send("🎭 **Aşama 2 Bitti:** Rol hiyerarşisi ve temel sunucu ayarları aktarıldı.");

            // --- AŞAMA 3: KANALLAR VE GELİŞMİŞ AYARLAR ---
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
                            rateLimitPerUser: child.rateLimitPerUser || 0,
                            permissionOverwrites: child.permissionOverwrites.cache.map(o => ({
                                id: roleMap.get(o.id) || o.id,
                                allow: o.allow, deny: o.deny, type: o.type
                            }))
                        }).catch(() => null);
                        if (newChannel) channelMap.set(child.id, newChannel.id);
                        await jitter(800);
                    }
                }
            }
            await owner.send("🏗️ **Aşama 3 Bitti:** Kanallar (Yavaş Mod, NSFW ve Ses Kalitesi dahil) inşa edildi.");

            // --- AŞAMA 4: AFK VE SİSTEM KANALLARINI BAĞLAMA ---
            if (src.afkChannelId && channelMap.has(src.afkChannelId)) {
                await trg.setAFKChannel(channelMap.get(src.afkChannelId)).catch(() => {});
                await trg.setAFKTimeout(src.afkTimeout).catch(() => {});
            }
            if (src.systemChannelId && channelMap.has(src.systemChannelId)) {
                await trg.setSystemChannel(channelMap.get(src.systemChannelId)).catch(() => {});
            }

            // --- AŞAMA 5: EMOJİ, STICKER VE BAN LİSTESİ ---
            await owner.send("✨ **Aşama 5 Başladı:** Emojiler, Çıkartmalar ve Ban listesi çekiliyor...");
            
            for (const emoji of src.emojis.cache.values()) {
                await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                await jitter(400);
            }

            for (const sticker of src.stickers.cache.values()) {
                await trg.stickers.create(sticker.url, sticker.name, sticker.tags || 'cloned').catch(() => {});
                await jitter(500);
            }

            try {
                const bans = await src.bans.fetch();
                for (const ban of bans.values()) {
                    await trg.members.ban(ban.user.id, { reason: ban.reason || "Klonlama Aracı: Taşınan Ban" }).catch(() => {});
                    await jitter(300);
                }
            } catch (err) {}

            await owner.send(`👑 **%100 Klonlama Tamamlandı!** Klon bot kapatılıyor.`);
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Beklenmeyen Hata: ${err.message}`);
            self.destroy();
        }
    });

    self.login(token).catch(() => owner.send("❌ Girdiğin token geçersiz kanka!"));
}
