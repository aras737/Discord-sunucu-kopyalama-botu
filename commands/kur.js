const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Jitter: Discord API'sini uyutmak için değişken bekleme süresi
const jitter = (ms = 80) => new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + ms));

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706"; // Senin ID'n
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_nuclear_clone' || int.customId === 'modal_nuclear_clone') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('☢️ FORCES Nükleer Klonlama Sistemi')
            .setDescription(
                `🛑 **DİKKAT:** Bu işlem hedef sunucudaki her şeyi SİLECEK!\n\n` +
                `▫️ **Aşama 1:** Tam Temizlik (Kanal, Rol, Emoji)\n` +
                `▫️ **Aşama 2:** Kimlik & Rol Hiyerarşisi Aktarımı\n` +
                `▫️ **Aşama 3:** Kanal & Kategori (Özel İzinli) İnşası\n` +
                `▫️ **Aşama 4:** Emoji & Sticker Taşıma\n\n` +
                `*İşlem adımları size DM üzerinden anlık olarak bildirilecektir.*`
            )
            .setFooter({ text: 'Bypasser Modu: AKTİF | Mod: Deep Wipe & Reset' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_nuclear_clone').setLabel('Nükleer Temizlik ve Kurulum').setStyle(ButtonStyle.Danger).setEmoji('☣️')
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_nuclear_clone') {
            const modal = new ModalBuilder().setCustomId('modal_nuclear_clone').setTitle('Klonlama Konfigürasyonu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kendi Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID (Kopyalanacak)').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID (Sıfırlanacak)').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_nuclear_clone') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t').trim();
            const srcId = interaction.fields.getTextInputValue('s').trim();
            const trgId = interaction.fields.getTextInputValue('h').trim();

            const self = new SelfClient({ 
                checkUpdate: false,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" 
            });
            
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return owner.send("❌ **Hata:** Sunucu bulunamadı! Tokenin her iki sunucuda da olduğundan emin ol.");

                    await owner.send(`🚀 **Nükleer İşlem Başlatıldı!**\n**Hedef:** ${trg.name} (Sıfırlanıyor)\n**Kaynak:** ${src.name} (Kopyalanıyor)`);

                    // --- BÖLÜM 1: TAM TEMİZLİK (WIPE) ---
                    await owner.send("🧹 **Bölüm 1:** Hedef sunucudaki her şey siliniyor...");
                    
                    const channels = await trg.channels.fetch();
                    for (const c of channels.values()) {
                        await c.delete().catch(() => {});
                        await jitter(600);
                    }
                    
                    const roles = await trg.roles.fetch();
                    for (const r of roles.values()) {
                        if (r.name !== '@everyone' && !r.managed && r.editable) {
                            await r.delete().catch(() => {});
                            await jitter(500);
                        }
                    }

                    const emojis = await trg.emojis.fetch();
                    for (const e of emojis.values()) {
                        await e.delete().catch(() => {});
                        await jitter(300);
                    }
                    await owner.send("✅ Temizlik bitti. Sunucu şu an tertemiz.");

                    // --- BÖLÜM 2: KİMLİK VE ROLLER ---
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                    
                    const roleMap = new Map();
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                    
                    for (const r of srcRoles.values()) {
                        const newRole = await trg.roles.create({
                            name: r.name, color: r.color, permissions: r.permissions,
                            hoist: r.hoist, mentionable: r.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(r.id, newRole.id);
                        await jitter(600);
                    }
                    await owner.send("🎭 **Bölüm 2:** Roller ve hiyerarşi oluşturuldu.");

                    // --- BÖLÜM 3: KANAL VE KATEGORİLER (İZİNLER DAHİL) ---
                    await owner.send("🏗️ **Bölüm 3:** Kanallar ve gizli odalar inşa ediliyor...");
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

                    // --- BÖLÜM 4: EMOJİLER ---
                    await owner.send("✨ **Bölüm 4:** Emojiler taşınıyor...");
                    for (const emoji of src.emojis.cache.values()) {
                        await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                        await jitter(500);
                    }

                    await owner.send(`👑 **İŞLEM TAMAMLANDI!** \`${src.name}\` sunucusu en küçük ayrıntısına kadar klonlandı.`);
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ **Kritik Hata:** ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply("❌ Token hatalı kanka!"));
        }
    }
};
