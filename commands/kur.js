const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// Bypasser Hız Ayarı (Milisaniye cinsinden rastgele gecikme)
const bypassWait = () => new Promise(res => setTimeout(res, Math.floor(Math.random() * 800) + 700));

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_bypass_copy' || int.customId === 'modal_bypass_copy') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🛡️ FORCES Bypasser & Deep Copy')
            .setDescription(
                `Discord API limitlerini ve koruma sistemlerini bypass ederek kopyalama yapar.\n\n` +
                `🚀 **Hız:** Değişken (Bypass Modu Aktif)\n` +
                `🎭 **İzinler:** Full Permission Overwrites\n` +
                `🧬 **Veri:** Roller, Emojiler, Kanallar ve Kategoriler`
            )
            .setFooter({ text: 'Bypasser Mode: ON' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_bypass_copy').setLabel('Bypass Kopyalamayı Başlat').setStyle(ButtonStyle.Secondary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_bypass_copy') {
            const modal = new ModalBuilder().setCustomId('modal_bypass_copy').setTitle('Bypass Copy Konfigürasyon');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Kendi Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_bypass_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            // Bypasser için özel ayarlar
            const self = new SelfClient({ 
                checkUpdate: false,
                patchVoice: true,
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36" // Tarayıcı taklidi
            });
            
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return owner.send("❌ Sunucu bulunamadı!").then(() => self.destroy());

                    await owner.send(`🛡️ **Bypasser Devrede.** Filtrelere takılmadan kopyalama yapılıyor...`);

                    // 1. TEMİZLİK (Bypass Hızıyla)
                    const oldChans = await trg.channels.fetch();
                    for (const c of oldChans.values()) {
                        await c.delete().catch(() => {});
                        await bypassWait();
                    }

                    // 2. ROLLER VE HIYERARŞİ
                    const roleMap = new Map();
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                    
                    for (const r of srcRoles.values()) {
                        const newRole = await trg.roles.create({
                            name: r.name, color: r.color, permissions: r.permissions,
                            hoist: r.hoist, mentionable: r.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(r.id, newRole.id);
                        await bypassWait();
                    }

                    // 3. KANALLAR VE ÖZEL PERMS
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
                        await bypassWait();

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
                                await bypassWait();
                            }
                        }
                    }

                    await owner.send(`✅ **Bypass Kopyalama Bitti.** API limitlerine takılmadan ${src.name} klonlandı.`);
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ Hata: ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply("Token hatalı!"));
        }
    }
};
