const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucu verilerini analiz eder.'),
    
    async execute(interaction) {
        // Görseldeki siyah/koyu tema embed yapısı
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`: discord.gg/base64`)
            .addFields({ name: 'mesaj:', value: '7272' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('copy_trigger')
                    .setLabel('.gg/json')
                    .setStyle(ButtonStyle.Danger),
            );

        // Sadece sen gör (Ephemeral)
        await interaction.reply({ 
            embeds: [embed], 
            components: [row], 
            ephemeral: true 
        });
    },
};
