const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ghost Bypass: Orijinal yanıtı silerek engel duvarını aşar.')
        .addStringOption(option => option.setName('mesaj').setRequired(true).setDescription('İçerik'))
        .addIntegerOption(option => option.setName('tekrar').setRequired(false).setDescription('Miktar'))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('tekrar') || 10;

        // --- ADIM 1: GİZLİ BAŞLAT ---
        // Önce sessizce bir cevap veriyoruz ki interaction sonlanmasın.
        await interaction.reply({ content: "🛰️ Bypass başlatılıyor...", ephemeral: true });

        // --- ADIM 2: İMHA (Orijinal Yanıtı Sil) ---
        // Görseldeki "Orijinal mesaj silinmiş" yazısının sebebi budur.
        await interaction.deleteReply();

        // --- ADIM 3: HAYALET SALDIRI (Public FollowUp) ---
        // Orijinal cevap silindiği için, bundan sonra atılan followUp'lar 
        // bazı sunucu konfigürasyonlarında herkese açık (public) düşer.
        for (let i = 0; i < miktar; i++) {
            try {
                await new Promise(r => setTimeout(r, 800)); // Hız sınırı (Rate limit)
                
                // RAW API ile followUp gönderiyoruz, flagları tamamen kaldırıyoruz.
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: icerik,
                            flags: 0, // 0 = Herkese Açık
                            allowed_mentions: { parse: ['users', 'roles', 'everyone'] } // Etiketlerin çalışması için
                        }
                    }
                );
            } catch (err) {
                // Eğer Discord "Hoop dur" derse devam et
                console.log("Hız sınırına takıldı, devam ediliyor...");
            }
        }
    }
};
