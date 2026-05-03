const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Linkin yönlendirmelerini analiz eder (reklam atlatmaz).')
        .addStringOption(o =>
            o.setName('link')
             .setDescription('İncelenecek URL')
             .setRequired(true)
        ),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        try {
            const response = await axios.get(url, {
                maxRedirects: 10, // yönlendirmeleri takip et
                validateStatus: null,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const finalUrl = response.request?.res?.responseUrl || url;
            const status = response.status;

            const embed = new EmbedBuilder()
                .setTitle('🔎 Link Analizi')
                .setColor('#00aaff')
                .addFields(
                    { name: '🔗 Girdi URL', value: `\`\`\`${url}\`\`\`` },
                    { name: '🎯 Son URL', value: `\`\`\`${finalUrl}\`\`\`` },
                    { name: '📡 HTTP Status', value: `\`${status}\``, inline: true }
                )
                .setFooter({ text: 'Redirect analyzer (legal use)' });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            await interaction.editReply({
                content: '❌ Link analiz edilemedi. URL hatalı veya site erişimi engelliyor olabilir.'
            });
        }
    }
};
