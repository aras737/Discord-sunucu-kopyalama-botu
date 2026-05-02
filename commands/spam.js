const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('DiscordPinger Bypass: Mermileri tek tek dizmeye başlar.')
        .addStringOption(o => o.setName('mesaj').setDescription('Spam içeriği').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Miktar').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        // Güvenlik: Sadece sen
        if (interaction.user.id !== "1389930042200559706") return;

        const content = interaction.options.getString('mesaj');
        const amount = interaction.options.getInteger('miktar') || 25;

        // 1. ADIM: Discord'u Onayla (Kırmızı ünlemi engelle)
        await interaction.reply({ content: '🌑 **Phantom Pinger Start...**', ephemeral: true });

        // 2. ADIM: Mermileri Diz (Interval Bypass)
        let count = 0;
        const interval = setInterval(async () => {
            if (count >= amount) {
                clearInterval(interval);
                return;
            }

            try {
                // KÜTÜPHANEYİ ATLA, HAM API'YE MERMİ SIK
                // Bu yöntem, 'interaction.followUp' kilitlerini kırar.
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: content,
                            flags: 0, // Herkese açık (Public) zorlaması
                            username: ".gg/base64", // Görseldeki isim
                            avatar_url: interaction.client.user.displayAvatarURL()
                        }
                    }
                );
                count++;
            } catch (err) {
                // Eğer 403 veriyorsa sunucuda User App yasaktır.
                // Eğer 429 veriyorsa hız sınırıdır, durma devam et.
                if (err.status !== 429) {
                    console.log(`[!] Hata: ${err.status} - ${err.message}`);
                    clearInterval(interval);
                }
            }
        }, 850); // 0.8 saniye (DiscordPinger ideal hızı)
    }
};
