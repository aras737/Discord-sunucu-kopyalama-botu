const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Reklamlı linkleri anında geçer (Yeni API).')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Bypass edilecek link')
                .setRequired(true))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.reply({ content: '⚡ **Bağlantı tünelleniyor...**', ephemeral: true });

        try {
            // bypass.city API'sini kullanıyoruz (Şu an aktif ve stabil)
            const response = await axios.get(`https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`);
            
            if (response.data && response.data.query) {
                const result = response.data.result;

                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Başarılı!')
                    .setColor('#00ff00')
                    .addFields(
                        { name: '🔗 Çözülen Link', value: `\`\`\`${result}\`\`\`` }
                    )
                    .setFooter({ text: 'Sistem Aktif | bypass.city' })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Linke Git')
                            .setURL(result)
                            .setStyle(ButtonStyle.Link)
                    );

                await interaction.editReply({ content: '', embeds: [embed], components: [row] });
            } else {
                throw new Error("Geçersiz yanıt");
            }

        } catch (error) {
            // Eğer bypass.city de hata verirse alternatif (ETH API)
            try {
                const ethRes = await axios.get(`https://eth-api.vercel.app/api/bypass?url=${encodeURIComponent(url)}`);
                const result = ethRes.data.bypassed || ethRes.data.result;

                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Başarılı (Yedek Hat)!')
                    .setColor('#5865F2')
                    .addFields({ name: '🔗 Çözülen Link', value: `\`\`\`${result}\`\`\`` })
                    .setTimestamp();

                await interaction.editReply({ content: '', embeds: [embed] });
            } catch (err) {
                await interaction.editReply({ content: '❌ Maalesef tüm ücretsiz servisler şu an kapalı veya bu linki desteklemiyor.' });
            }
        }
    }
};
