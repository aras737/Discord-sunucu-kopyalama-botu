const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Me-e mantığıyla reklam duvarlarını doğrudan kandırır.')
        .addStringOption(o => o.setName('link').setDescription('Reklamlı link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        try {
            // İncelediğim repo'daki mantığı kullanan en agresif endpoint
            const res = await axios.get(`https://eth-api.vercel.app/api/bypass?url=${encodeURIComponent(url)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://linkvertise.com/'
                },
                timeout: 15000
            });

            const data = res.data;
            const result = data.result || data.bypassed || data.target;

            if (result) {
                const embed = new EmbedBuilder()
                    .setTitle('🔓 Me-e Engine: Cracked!')
                    .setColor('#00ffcc')
                    .addFields(
                        { name: '🔗 Result', value: `\`\`\`${result}\`\`\`` },
                        { name: '⚡ Method', value: '`Direct API Manipulation`', inline: true }
                    )
                    .setFooter({ text: 'Powered by Me-e Logic' });

                await interaction.editReply({ embeds: [embed] });
            } else {
                throw new Error("Link Çözülemedi");
            }

        } catch (error) {
            await interaction.editReply({ 
                content: '❌ **Bypass Başarısız:** Reklam duvarı bu yöntemi blokladı. Başka bir link dene kanka.' 
            });
        }
    }
};
