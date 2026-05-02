const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('En zorlu linkleri kırmak için 5 farklı motoru zorlar.')
        .addStringOption(o => o.setName('link').setDescription('Reklamlı link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        // Agresif API Listesi (En güncel endpointler)
        const engines = [
            { name: 'City Engine', url: `https://api.bypass.city/bypass?url=${encodeURIComponent(url)}` },
            { name: 'VIP Engine', url: `https://dlp.v3.api.bypass.vip/bypass?url=${encodeURIComponent(url)}` },
            { name: 'Vercel Hybrid', url: `https://eth-api.vercel.app/api/bypass?url=${encodeURIComponent(url)}` },
            { name: 'AdBypass Global', url: `https://adbypass.org/api/bypass?url=${encodeURIComponent(url)}` }
        ];

        let finalLink = null;
        let usedEngine = "";

        for (const engine of engines) {
            try {
                const res = await axios.get(engine.url, { timeout: 10000 });
                // API'lerin farklı yanıt formatlarını (result, bypassed, target) kontrol et
                const data = res.data;
                const found = data.result || data.bypassed || data.target || (data.query && data.query.result);
                
                if (found && found !== "fail" && !found.includes("leecher")) {
                    finalLink = found;
                    usedEngine = engine.name;
                    break;
                }
            } catch (e) {
                continue; 
            }
        }

        if (finalLink) {
            const embed = new EmbedBuilder()
                .setTitle('💀 System Cracked!')
                .setColor('#ff0000')
                .setThumbnail('https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJqZ3R4Z3R4Z3R4Z3R4/3o7TKMGpx56S5eN7JC/giphy.gif')
                .addFields(
                    { name: '🔓 Decrypted Link', value: `\`\`\`${finalLink}\`\`\`` },
                    { name: '🛡️ Used Engine', value: `\`${usedEngine}\``, inline: true }
                )
                .setFooter({ text: 'Security measures bypassed by Aras Force-Engine' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } else {
            // Eğer hiçbir API çözemezse, manuel yönlendirme bilgisini döndür
            await interaction.editReply({ 
                content: '❌ **Kritik Hata:** Reklam duvarı tüm global API motorlarını blokladı. Bu link şu an manuel geçiş gerektiriyor veya link patlamış.' 
            });
        }
    }
};
