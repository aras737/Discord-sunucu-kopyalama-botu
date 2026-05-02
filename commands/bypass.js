const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Reklamlı linkleri anında geçer.')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Bypass edilecek reklamlı link')
                .setRequired(true))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const url = interaction.options.getString('link');

        // Kullanıcıya işlemin başladığını bildir
        await interaction.reply({ content: '🔍 Link çözülüyor, lütfen bekleyin...', ephemeral: true });

        try {
            // Bypass API (Ücretsiz ve hızlı bir API kullanıyoruz)
            const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`);
            const data = response.data;

            if (data.status === "success") {
                const result = data.result; // Çözülen link

                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Successful!')
                    .setColor('#2ecc71')
                    .setDescription('Reklam başarıyla geçildi.')
                    .addFields(
                        { name: '💻 Sonuç (PC)', value: `\`\`\`${result}\`\`\`` },
                        { name: '📱 Sonuç (Mobil)', value: `\`\`\`${result}\`\`\`` }
                    )
                    .setFooter({ text: `İşlem süresi: ${data.time || '1.2'}s` })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Linke Git')
                            .setURL(result)
                            .setStyle(ButtonStyle.Link),
                        new ButtonBuilder()
                            .setCustomId('copy_pc')
                            .setLabel('Copy PC')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true) // Botlar direkt kopyalama yapamaz, linki vermek en iyisi
                    );

                await interaction.editReply({ content: '', embeds: [embed], components: [row] });
            } else {
                await interaction.editReply({ content: '❌ Link çözülemedi. Desteklenmeyen bir servis olabilir.' });
            }

        } catch (error) {
            console.error("Bypass Hatası:", error);
            await interaction.editReply({ content: '🛑 API hatası oluştu veya servis şu an çalışmıyor.' });
        }
    }
};
