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
const { Client: SelfClient } = require('discord.js-selfbot-v13'); // Self-bot kütüphanesi şart

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        // --- SELF-CONTAINED EVENT LISTENER ---
        if (!message.client.kurSelfListener) {
            message.client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_self_clone' || int.customId === 'modal_self_clone') {
                    await this.handleInteraction(int);
                }
            });
            message.client.kurSelfListener = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES Self-Bot Klonlayıcı', iconURL: message.client.user.displayAvatarURL() })
                .setDescription(
                `🚀 **Self-Bot ile Sunucu Kopyalama**\n\n` +
                `▫️ Kaynak sunucudaki tüm kanallar ve kategoriler self-bot aracılığıyla okunur.\n` +
                `▫️ Hedef sunucuya birebir inşa edilir.\n\n` +
                `**Uyarı:** İşlem başladığında hedefteki tüm kanallar silinir!`
            )
            .setFooter({ text: 'Aethelgard Protection System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_self_clone')
                .setLabel('Self-Bot Kurulumunu Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_self_clone') {
            const modal = new ModalBuilder().setCustomId('modal_self_clone').setTitle('Self-Bot Yapılandırma');
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('token').setLabel('Self-Bot Token').setPlaceholder('Hesap tokenini girin...').setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('source').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                )
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_self_clone') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('token');
            const sourceId = interaction.fields.getTextInputValue('source');
            const targetGuild = interaction.guild; // Komutun kullanıldığı sunucu hedef alınır

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const sourceGuild = self.guilds.cache.get(sourceId);
                    if (!sourceGuild) return interaction.editReply('❌ Self-bot bu kaynak sunucuda yok!');

                    await interaction.editReply('🔄 Temizlik ve kopyalama başladı...');

                    // 1. ADIM: Hedef Sunucuyu Temizle (Bot Yetkisiyle)
                    const targetChannels = await targetGuild.channels.fetch();
                    for (const ch of targetChannels.values()) {
                        await ch.delete().catch(() => {});
                    }

                    // 2. ADIM: Kanalları Kopyala (Self-bottan oku, Hedefe yaz)
                    const sourceChannels = sourceGuild.channels.cache.sort((a, b) => a.position - b.position);
                    
                    // Önce Kategoriler
                    const categories = sourceChannels.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);
                    for (const cat of categories.values()) {
                        const newCat = await targetGuild.channels.create(cat.name, { type: 4 }); // 4 = Category

                        // Alt Kanallar
                        const children = sourceChannels.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            let type = child.type === 'GUILD_VOICE' || child.type === 2 ? 2 : 0; // Ses mi Metin mi?
                            await targetGuild.channels.create(child.name, {
                                type: type,
                                parent: newCat.id
                            });
                            await new Promise(r => setTimeout(r, 600)); // Rate limit koruması
                        }
                    }
                    
                    await interaction.editReply('✅ Kanallar başarıyla kopyalandı!');
                    self.destroy();

                } catch (err) {
                    await interaction.editReply('❌ Hata: ' + err.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Geçersiz Token!'));
        }
    }
};
