const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.fullCopyListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_ultra_copy' || int.customId === 'modal_ultra_copy') {
                    await this.handleInteraction(int);
                }
            });
            client.fullCopyListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES Ultra Sunucu Kopyalayıcı' })
            .setTitle('👑 Tam Teşekküllü Klonlama')
            .setDescription(
                `Bu işlem şunları kapsar:\n\n` +
                `🖼️ **Sunucu İsmi ve İkonu**\n` +
                `🛡️ **Roller ve İzinleri**\n` +
                `📁 **Kategoriler ve Kanallar**\n` +
                `⚙️ **Kanal İzinleri (Permission Overwrites)**\n\n` +
                `**Hız:** Her işlem arası 1 Saniye (Durma yapmaz).`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_ultra_copy')
                .setLabel('Ultra Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Success)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_ultra_copy') {
            const modal = new ModalBuilder().setCustomId('modal_ultra_copy').setTitle('Ultra Klonlama Bilgileri');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Token').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_ultra_copy') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('t');
            const srcId = interaction.fields.getTextInputValue('s');
            const trgId = interaction.fields.getTextInputValue('h');

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const src = self.guilds.cache.get(srcId);
                    const trg = self.guilds.cache.get(trgId);

                    if (!src || !trg) return interaction.editReply('❌ Sunucu bulunamadı! Hesabının her iki sunucuda da olması lazım.');

                    // --- 1. SUNUCU ADI VE İKONU KOPYALAMA ---
                    await interaction.editReply('🖼️ Sunucu adı ve ikonu kopyalanıyor...');
                    await trg.setName(src.name).catch(() => {});
                    if (src.iconURL()) {
                        await trg.setIcon(src.iconURL({ dynamic: true, size: 1024 })).catch(() => {});
                    }
                    await new Promise(r => setTimeout(r, 1000));

                    // --- 2. TEMİZLİK (KANALLAR) ---
                    await interaction.editReply('🧹 Kanallar temizleniyor...');
                    for (const c of trg.channels.cache.values()) {
                        await c.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    // --- 3. TEMİZLİK (ROLLER) ---
                    await interaction.editReply('🧹 Roller temizleniyor...');
                    const rolesToDel = trg.roles.cache.filter(r => r.name !== '@everyone' && !r.managed && r.editable);
                    for (const role of rolesToDel.values()) {
                        await role.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    // --- 4. ROLLERİ OLUŞTUR ---
                    await interaction.editReply('🏗️ Roller inşa ediliyor...');
                    const srcRoles = src.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a, b) => a.position - b.position);
                    for (const r of srcRoles.values()) {
                        await trg.roles.create({
                            name: r.name,
                            color: r.color,
                            permissions: r.permissions,
                            hoist: r.hoist,
                            mentionable: r.mentionable
                        }).catch(() => {});
                        await new Promise(r => setTimeout(r, 1000));
                    }

                    // --- 5. KATEGORİ VE KANALLARI OLUŞTUR ---
                    await interaction.editReply('🏗️ Kanallar ve izinler kopyalanıyor...');
                    const srcChans = src.channels.cache.sort((a, b) => a.position - b.position);
                    const cats = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

                    for (const cat of cats.values()) {
                        const newCat = await trg.channels.create(cat.name, { 
                            type: 4,
                            permissionOverwrites: cat.permissionOverwrites.cache.map(p => ({
                                id: p.id,
                                allow: p.allow,
                                deny: p.deny,
                                type: p.type
                            }))
                        }).catch(() => null);
                        await new Promise(r => setTimeout(r, 1000));

                        if (newCat) {
                            const children = srcChans.filter(c => c.parentId === cat.id);
                            for (const child of children.values()) {
                                let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                                await trg.channels.create(child.name, { 
                                    type: type, 
                                    parent: newCat.id,
                                    permissionOverwrites: child.permissionOverwrites.cache.map(p => ({
                                        id: p.id,
                                        allow: p.allow,
                                        deny: p.deny,
                                        type: p.type
                                    }))
                                }).catch(() => {});
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        }
                    }

                    await interaction.editReply('✅ **FULL KLONLAMA BİTTİ!** Sunucu artık kaynak sunucunun ikiz kardeşi.');
                    self.destroy();
                } catch (err) {
                    await interaction.editReply('❌ Hata: ' + err.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token geçersiz!'));
        }
    }
};
