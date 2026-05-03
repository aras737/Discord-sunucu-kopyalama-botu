const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Linkteki parametreleri analiz eder.')
        .addStringOption(o =>
            o.setName('link')
             .setDescription('URL')
             .setRequired(true)
        ),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        try {
            const res = await axios.get(url, {
                maxRedirects: 10,
                timeout: 10000,
                validateStatus: null
            });

            const finalUrl = res.request?.res?.responseUrl || url;

            const parsed = new URL(finalUrl);
            const params = [...parsed.searchParams.entries()];

            let paramText = params.length
                ? params.map(([k, v]) => `**${k}** = \`${v}\``).join('\n')
                : 'Parametre yok';

            const embed = new EmbedBuilder()
                .setTitle('🔍 URL Analiz')
                .setColor('#00ffaa')
                .addFields(
                    { name: '🎯 Final URL', value: `\`\`\`${finalUrl}\`\`\`` },
                    { name: '🔑 Parametreler', value: paramText }
                );

            await interaction.editReply({ embeds: [embed] });

        } catch (e) {
            await interaction.editReply({
                content: '❌ URL çözülemedi.'
            });
        }
    }
};
