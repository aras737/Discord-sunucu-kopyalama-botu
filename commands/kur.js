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
        const OWNER_ID = "1389930042200559706"; // Senin ID'n
        if (message.author.id !== OWNER_ID) return;

        // --- SELF-SETUP EVENT LISTENER ---
        const client = message.client;
        if (!client.kurSelfListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_self_kur' || int.customId === 'modal_self_kur') {
                    await this.handleInteraction(int);
                }
            });
            client.kurSelfListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES | Sunucu Klonlayıcı', iconURL: client.user.displayAvatarURL() })
            .setTitle('🕵️ Self-Bot Kurulum Sistemi')
            .setDescription(
                `Bu sistem ana botun yetkilerini kullanmaz, tamamen **senin hesabın** üzerinden işlem yapar.\n\n` +
                `▫️ **Kaynak ID:** Kanalların alınacağı yer.\n` +
                `▫️ **Hedef ID:** Yeni kanalların açılacağı yer.\n\n` +
                `**Uyarı:** İşlem başladığında hedef sunucudaki tüm kanallar hesabın tarafından silinecektir!`
            )
            .setFooter({ text: 'FORCES Development' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_self_kur')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚙️')
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_self_kur') {
            const modal = new ModalBuilder().setCustomId('modal_self_kur').setTitle('Self-Bot Bilgileri');
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('token').setLabel('Hesap Tokenin').setPlaceholder('Tokenini buraya yapıştır...').setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('src').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('trg').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                )
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_self_kur') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('token');
            const sourceId = interaction.fields.getTextInputValue('src');
            const targetId = interaction.fields.getTextInputValue('trg');

            // Self-botu başlatıyoruz
            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const sourceGuild = self.guilds.cache.get(sourceId);
                    const targetGuild = self.guilds.cache.get(targetId);

                    if (!sourceGuild || !targetGuild) {
                        return interaction.editReply('❌ Hata: Hesabın belirtilen sunuculardan birinde bulunmuyor!');
                    }

                    await interaction.editReply('🔄 İşlem başladı... Kanallar temizleniyor.');

                    // 1. ADIM: Hedef Sunucuyu Temizle (Senin hesabınla)
                    const targetChans = targetGuild.channels.cache;
                    for (const ch of targetChans.values()) {
                        await ch.delete().catch(() => {});
                        await new Promise(r => setTimeout(r, 200)); 
                    }

                    await interaction.editReply('🏗️ Kanallar kopyalanıyor...');

                    // 2. ADIM: Kanalları Kopyala (Senin hesabınla)
                    const sourceChans = sourceGuild.channels.cache.sort((a, b) => a.position - b.position);
                    
                    // Önce Kategoriler
                    const categories = sourceChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);
                    for (const cat of categories.values()) {
                        const newCat = await targetGuild.channels.create(cat.name, { type: 4 });

                        // Kategorinin Altındaki Kanallar
                        const children = sourceChans.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            let cType = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                            await targetGuild.channels.create(child.name, {
                                type: cType,
                                parent: newCat.id
                            }).catch(() => {});
                            await new Promise(r => setTimeout(r, 500)); // Rate limit koruması
                        }
                    }
                    
                    await interaction.editReply('✅ Kopyalama işlemi başarıyla tamamlandı!');
                    self.destroy();

                } catch (err) {
                    await interaction.editReply('❌ Hata oluştu: ' + err.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Geçersiz Token girdin!'));
        }
    }
};
