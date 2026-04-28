const { 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_deep_copy' || int.customId === 'modal_deep_copy') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('🧬 FORCES Deep Copy (En Küçük Noktasına Kadar)')
            .setDescription(
                `Bu işlem Discord API sınırlarını zorlayarak sunucuyu kopyalar:\n\n` +
                `🔳 **Emoji & Sticker:** Sunucudaki özel ifadeler.\n` +
                `🎭 **Rol Hiyerarşisi:** Renkler, yetkiler ve sıralama.\n` +
                `🔒 **Özel İzinler:** Hangi rolün hangi odayı göreceği.\n` +
                `🖼️ **Görsel Kimlik:** Banner, İkon, İsim.`
            )
            .setFooter({ text: 'Discord API Limitlerine Uygun Hızda Çalışır.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_deep_copy').setLabel('Derin Kopyalamayı Başlat').setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_deep_copy') {
            const modal = new ModalBuilder().setCustomId('modal_deep_copy').setTitle('Deep Copy Bilgileri');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_deep_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ checkUpdate: false });
            const owner = interaction.user;

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return owner.send("❌ Sunucu hatası!").then(() => self.destroy());

                    await owner.send(`☣️ **Derin Kopyalama Başladı.** Her şey taşınıyor...`);

                    // 1. GÖRSEL KİMLİK
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) await trg.setIcon(src.iconURL({ size: 1024 })).catch(() => {});
                    if (src.bannerURL()) await trg.setBanner(src.bannerURL({ size: 1024 })).catch(() => {});

                    // 2. ROLLER (ID Haritalama ile)
                    const roleMap = new Map();
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                    
                    for (const r of srcRoles.values()) {
                        const newRole = await trg.roles.create({
                            name: r.name, color: r.color, permissions: r.permissions,
                            hoist: r.hoist, mentionable: r.mentionable
                        }).catch(() => null);
                        if (newRole) roleMap.set(r.id, newRole.id);
                        await new Promise(res => setTimeout(res, 500));
                    }
                    await owner.send("🎭 Roller ve yetkiler başarıyla eşleşti.");

                    // 3. EMOJİLER
                    for (const emoji of src.emojis.cache.values()) {
                        await trg.emojis.create(emoji.url, emoji.name).catch(() => {});
                        await new Promise(res => setTimeout(res, 400));
                    }
                    await owner.send("🎨 Emojiler taşındı.");

                    // 4. KANALLAR VE ÖZEL İZİNLER (Overwrites)
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
                                await new Promise(res => setTimeout(res, 800));
                            }
                        }
                    }

                    await owner.send(`✅ **İŞLEM TAMAMLANDI.** ${src.name} sunucusunun ruhu ${trg.name} sunucusuna aktarıldı.`);
                    self.destroy();
                } catch (err) {
                    await owner.send(`❌ Hata: ${err.message}`);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply("Token yanlış."));
        }
    }
};
