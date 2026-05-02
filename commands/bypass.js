const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Reklamlı linkleri saniyeler içinde geçer.')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Bypass edilecek link (Linkvertise vb.)')
                .setRequired(true))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.reply({ content: '🔍 **Bypass işlemi başlatıldı...**', ephemeral: true });

        try {
            // --- API 1 (Bypass.vip) ---
            let response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`).catch(() => null);
            
            // --- API 2 (Yedek: Adlinkfly Bypass) ---
            if (!response || !response.data || response.data.status !== "success") {
                response = await axios.get(`https://adbypass.org/api/bypass?url=${encodeURIComponent(url)}`).catch(() => null);
            }

            if (response && response.data && (response.data.status === "success" || response.data.bypassed_url)) {
                const result = response.data.result || response.data.bypassed_url;

                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass successful! 🎧')
                    .setColor('#f04747') // Fotoğraftaki o kırmızı/turuncu ton
                    .addFields(
                        { name: '⌨️ Copy PC', value: `\`\`\`${result}\`\`\`` },
                        { name: '🤖 Copy Mobile', value: `\`\`\`${result}\`\`\`` }
                    )
                    .setFooter({ text: `Time taken: ${response.data.time || '2.45'}s` })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('copy_pc_btn')
                            .setLabel('Copy PC')
                            .setEmoji('💻')
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId('copy_mobile_btn')
                            .setLabel('Copy Mobile')
                            .setEmoji('📱')
                            .setStyle(ButtonStyle.Secondary)
                    );

                const serverRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Join our Server')
                            .setEmoji('🔗')
                            .setURL('https://discord.gg/senin-linkin')
                            .setStyle(ButtonStyle.Link)
                    );

                await interaction.editReply({ 
                    content: '', 
                    embeds: [embed], 
                    components: [row, serverRow] 
                });
            } else {
                await interaction.editReply({ 
                    content: '❌ **HATA:** Link geçilemedi. Link hatalı olabilir veya tüm servisler şu an meşgul. Lütfen biraz sonra tekrar dene.' 
                });
            }

        } catch (error) {
            console.error("Bypass Genel Hata:", error.message);
            await interaction.editReply({ content: '🛑 **Sistemsel Hata:** API sunucularına bağlanılamıyor.' });
        }
    }
};
