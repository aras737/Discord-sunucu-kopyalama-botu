const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType,
    ChannelType
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES | Ultra Sunucu Yapılandırma', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('⚡ Tam Kapsamlı Klonlama Sistemi')
            .setDescription(
                `Bu işlem şunları kapsar:\n\n` +
                `🎭 **Roller:** Tüm roller, renkler ve yetkiler.\n` +
                `📁 **Kategoriler:** Düzenli bir şekilde taşınır.\n` +
                `💬 **Kanallar:** Metin ve ses kanalları (İzinleriyle).\n\n` +
                `**Bilgi:** İşlem adımları DM'den size iletilecektir.`
            )
            .setFooter({ text: 'FORCES Development' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_clone_start')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛠️')
        );

        await message.reply({ embeds: [embed], components: [row] });

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.isButton() && int.customId === 'btn_clone_start') {
                    const modal = new ModalBuilder().setCustomId('modal_clone_config').setTitle('Klonlama Ayarları');
                    modal.addComponents(
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('token').setLabel('Hesap Tokeniniz').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('src_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('trg_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
                    );
                    await int.showModal(modal);
                }

                if (int.type === InteractionType.ModalSubmit && int.customId === 'modal_clone_config') {
                    await int.deferReply({ ephemeral: true });

                    const userToken = int.fields.getTextInputValue('token');
                    const sourceGuildId = int.fields.getTextInputValue('src_id');
                    const targetGuildId = int.fields.getTextInputValue('trg_id');

                    const self = new SelfClient({ checkUpdate: false });
                    const owner = int.user;

                    self.on('ready', async () => {
                        try {
                            const sourceGuild = self.guilds.cache.get(sourceGuildId);
                            const targetGuild = self.guilds.cache.get(targetGuildId);

                            if (!sourceGuild || !targetGuild) {
                                await owner.send("❌ **Hata:** Sunucular bulunamadı!");
                                return self.destroy();
                            }

                            await owner.send(`🚀 **Klonlama Başladı!** \`${sourceGuild.name}\` kopyalanıyor...`);

                            // --- 1. ADIM: TEMİZLİK ---
                            await owner.send("🧹 **Adım 1:** Kanallar ve roller temizleniyor...");
                            const tChans = await targetGuild.channels.fetch();
                            for (const c of tChans.values()) await c.delete().catch(() => {});
                            
                            const tRoles = await targetGuild.roles.fetch();
                            for (const r of tRoles.values()) {
                                if (r.name !== '@everyone' && !r.managed && r.editable) await r.delete().catch(() => {});
                            }

                            // --- 2. ADIM: ROLLERİ OLUŞTUR ---
                            await owner.send("🎭 **Adım 2:** Roller oluşturuluyor...");
                            const srcRoles = sourceGuild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a,b) => a.position - b.position);
                            
                            const roleMap = new Map(); // Eski rol ID -> Yeni rol ID eşleşmesi için
                            for (const r of srcRoles.values()) {
                                const newRole = await targetGuild.roles.create({
                                    name: r.name,
                                    color: r.color,
                                    permissions: r.permissions,
                                    hoist: r.hoist,
                                    mentionable: r.mentionable
                                }).catch(() => null);
                                if (newRole) roleMap.set(r.id, newRole.id);
                                await new Promise(r => setTimeout(r, 600));
                            }

                            // --- 3. ADIM: KANALLAR VE İZİNLER ---
                            await owner.send("🏗️ **Adım 3:** Kanallar ve kategori izinleri taşınıyor...");
                            const srcChans = sourceGuild.channels.cache.sort((a,b) => a.position - b.position);
                            const categories = srcChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);

                            for (const cat of categories.values()) {
                                // Kategori izinlerini de ayarlıyoruz
                                const newCat = await targetGuild.channels.create(cat.name, {
                                    type: 4,
                                    permissionOverwrites: cat.permissionOverwrites.cache.map(o => ({
                                        id: roleMap.get(o.id) || o.id, // Rol eşleşmesi varsa yeni ID'yi kullan
                                        allow: o.allow,
                                        deny: o.deny,
                                        type: o.type
                                    }))
                                }).catch(() => null);

                                if (newCat) {
                                    const children = srcChans.filter(c => c.parentId === cat.id);
                                    for (const child of children.values()) {
                                        let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                                        await targetGuild.channels.create(child.name, {
                                            type: type,
                                            parent: newCat.id,
                                            permissionOverwrites: child.permissionOverwrites.cache.map(o => ({
                                                id: roleMap.get(o.id) || o.id,
                                                allow: o.allow,
                                                deny: o.deny,
                                                type: o.type
                                            }))
                                        }).catch(() => {});
                                        await new Promise(r => setTimeout(r, 800));
                                    }
                                }
                            }

                            await owner.send(`✅ **Klonlama Başarılı!** Tüm roller ve kanallar taşındı.`);
                            self.destroy();

                        } catch (error) {
                            await owner.send(`❌ **Hata:** ${error.message}`);
                            self.destroy();
                        }
                    });

                    self.login(userToken).catch(() => int.editReply("❌ Token hatalı!"));
                }
            });
            client.kurListenerSet = true;
        }
    }
};
