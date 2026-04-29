const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Jitter (API ban koruması)
const jitter = (ms = 600) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 400) + ms));

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_deep_purge' || int.customId === 'modal_deep_purge') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('☣️ FORCES Deep Purge System')
            .setDescription(
                `**HEDEF:** Tamamen sıfırlanmış, bomboş bir sunucu.\n\n` +
                `1️⃣ **Kanal Temizliği:** Bitti.\n` +
                `2️⃣ **Emoji & Sticker Temizliği:** Bitti.\n` +
                `3️⃣ **Rol Temizliği:** @everyone hariç her şey (Yetki dahilinde).\n` +
                `4️⃣ **Yeniden İnşa:** Kaynak sunucunun %100 kopyası.`
            )
            .setFooter({ text: 'DİKKAT: Bu işlem sunucuyu mezarlığa çevirir.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_deep_purge').setLabel('Sıfırla ve Kur').setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_deep_purge') {
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

                    if (!src || !trg) return owner.send("❌ Hata: Sunucu bulunamadı!");

                    await owner.send(`☣️ **Derin Temizlik Başladı!** Sunucu mezara gönderiliyor...`);

                    // --- ADIM 1: KANALLARI SÜPÜR ---
                    const channels = await trg.channels.fetch();
                    for (const c of channels.values()) {
                        await c.delete().catch(() => {});
                        await jitter(500);
                    }
                    await owner.send("✅ Kanallar yok edildi.");

                    // --- ADIM 2: EMOJİLERİ SÜPÜR ---
                    const emojis = await trg.emojis.fetch();
                    for (const e of emojis.values()) {
                        await e.delete().catch(() => {});
                        await jitter(300);
                    }
                    await owner.send("✅ Emojiler yok edildi.");

                    // --- ADIM 3: ROLLERİ SÜPÜR (EN KRİTİK KISIM) ---
                    await owner.send("🎭 **Roller Kökten Kazınıyor...**");
                    const roles = await trg.roles.fetch();
                    
                    // Rolleri hiyerarşik olarak (en alttan üste) silmeye çalışıyoruz
                    const rolesToDelete = roles.filter(r => r.name !== '@everyone' && !r.managed).sort((a, b) => a.position - b.position);
                    
                    for (const r of rolesToDelete.values()) {
                        if (r.editable) {
                            await r.delete()
                                .then(() => console.log(`[PURGE] Silindi: ${r.name}`))
                                .catch(err => console.log(`[HATA] ${r.name} silinemedi.`));
                        } else {
                            await owner.send(`⚠️ **Rol Silinemedi:** \`${r.name}\` (Yetkim bu rolün altında kalıyor, silebilmem için en üste çıkmalıyım!)`);
                        }
                        await jitter(500);
                    }
                    await owner.send("🧹 Rol temizliği tamamlandı.");

                    // --- ADIM 4: YENİDEN İNŞA (KİMLİK & ROLLER) ---
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});

                    const roleMap = new Map();
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                    
                    for (const r of srcRoles.values()) {
                        const newRole = await trg.roles.create({
                            name: r.name,
                            color: r.color ? Number(r.color) : 0, // Deprecation uyarısı fixlendi
                            permissions: r.permissions,
                            hoist: r.hoist,
                            mentionable: r.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(r.id, newRole.id);
                        await jitter(600);
                    }

                    // --- ADIM 5: KANALLARIN KURULUMU ---
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
                                    type: type, parent: newCat.id,
                                    permissionOverwrites: child.permissionOverwrites.cache.map(o => ({
                                        id: roleMap.get(o.id) || o.id,
                                        allow: o.allow, deny: o.deny, type: o.type
                                    }))
                                }).catch(() => {});
                                await jitter(1000);
                            }
                        }
                    }

                    await owner.send(`👑 **BİTTİ!** Sunucu tamamen sıfırlandı ve kaynak sunucuyla aynı DNA'ya sahip oldu.`);
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ Hata: ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply("❌ Token hatalı!"));
        }
    }
};
