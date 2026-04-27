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
        if (!client.kurSelfListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_self_full_kur' || int.customId === 'modal_self_full_kur') {
                    await this.handleInteraction(int);
                }
            });
            client.kurSelfListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES Full Klonlama', iconURL: client.user.displayAvatarURL() })
            .setTitle('🚀 Komple Sunucu Değişimi')
            .setDescription(
                `Bu işlem senin hesabın üzerinden şu sırayla yapılır:\n\n` +
                `▫️ **1.** Hedefteki tüm kanallar silinir.\n` +
                `▫️ **2.** Hedefteki tüm roller (temizlenebilenler) silinir.\n` +
                `▫️ **3.** Kaynaktaki roller oluşturulur.\n` +
                `▫️ **4.** Kaynaktaki kategoriler ve kanallar oluşturulur.`
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_self_full_kur')
                .setLabel('Full Kurulumu Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_self_full_kur') {
            const modal = new ModalBuilder().setCustomId('modal_self_full_kur').setTitle('Full Klonlama');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('token').setLabel('Hesap Tokenin').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('src').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('trg').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_self_full_kur') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('token');
            const sourceId = interaction.fields.getTextInputValue('src');
            const targetId = interaction.fields.getTextInputValue('trg');

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const sourceGuild = self.guilds.cache.get(sourceId);
                    const targetGuild = self.guilds.cache.get(targetId);

                    if (!sourceGuild || !targetGuild) return interaction.editReply('❌ Sunucular bulunamadı!');

                    await interaction.editReply('🔄 Temizlik başlıyor (Kanal & Rol)...');

                    // 1. KANALLARI SİL
                    for (const ch of targetGuild.channels.cache.values()) {
                        await ch.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 200));
                    }

                    // 2. ROLLERİ SİL (En üstteki roller ve @everyone hariç)
                    const targetRoles = targetGuild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed);
                    for (const role of targetRoles.values()) {
                        await role.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 200));
                    }

                    await interaction.editReply('🏗️ Roller kopyalanıyor...');

                    // 3. ROLLERİ OLUŞTUR
                    const sourceRoles = sourceGuild.roles.cache.filter(r => r.name !== '@everyone' && !r.managed).sort((a, b) => a.position - b.position);
                    for (const r of sourceRoles.values()) {
                        await targetGuild.roles.create({
                            name: r.name,
                            color: r.color,
                            permissions: r.permissions,
                            hoist: r.hoist,
                            mentionable: r.mentionable
                        }).catch(() => {});
                        await new Promise(r => setTimeout(r, 300));
                    }

                    await interaction.editReply('🏗️ Kanallar kopyalanıyor...');

                    // 4. KANALLARI OLUŞTUR (Kategori ve Alt Kanallar)
                    const sourceChans = sourceGuild.channels.cache.sort((a, b) => a.position - b.position);
                    const categories = sourceChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);
                    
                    for (const cat of categories.values()) {
                        const newCat = await targetGuild.channels.create(cat.name, { type: 4 });
                        const children = sourceChans.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            let cType = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                            await targetGuild.channels.create(child.name, { type: cType, parent: newCat.id }).catch(() => {});
                            await new Promise(r => setTimeout(r, 500));
                        }
                    }

                    await interaction.editReply('✅ Full kopyalama (Rol + Kanal) tamamlandı!');
                    self.destroy();

                } catch (err) {
                    await interaction.editReply('Hata: ' + err.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token hatalı!'));
        }
    }
};
