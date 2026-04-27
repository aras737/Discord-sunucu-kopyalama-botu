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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Mesaj yağmuru panelini açar.'),

    async execute(interaction) {
        const client = interaction.client;

        // --- OTOMATİK EVENT YÖNLENDİRME ---
        if (!client.spamBotListener) {
            client.on('interactionCreate', async (int) => {
                await this.handleInteraction(int);
            });
            client.spamBotListener = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'Aethelgard Sunucu Kopyalayıcı', iconURL: client.user.displayAvatarURL() })
            .setTitle('🚀 Aethelgard Spam Sistemi')
            .setDescription(
                `**Ufak bilgilendirme:** Discord’daki her sunucuda olur. Bu, bize yazanları korumaya alıyoruz. Sunucusunu korumak isteyenlerde sadece olmaz; haberiniz olsun.\n\n` +
                `“Bilinmeyen entegrasyon hatası” alırsanız sayfayı yenileyin, düzelir.\n\n` +
                `**-- Atılan spamlardan biz sorumlu değiliz!**`
            )
            .addFields(
                { name: '🔹 Operasyon Modu', value: 'Bot yetkisiyle tüm kanallara erişim.', inline: false },
                { name: '⚡ Hız', value: 'Saniyede birden fazla mesaj (Limitlere takılmadan).', inline: false }
            )
            .setFooter({ text: 'Aethelgard Protection & Raid System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_spam_start_bot')
                .setLabel('Saldırıyı Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('☣️')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },

    async handleInteraction(interaction) {
        // 1. BUTON: Formu Aç
        if (interaction.isButton() && interaction.customId === 'btn_spam_start_bot') {
            const modal = new ModalBuilder()
                .setCustomId('modal_spam_bot_run')
                .setTitle('Saldırı Yapılandırması');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('input_msg')
                        .setLabel('Spam Mesajı')
                        .setPlaceholder('Örn: FORCES BURADA!')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('input_count')
                        .setLabel('Kanal Başına Mesaj Sayısı')
                        .setPlaceholder('Örn: 50')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );

            return await interaction.showModal(modal);
        }

        // 2. MODAL: Botu Serbest Bırak
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_spam_bot_run') {
            await interaction.deferReply({ ephemeral: true });

            const sMsg = interaction.fields.getTextInputValue('input_msg');
            const sCount = parseInt(interaction.fields.getTextInputValue('input_count')) || 10;

            // Sunucudaki tüm yazılabilir metin kanallarını bul
            const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());

            await interaction.editReply({ 
                content: `🚀 **Operasyon Başladı!** ${channels.size} kanala ${sCount}'er mesaj gönderiliyor.` 
            });

            // Eşzamanlı saldırı döngüsü
            channels.forEach(async (chan) => {
                for (let i = 0; i < sCount; i++) {
                    try {
                        await chan.send(sMsg);
                        // Botun banlanmaması için saniyenin 5'te biri kadar bekleme
                        await new Promise(r => setTimeout(r, 200)); 
                    } catch (err) {
                        // Yetki yoksa o kanalı pas geç
                        break;
                    }
                }
            });
        }
    }
};
