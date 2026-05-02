const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ölümsüz Mod: Ne olursa olsun o mermiler kanala düşecek.')
        .addStringOption(o => o.setName('mesaj').setDescription('Saldırı metni').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Mermi sayısı').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar') || 25;

        // Base64 şifre çözücü (Dahili, Render patlatmaz)
        const botName = Buffer.from("LkdnL2Jhc2U2NA==", 'base64').toString('utf-8');

        // --- ADIM 1: MUTLAK GÜVENLİ YANIT (Kırmızı Ünlemi Engeller) ---
        // 'Etkileşim başarısız oldu' hatası 3 saniye kuralından çıkar. 
        // Bunu önlemek için hemen en güvenli (ephemeral) yanıtı dönüyoruz.
        try {
            await interaction.reply({ 
                content: '🌑 **Sistem deliniyor, mermiler namluda...**', 
                ephemeral: true 
            });
        } catch (error) {
            console.log("[HATA] İlk yanıt engellendi ama spam devam edecek!");
            // Yanıt veremezsek bile kodu durdurmuyoruz!
        }

        // --- ADIM 2: İZLERİ SİL (Orijinal Mesaj Silindi Etkisi) ---
        setTimeout(async () => {
            try { await interaction.deleteReply(); } catch (e) { /* Zaten silinmişse veya yoksa yoksay */ }
        }, 1200);

        // --- ADIM 3: RAW BOMBARDIMAN (Arka Planda Asla Durmaz) ---
        const fire = async () => {
            console.log(`[FORCES] ${miktar} mermilik saldırı başlatıldı.`);
            
            for (let i = 0; i < miktar; i++) {
                try {
                    // Discord kütüphanesini bypass eden HAM (Raw) istek
                    await interaction.client.rest.post(
                        Routes.webhookMessage(interaction.applicationId, interaction.token),
                        {
                            body: {
                                content: mesaj,
                                username: botName, // .gg/base64
                                flags: 0, // KRİTİK: Mesajı zorla HERKESE AÇIK (Public) yapar
                                allowed_mentions: { parse: ['everyone', 'users', 'roles'] }
                            }
                        }
                    );

                    // Mermiler arası güvenli bekleme (Anti-Spam koruması)
                    await new Promise(r => setTimeout(r, 800));

                } catch (err) {
                    if (err.status === 429) {
                        // Rate Limit (Hız Sınırı) yersek kodu çökertmeden bekleriz
                        const bekle = (err.retry_after * 1000) || 2000;
                        console.log(`[!] Hız sınırı, ${bekle/1000} saniye bekleniyor...`);
                        await new Promise(r => setTimeout(r, bekle));
                        i--; // Atılamayan mermiyi tekrar namluya sür
                    } else if (err.status === 404 || err.status === 403) {
                        // Yetki tamamen kesildiyse (Token öldüyse) dur
                        console.log("[X] Discord bağlantıyı kesti, işlem durduruldu.");
                        break;
                    } else {
                        // Başka bir bilinmeyen hata olursa devam et
                        continue;
                    }
                }
            }
            console.log("[FORCES] Operasyon tamamlandı.");
        };

        // Arka planda asenkron olarak başlat ki Interaction kilitlenmesin
        fire();
    }
};
