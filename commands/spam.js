const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mesaj_spam')
        .setDescription('Sunucudaki tüm kanallara istediğiniz mesajı gönderir.'),

    async execute(interaction) {
        // Arayüz paneli
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🚀 Mesaj Spam Terminali')
            .setDescription('Aşağıdaki butona tıklayarak gönderilecek mesajı ve detayları ayarlayın.')
            .setFooter({ text: 'Sadece yetkili kullanımı içindir.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('spam_ayar_ac')
                .setLabel('Mesajı Ayarla')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✉️')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // Modal (Form) Dinleyici
        const filter = i => i.customId === 'spam_ayar_ac';
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const modal = new ModalBuilder()
                .setCustomId('mesaj_modal')
                .setTitle('Spam Mesajı Ayarları');

            const msgInput = new TextInputBuilder()
                .setCustomId('spam_text')
                .setLabel('Gönderilecek Mesaj')
                .setPlaceholder('Örn: discord.gg/base64 veya sadece 1')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const countInput = new TextInputBuilder()
                .setCustomId('spam_count')
                .setLabel('Kanal Başına Kaç Mesaj?')
                .setPlaceholder('Örn: 1 (Çok yüksek girmeyin, ban sebebi)')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(msgInput),
                new ActionRowBuilder().addComponents(countInput)
            );

            await i.showModal(modal);
        });
    },
};
