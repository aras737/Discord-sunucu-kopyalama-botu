const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Jitter (Gecikme)
const jitter = (ms = 700) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 400) + ms));

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        // Dinleyiciyi bir kez tanımla (Memory Leak önleyici)
        if (!message.client.kurListenerSet) {
            message.client.on('interactionCreate', async (int) => {
                try {
                    if (int.isButton() && int.customId === 'btn_deep_purge') {
                        const modal = new ModalBuilder().setCustomId('modal_deep_purge').setTitle('Nükleer Klonlama');
                        modal.addComponents(
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                        );
                        return await int.showModal(modal);
                    }

                    if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_deep_purge') {
                        await int.deferReply({ ephemeral: true });
                        const token = int.fields.getTextInputValue('t').trim();
                        const srcId = int.fields.getTextInputValue('s').trim();
                        const trgId = int.fields.getTextInputValue('h').trim();
                        
                        await handleClone(int.user, token, srcId, trgId);
                        await int.editReply({ content: "🚀 İşlem başlatıldı, DM kutunu kontrol et!" });
                    }
                } catch (err) {
                    console.error("Etkileşim hatası:", err);
                }
            });
            message.client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('☢️ FORCES Deep Purge V2')
            .setDescription('Bu işlem hedef sunucuyu tamamen sıfırlar ve kaynak sunucuyu oraya kopyalar.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_deep_purge').setLabel('Sıfırla ve Kur').setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};

// Ana Klonlama Fonksiyonu
async function handleClone(owner, token, srcId, trgId) {
    const self = new SelfClient({ checkUpdate: false });
    
    self.on('ready', async () => {
        try {
            const src = self.guilds.cache.get(srcId);
            const trg = self.guilds.cache.get(trgId);

            if (!src || !trg) {
                await owner.send("❌ Sunucu bulunamadı! Tokenin iki sunucuda da olduğundan emin ol.");
                return self.destroy();
            }

            await owner.send("🧹 **ADIM 1: Temizlik Başladı.**");

            // 1. Kanalları Sil
            const channels = await trg.channels.fetch();
            for (const c of channels.values()) {
                await c.delete().catch(() => {});
                await jitter(500);
            }

            // 2. Rolleri Sil (Kritik Bölge)
            const trgRoles = await trg.roles.fetch();
            // Rolleri en alttan başlayarak sil (Hiyerarşi hatasını azaltır)
            const rolesToDelete = trgRoles.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
            
            for (const r of rolesToDelete.values()) {
                if (r.editable) {
                    await r.delete().catch(() => {});
                    await jitter(600);
                } else {
                    await owner.send(`⚠️ **Silinemedi:** \`${r.name}\` (Yetkimin üstünde veya bot rolü).`);
                }
            }

            // 3. İsim ve İkon
            await trg.setName(src.name).catch(() => {});
            if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});

            // 4. Yeni Rolleri Kur
            await owner.send("🎭 **ADIM 2: Roller İnşa Ediliyor.**");
            const roleMap = new Map();
            const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);

            for (const r of srcRoles.values()) {
                const newRole = await trg.roles.create({
                    name: r.name,
                    color: r.color ? Number(r.color) : 0,
                    permissions: r.permissions,
                    hoist: r.hoist,
                    mentionable: r.mentionable
                }).catch(() => null);
                if (newRole) roleMap.set(r.id, newRole.id);
                await jitter(600);
            }

            // 5. Kanalları Kur
            await owner.send("🏗️ **ADIM 3: Kanallar ve İzinler Kuruluyor.**");
            const srcChans = src.channels.cache.sort((a,b) => a.position - b.position);
            const categories = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

            for (const cat of categories.values()) {
                const newCat = await trg.channels.create(cat.name, {
                    type: 4,
                    permissionOverwrites: cat.permissionOverwrites.cache.map(o => ({
                        id: roleMap.get(o.id) || o.id,
                        allow: o.allow, deny: o.deny, type: o.type
                    }))
                }).catch(() => null);
                
                await jitter(800);

                if (newCat) {
                    const children = srcChans.filter(c => c.parentId === cat.id);
                    for (const child of children.values()) {
                        let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                        await trg.channels.create(child.name, {
                            type: type,
                            parent: newCat.id,
                            permissionOverwrites: child.permissionOverwrites.cache.map(o => ({
                                id: roleMap.get(o.id) || o.id,
                                allow: o.allow, deny: o.deny, type: o.type
                            }))
                        }).catch(() => {});
                        await jitter(1000);
                    }
                }
            }

            await owner.send("✅ **İşlem Başarıyla Tamamlandı!**");
            self.destroy();

        } catch (err) {
            await owner.send(`❌ Kritik Hata: ${err.message}`);
            self.destroy();
        }
    });

    self.login(token).catch(() => owner.send("❌ Girdiğin token yanlış!"));
}
