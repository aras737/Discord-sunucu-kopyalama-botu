const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Reklam duvarlarını yıkan hibrit motor.')
        .addStringOption(o => o.setName('link').setDescription('Reklamlı link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        // Denenecek API'ler (Sırasıyla)
        const apis = [
            `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}`,
            `https://eth-api.vercel.app/api/bypass?url=${encodeURIComponent(url)}`,
            `https://dlp.v3.api.bypass.vip/bypass?url=${encodeURIComponent(url)}`
        ];

        let result = null;
        let success = false;

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 8000 });
                if (res.data && (res.data.result || res.data.bypassed)) {
                    result = res.data.result || res.data.bypassed;
                    success = true;
                    break; // Bir tanesi çalıştıysa döngüden çık
                }
            } catch (e) {
                continue; // Hata verirse bir sonrakini dene
            }
        }

        if (success) {
            const embed = new EmbedBuilder()
                .setTitle('💀 Bypass Successful! | Agresif Mode')
                .setColor('#ff4747')
                .addFields(
                    { name: '💻 PC Result', value: `\`\`\`${result}\`\`\`` },
                    { name: '📱 Mobile Result', value: `\`\`\`${result}\`\`\`` }
                )
                .setFooter({ text: 'Powered by Aras Bypass Engine' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel('Linke Git').setURL(result).setStyle(ButtonStyle.Link)
            );

            await interaction.editReply({ content: '', embeds: [embed], components: [row] });
        } else {
            await interaction.editReply({ content: '❌ **Bütün motorlar denendi ama link kırılamadı.** Reklam duvarı çok güncel olabilir.' });
        }
    }
};
