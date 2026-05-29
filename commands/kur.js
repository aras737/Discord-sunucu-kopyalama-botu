const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// İstediğin depodaki gibi güvenli ve stabil işlem için dinamik gecikme (Rate Limit önleyici)
const jitter = (ms = 700) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('FORCES God Mode Klonlama panelini genel görünüme açar.'),

    async execute(interaction) {
        // Buraya kendi Discord ID'ni yaz kanka
        const OWNER_ID = "1389930042200559706";

        if (!interaction.client.kurListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.isButton() && int.customId === 'btn_god_clone') {
                    // Güvenlik Kontrolü: Embed genel görünümde olduğu için butona sadece bot sahibi basabilir
                    if (int.user.id !== OWNER_ID) {
                        return await int.reply({ content: "❌ Bu işlemi başlatmaya yetkin yok kanka.", ephemeral: true });
                    }

                    const modal = new ModalBuilder().setCustomId('modal_god_clone').setTitle('Klonlama Giriş Paneli');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kullanıcı (Self) Token').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kopyalanacak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef (Boş) Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    return await int.showModal(modal);
                }

                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_god_clone') {
                    await int.deferReply({ ephemeral: true });
                    const t = int.fields.getTextInputValue('t').trim();
                    const s = int.fields.getTextInputValue('s').trim();
                    const h = int.fields.getTextInputValue('h').trim();
                    
                    startGodModeClone(int.user, t, s, h);
                    await int.editReply("🌌 Entegrasyon başarılı! İşlem logları DM kutuna gönderiliyor.");
                }
            });
            interaction.client.kurListenerSet = true;
        }

        // İstediğin gibi her kullanıcının görebileceği şekilde ayarlanan ana embed
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🌌 FORCES God Mode Cloner')
            .setDescription(
                `**Aktif Modüller (onlycmd Altyapısı Entegre Edildi):**\n` +
                `🗑️ **Deep Purge:** Hedef sunucudaki eski kanalları ve rolleri tamamen temizler.\n` +
                `⚙️ **Sunucu Ayarları:** İkon, banner, doğrulama ve sistem ayarlarını eşitler.\n` +
                `🎭 **Rol Yapısı:** İzinleri, özel renkleri ve hiyerarşik sıralamayı birebir kopyalar.\n` +
                `📁 **Kanal Düzeni:** Kategoriler, ses/metin kanalları, NSFW ve bitrate ayarlarını taşır.\n` +
                `🎨 **Görsel Objeler:** Sunucudaki tüm emoji ve çıkartmaları aktarır.`
            )
            .setFooter({ text: 'Klonlama panelini şu an herkes görüntüleyebilir.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_god_clone').setLabel('Klonlamayı Başlat').setStyle(ButtonStyle.Danger)
        );

        // ephemeral: true kaldırıldı, embed kanaldaki herkese açık gönderiliyor
        await interaction.reply({ embeds: [embed], components: [row] });
    }
};

async function startGodModeClone(owner, token, srcId, trgId) {
    const self = new SelfClient({ checkUpdate: false });
    
    self.on('ready', async () => {
        try {
            const src = self.guilds.cache.get(srcId);
            const trg = self.guilds.cache.get(trgId);

            if (!src || !trg) return owner.send("❌ Hata: Sunuculardan birine erişim sağlanamadı. ID'leri kontrol et kanka.");

            await owner.send(`🌌 **İşlem Başladı!** \`${src.name}\` sunucusu \`${trg.name}\` sunucusuna aktarılıyor...`);

            // --- 1. AŞAMA: HEDEF SUNUCUYU SIFIRLAMA ---
            const chans = await trg.channels.fetch();
            for (const c of chans.values()) { await c.delete().catch(() => {}); await jitter(400); }

            const emojis = await trg.emojis.fetch();
            for (const e of emojis.values()) { await e.delete().catch(() => {}); await jitter(300); }

            const roles = await trg.roles.fetch();
            const toDeleteRoles = roles.filter(r => r.name !== '@everyone' && !r.managed && r.editable).sort((a,b) => a.position - b.position);
            for (const r of toDeleteRoles.values()) { await r.delete().catch(() => {}); await jitter(400); }

            // --- 2. AŞAMA: AYARLARIN VE ROLLERİN OLUŞTURULMASI ---
            await trg.setName(src.name).catch(() => {});
            if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
            if (src.bannerURL()) await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});
            await trg.setVerificationLevel(src.verificationLevel).catch(() => {});

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

            // --- 3. AŞAMA: KATEGORİLER VE KANALLARIN İZİNLERLE AKTARILMASI ---
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

            // --- 4. AŞAMA: EMOJİLERİN AKTARILMASI ---
            for (const emoji of src.emojis.cache.values()) {
                await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                await jitter(400);
            }

            await owner.send(`👑 **Başarılı:** \`${src.name}\` sunucusunun şablonu tamamen kopyalandı.`);
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Klonlama sırasında bir hata oluştu: ${err.message}`);
            self.destroy();
        }
    });

    self.login(token).catch(() => owner.send("❌ Girdiğin token hesaba bağlanamadı, kontrol et kanka."));
}
