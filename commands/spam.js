const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('DiscordPinger v2: Klasik seri spam modu.')
        .addStringOption(o => o.setName('mesaj').setDescription('Spam metni').setRequired(true))
        .addIntegerOption(o => o.setName('hiz').setDescription('Hız (ms) - Örn: 800').setRequired(false))
        .addIntegerOption(o => o.setName('miktar').setDescription('Kaç adet atılsın?').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const msg = interaction.options.getString('mesaj');
        const intervalTime = interaction.options.getInteger('hiz') || 850; // Klasik hız
        const count = interaction.options.getInteger('miktar') || 30;

        // 1. ADIM: Discord'u sustur (Hata almamak için hemen yanıt ver)
        await interaction.reply({ 
            content: `🧨 **Pinger Aktif!**\n🚀 Hız: ${intervalTime}ms\n📦 Miktar: ${count}`, 
            ephemeral: true 
        });

        let current = 0;

        // 2. ADIM: DiscordPinger'ın Klasik Döngüsü (setInterval)
        const pinger = setInterval(async () => {
            if (current >= count) {
                clearInterval(pinger);
                console.log("[BİTTİ] Spam operasyonu tamamlandı.");
                return;
            }

            try {
                // User App'lerin en sağlam mermi atma yolu (Webhook Post)
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: msg,
                            flags: 0 // Herkese açık (Public) zorlaması
                        }
                    }
                );
                current++;
            } catch (err) {
                if (err.status === 429) {
                    // Rate limit yedik, durma ama bekle
                    console.log(`[!] Hız sınırı! ${err.retry_after}s bekleniyor...`);
                } else {
                    // Kritik bir hata (Yetki vb.) varsa döngüyü durdur
                    console.log(`[HATA] Mesaj atılamadı: ${err.message}`);
                    clearInterval(pinger);
                }
            }
        }, intervalTime);
    }
};
