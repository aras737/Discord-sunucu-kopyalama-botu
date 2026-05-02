const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('PlatoBoost, Fluxus ve Linkvertise linklerini geçer.')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Bypass edilecek link')
                .setRequired(true)),

    async execute(interaction) {
        const link = interaction.options.getString('link');
        const endpoint = "http://45.90.13.151:6041"; // Örnekteki API adresi
        const box = "```";

        // Desteklenmeyen link kontrolü
        if (!link.includes("platoboost.com") && !link.includes("flux.li") && !link.includes("linkvertise.com")) {
            return interaction.reply({ content: "❌ Bu link desteklenmiyor! Desteklenenler: PlatoBoost, Fluxus, Linkvertise.", ephemeral: true });
        }

        await interaction.deferReply(); // İşlem uzun sürebilir, Discord'a "bekle" diyoruz

        try {
            const response = await axios.get(`${endpoint}/?url=${encodeURIComponent(link)}`);
            const json = response.data;

            if (json.status === "success") {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Başarılı!')
                    .setColor(0x00ff00)
                    .setTimestamp();

                // API'den gelen veriye göre embed içeriğini doldur
                if (json.key) embed.addFields({ name: 'Anahtar (Key):', value: `${box}${json.key}${box}` });
                if (json.target) embed.addFields({ name: 'Hedef Link:', value: `${json.target}` });
                if (json.time) embed.addFields({ name: 'Süre:', value: `${box}${json.time}${box}`, inline: true });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply({ content: `❌ API Hatası: ${json.message || "Bypass edilemedi."}` });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: "🛑 API şu an çevrimdışı veya yanıt vermiyor." });
        }
    }
};
