const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Hız Ayarı (API Ban yememek için değişken gecikme)
const bypassWait = (ms = 800) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 400) + ms));

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_wipe_clone' || int.customId === 'modal_wipe_clone') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('☢️ FORCES Wipe & Clone System')
            .setDescription(
                `**UYARI:** Bu işlem hedef sunucudaki her şeyi SİLECEK ve kaynak sunucuyu birebir kopyalayacaktır.\n\n` +
                `🌑 **Aşama 1:** Tam Temizlik (Kanallar, Roller, Emojiler)\n` +
                `🎭 **Aşama 2:** Rol Hiyerarşisi & İzinler\n` +
                `📁 **Aşama 3:** Kategori & Kanal İnşası\n` +
                `✨ **Aşama 4:** Emoji & Görsel Kimlik Aktarımı`
            )
            .setFooter({ text: 'Bypasser Mode: Aktif | Hız: Dinamik' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_wipe_clone').setLabel('Sıfırla ve Kur').setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_wipe_clone') {
            const modal = new ModalBuilder().setCustomId('modal_wipe_clone').setTitle('Wipe & Clone Konfigürasyon');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID (Kopyalanacak)').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID (Silinecek)').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_wipe_clone') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ 
                checkUpdate: false,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" 
            });
            
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return owner.send("❌ Sunucu bulunamadı!").then(() => self.destroy());

                    // --- AŞAMA 1: TAM TEMİZLİK ---
                    await owner.send(`🌑 **Aşama 1 Başladı:** \`${trg.name}\` sunucusu temizleniyor...`);
                    
                    const oldChans = await trg.channels.fetch();
                    for (const c of oldChans.values()) {
                        await c.delete().catch(() => {});
                        await bypassWait(600);
                    }

                    const oldRoles = await trg.roles.fetch();
                    for (const r of oldRoles.values()) {
                        if (r.name !== '@everyone' && !r.managed && r.editable) {
                            await r.delete().catch(() => {});
                            await bypassWait(500);
                        }
                    }
                    await owner.send("🧹 Temizlik bitti. Hedef sunucu artık tertemiz.");

                    // --- AŞAMA 2: ROL HİYERARŞİSİ ---
                    await owner.send("🎭 **Aşama 2:** Roller ve yetkiler inşa ediliyor...");
                    const roleMap = new Map();
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                    
                    for (const r of srcRoles.values()) {
                        const newRole = await trg.roles.create({
                            name: r.name, color: r.color, permissions: r.permissions,
                            hoist: r.hoist, mentionable: r.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(r.id, newRole.id);
                        await bypassWait(600);
                    }

                    // --- AŞAMA 3: KANAL VE KATEGORİ İNŞASI ---
                    await owner.send("🏗️ **Aşama 3:** Kategoriler ve kanallar (Özel izinlerle) taşınıyor...");
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
                        await bypassWait(800);

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
                                await bypassWait(1000);
                            }
                        }
                    }

                    // --- AŞAMA 4: EMOJİLER VE GÖRSEL ---
                    await owner.send("✨ **Aşama 4:** Emojiler ve sunucu kimliği kopyalanıyor...");
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                    
                    for (const emoji of src.emojis.cache.values()) {
                        await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                        await bypassWait(500);
                    }

                    await owner.send(`✅ **İŞLEM TAMAMLANDI.** \`${src.name}\` sunucusu artık tamamen senin.`);
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ Hata Oluştu: ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply("Token hatalı kanka!"));
        }
    }
};
