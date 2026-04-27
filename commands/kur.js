const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur', // Mesaj komutu olarak çalışacak
    async execute(message) {
        // --- 1. ARAYÜZ ---
        const embed = new EmbedBuilder()
            .setColor('#5865f2')
            .setAuthor({ name: 'Aethelgard Sunucu Klonlama Sistemi', iconURL: message.client.user.displayAvatarURL() })
            .setDescription(
                `☣️ **Dikkat:** Bu işlem hedef sunucudaki her şeyi siler ve kaynak sunucunun birebir kopyasını oluşturur.\n\n` +
                `▫️ **Adım 1:** Aşağıdaki butona tıkla.\n` +
                `▫️ **2.** Self Token ve Sunucu ID'lerini gir.\n` +
                `▫️ **3.** Arkanıza yaslanın ve botun her şeyi inşa etmesini izleyin.`
            )
            .setFooter({ text: '⚡ MADE BY FORCES | discord.gg/base64' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_kur_baslat')
                .setLabel('Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🚀')
        );

        const response = await message.reply({ embeds: [embed], components: [row] });

        // --- 2. ÇALIŞMA PRENSİBİ (EVENTLER) ---
        const collector = response.createMessageComponentCollector({ time: 600000 });

        collector.on('collect', async i => {
            if (i.customId === 'btn_kur_baslat') {
                const modal = new ModalBuilder().setCustomId('modal_kur_config').setTitle('Klonlama Ayarları');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('self_token').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('source_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                );

                await i.showModal(modal);
            }
        });

        // Modal Dinleyicisi
        message.client.on('interactionCreate', async (mInt) => {
            if (mInt.type !== InteractionType.ModalSubmit || mInt.customId !== 'modal_kur_config') return;

            const st = mInt.fields.getTextInputValue('self_token');
            const sid = mInt.fields.getTextInputValue('source_id');
            const tid = mInt.fields.getTextInputValue('target_id');

            await mInt.reply({ content: '⚙️ **Operasyon Başladı.** Kanallar, roller ve izinler senkronize ediliyor...', ephemeral: true });

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const source = self.guilds.cache.get(sid);
                    const target = self.guilds.cache.get(tid);

                    if (!source || !target) return mInt.followUp({ content: '❌ Sunucu bulunamadı! Tokenin her iki sunucuda olduğundan emin olun.', ephemeral: true });

                    // --- ADIM 1: HEDEFİ SIFIRLA ---
                    const channels = await target.channels.fetch();
                    for (const c of channels.values()) await c.delete().catch(() => {});
                    
                    const roles = await target.roles.fetch();
                    for (const r of roles.values()) {
                        if (r.managed || r.name === "@everyone") continue;
                        await r.delete().catch(() => {});
                    }

                    // --- ADIM 2: ROLLERİ KOPYALA (Yetkiler ve Renkler Dahil) ---
                    const sRoles = [...(await source.roles.fetch()).values()].sort((a, b) => a.position - b.position);
                    const roleMap = new Map();

                    for (const role of sRoles) {
                        if (role.managed || role.name === "@everyone") continue;
                        const newRole = await target.roles.create({
                            name: role.name,
                            color: role.color,
                            permissions: role.permissions,
                            hoist: role.hoist,
                            mentionable: role.mentionable
                        }).catch(() => {});
                        if (newRole) roleMap.set(role.id, newRole.id);
                    }

                    // --- ADIM 3: KATEGORİLER VE KANALLAR ---
                    const sChannels = await source.channels.fetch();
                    const categories = sChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);

                    for (const cat of categories.values()) {
                        const newCat = await target.channels.create(cat.name, { 
                            type: 'GUILD_CATEGORY',
                            permissionOverwrites: cat.permissionOverwrites.cache.map(ov => ({
                                id: roleMap.get(ov.id) || ov.id,
                                allow: ov.allow,
                                deny: ov.deny
                            }))
                        });

                        const children = sChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                        for (const child of children.values()) {
                            await target.channels.create(child.name, {
                                type: child.type,
                                parent: newCat.id,
                                nsfw: child.nsfw,
                                topic: child.topic,
                                rateLimitPerUser: child.rateLimitPerUser,
                                permissionOverwrites: child.permissionOverwrites.cache.map(ov => ({
                                    id: roleMap.get(ov.id) || ov.id,
                                    allow: ov.allow,
                                    deny: ov.deny
                                }))
                            });
                            await new Promise(r => setTimeout(r, 1000)); // Rate limit koruması
                        }
                    }

                    await mInt.followUp({ content: '✅ **Başarılı!** Sunucu milimetrik olarak kopyalandı.', ephemeral: true });
                    self.destroy();
                } catch (err) {
                    console.error(err);
                    self.destroy();
                }
            });

            self.login(st).catch(() => mInt.followUp({ content: '❌ Self Token hatalı!', ephemeral: true }));
        });
    }
};
