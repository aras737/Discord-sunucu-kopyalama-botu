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
        .setDescription('Sunucu kopyalama panelini açar.'),

    async execute(interaction) {
        // Panel Embed Yapısı
        const embed = new EmbedBuilder()
            .setTitle(`⚙️ Aethelgard Sunucu Kopyalayıcı`)
            .setColor('#5865F2')
            .setDescription(
                `✅ **Gelişmiş Klonlama Sistemi**\n` +
                `Sunucunun tüm kanal, rol ve ikon yapılarını aktarır.\n\n` +
                `🔹 **İşlemler:**\n` +
                `> • Sunucu İkonu ve Adı 🖼️\n` +
                `> • Rollerin Tamamı 🎭\n` +
                `> • Kategoriler ve Kanallar 📂\n`
            )
            .setFooter({ text: 'Aethelgard • discord.gg/base64' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('copy_trigger')
                .setLabel('.gg/json')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚀')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
