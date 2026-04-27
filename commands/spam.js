const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucu spam operasyonunu başlatır.'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#000000')
                .setTitle('☣️ Base64 Aethelgard Terminal')
                .setDescription('Sunucuyu kopyalamak ve her kanalda iz bırakmak için aşağıdaki butona tıkla.')
                .setFooter({ text: 'discord.gg/base64' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('spam_modal_ac')
                    .setLabel('.gg/json')
                    .setStyle(ButtonStyle.Danger)
            );

            // ephemeral: true yaparak sadece kullanıcının görmesini sağlıyoruz
            await interaction.reply({ 
                embeds: [embed], 
                components: [row], 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Spam komutu yürütülürken hata oluştu:', error);
        }
    },
};
