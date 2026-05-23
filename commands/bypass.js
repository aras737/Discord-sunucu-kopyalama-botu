const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    EmbedBuilder,
    InteractionType
} = require('discord.js');
const axios = require('axios');

const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Delta ve PlatoRelay linklerini yakalanmadan, anında kırar.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 5 * 1000; // Bekleme süresini 5 saniyeye çektim kanka

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ 
                    content: `❌ | Lütfen tekrar denemeden önce ${timeLeft.toFixed(1)} saniye bekleyin.`, 
                    ephemeral: true 
                });
            }
        }

        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    // 1. AŞAMA: Butona basıldığı an senin yükleme emojin dönecek
                    await int.deferReply({ ephemeral: true });
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen Bypass: Sistem bypass merkezine bağlanıyor...**` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    try {
                        // 2. AŞAMA: Durumu güncelle
                        await int.editReply({ 
                            content: `<a:loading:1507818079776935966> **Zen Bypass: Reklam duvarları aşılıyor, anahtar sökülüyor...**` 
                        });

                        // Orijinal bypass sistemlerinin kullandığı, asla yakalanmayan merkezi API entegrasyonu
                        const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                        
                        let finalKey = "Anahtar bulunamadı.";
                        if (response.data && response.data.result) {
                            finalKey = response.data.result;
                        } else if (response.data && response.data.key) {
                            finalKey = response.data.key;
                        }

                        // 3. AŞAMA: İşlem başarılı olduğunda emoji kalkar ve şık embed yapıştırılır
                        const embed = new EmbedBuilder()
                            .setTitle('🔓 Zen Bypass: Başarıyla Kırıldı!')
                            .setColor('#00ffb3')
                            .addFields(
                                { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${finalKey}\`\`\`` },
                                { name: '🔗 Hedef Bağlantı', value: `[Linke Git](${url})` }
                            )
                            .setFooter({ text: 'Zen Engine • Yakalanmayan Bypass Sistemi' })
                            .setTimestamp();

                        await int.editReply({ content: null, embeds: [embed] });

                    } catch (error) {
                        // Eğer üstteki API yanıt vermezse, yedek (B planı) stabil çalışan API devreye girer:
                        try {
                            const backupRes = await axios.get(`https://bypass.bot-asistant.workers.dev/?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                            const backupKey = backupRes.data.key || backupRes.data.result || "Key çözülemedi.";

                            const embed = new EmbedBuilder()
                                .setTitle('🔓 Zen Bypass: Başarıyla Kırıldı (Yedek Hat)')
                                .setColor('#ffaa00')
                                .addFields(
                                    { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${backupKey}\`\`\`` },
                                    { name: '🔗 Hedef Bağlantı', value: `[Linke Git](${url})` }
                                )
                                .setFooter({ text: 'Zen Engine • Yedek Tünel Aktif' })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [embed] });

                        } catch (backupError) {
                            console.error(backupError);
                            await int.editReply({ 
                                content: '❌ **Bypass Başarısız:** Tüm bypass sunucuları şu an yoğun veya link geçersiz kanka.' 
                            });
                        }
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        // FORM OLUŞTURMA VE KULLANICIYA FIRLATMA
        const modal = new ModalBuilder()
            .setCustomId('bypassModal')
            .setTitle('Zen Ultra Bypass');

        const urlInput = new TextInputBuilder()
            .setCustomId('urlInput')
            .setLabel("Bypass edilecek URL'yi girin")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://auth.platorelay.com/...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(urlInput);
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    },
};
