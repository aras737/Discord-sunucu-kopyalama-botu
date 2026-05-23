const { 
    SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ActionRowBuilder, EmbedBuilder, InteractionType 
} = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Delta ve PlatoRelay linklerini yakalanmadan hızlıca kırar.'),

    async execute(interaction) {
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    await int.deferReply({ ephemeral: true });
                    // Tam istediğin loading emojisi devreye giriyor kanka
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen Bypass: Güvenli tünel açılıyor, reklamlar manipüle ediliyor...**` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    try {
                        // Orijinal Zen altyapısının kullandığı stabil API'ye bağlanıyoruz
                        const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                        const finalKey = response.data.result || response.data.key || "Anahtar sökülemedi kanka.";

                        const embed = new EmbedBuilder()
                            .setTitle('🔓 Zen Bypass: Başarıyla Kırıldı!')
                            .setColor('#00ffb3')
                            .addFields(
                                { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${finalKey}\`\`\`` },
                                { name: '🔗 Hedef Bağlantı', value: `[Linke Git](${url})` }
                            )
                            .setFooter({ text: 'Zen Engine • Sorunsuz Bypass' })
                            .setTimestamp();

                        // İşlem bitince yükleme yazısı tamamen kalkar ve embed basılır
                        await int.editReply({ content: null, embeds: [embed] });

                    } catch (error) {
                        // Ana hat meşgulse yedek tünel devreye girer
                        try {
                            const backupRes = await axios.get(`https://bypass.bot-asistant.workers.dev/?url=${encodeURIComponent(url)}`, { timeout: 12000 });
                            const backupKey = backupRes.data.key || backupRes.data.result || "Key çözülemedi.";

                            const embed = new EmbedBuilder()
                                .setTitle('🔓 Zen Bypass: Başarıyla Kırıldı (Yedek Tünel)')
                                .setColor('#ffaa00')
                                .addFields(
                                    { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${backupKey}\`\`\`` },
                                    { name: '🔗 Hedef Bağlantı', value: `[Linke Git](${url})` }
                                )
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [embed] });
                        } catch (err) {
                            await int.editReply({ content: '❌ **Bypass Başarısız:** Sunucular şu an yanıt vermiyor, daha sonra tekrar dene kanka.' });
                        }
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        const modal = new ModalBuilder().setCustomId('bypassModal').setTitle('Zen Ultra Bypass');
        const urlInput = new TextInputBuilder().setCustomId('urlInput').setLabel("Bypass edilecek URL'yi girin").setStyle(TextInputStyle.Short).setPlaceholder('https://auth.platorelay.com/...').setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        await interaction.showModal(modal);
    }
};
