const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Bu sunucudaki tüm kanallara durmadan mesaj gönderir.'),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('spam_flood_modal')
            .setTitle('Mesaj Yağmuru Ayarları');

        const msgInput = new TextInputBuilder()
            .setCustomId('flood_text')
            .setLabel('Gönderilecek Mesaj')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const countInput = new TextInputBuilder()
            .setCustomId('flood_count')
            .setLabel('Kanal Başı Mesaj Sayısı (Örn: 100)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(msgInput),
            new ActionRowBuilder().addComponents(countInput)
        );

        await interaction.showModal(modal);
    },
};
