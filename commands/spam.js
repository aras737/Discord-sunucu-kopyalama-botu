const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Merubokkusu Burst: Repodaki hız limitlerini zorlar.')
        .addStringOption(o => o.setName('mesaj').setDescription('Spam metni').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Mermi sayısı (Max 100)').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        // --- GÜVENLİK KONTROLÜ ---
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const content = interaction.options.getString('mesaj');
        const amount = Math.min(interaction.options.getInteger('miktar') || 30, 100);

        // --- ADIM 1: ANINDA YANIT (Etkileşim Başarısız Hatasını Siler) ---
        // Merubokkusu sessiz çalışır, biz de sessizce başlıyoruz.
        await interaction.reply({ content: '🧨 **Fünye çekildi, mermiler diziliyor...**', ephemeral: true });

        // --- ADIM 2: ASYNC MERUBOKKUSU LOOP ---
        const startSpam = async () => {
            for (let i = 0; i < amount; i++) {
                try {
                    // Merubokkusu'nun en stabil hızı: 0.75 saniye
                    // Bu hızda Discord genelde 'User App' spamini fark etmez.
                    await new Promise(r => setTimeout(r, 750));

                    await interaction.client.rest.post(
                        Routes.webhookMessage(interaction.applicationId, interaction.token),
                        {
                            body: {
                                content: content,
                                flags: 0, // Herkese açık (Public) zorlaması
                                allowed_mentions: { parse: ['everyone', 'users', 'roles'] }
                            }
                        }
                    );

                    if ((i + 1) % 5 === 0) console.log(`[FIRE] ${i + 1} mesaj başarıyla gönderildi.`);

                } catch (err) {
                    if (err.status === 429) {
                        // Rate limit yedik, mermiyi geri koy ve bekle
                        const retryAfter = (err.retry_after * 1000) || 3000;
                        console.log(`[WAIT] Hız sınırı: ${retryAfter/1000}s bekleniyor...`);
                        await new Promise(r => setTimeout(r, retryAfter));
                        i--; 
                    } else {
                        console.log(`[ERROR] Kritik hata: ${err.message}`);
                        break;
                    }
                }
            }
        };

        // Arka planda başlat
        startSpam();
    }
};
