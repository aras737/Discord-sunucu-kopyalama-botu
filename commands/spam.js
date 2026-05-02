const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Hata Tespit Modu: Discord bizi nereden engelliyor bulacağız.')
        .addStringOption(o => o.setName('mesaj').setDescription('Test metni').setRequired(true))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        // Sadece sen kullanabilirsin
        if (interaction.user.id !== "1389930042200559706") return;

        console.log("--- TEST BAŞLADI ---");
        
        // 1. Yanıt verip Interaction'ı hayatta tutuyoruz
        await interaction.reply({ content: '🔍 Teşhis yapılıyor, Render loglarına bak...', ephemeral: true });

        // 2. Ham API'yi zorluyoruz
        try {
            console.log("[1] API'ye istek gönderiliyor...");
            await interaction.client.rest.post(
                Routes.webhookMessage(interaction.applicationId, interaction.token),
                {
                    body: {
                        content: interaction.options.getString('mesaj'),
                        flags: 0 // Herkese açık yapmaya zorluyoruz
                    }
                }
            );
            console.log("[BAŞARILI] Mesaj gönderildi! Demek ki engel yokmuş.");
        } catch (error) {
            console.log("-----------------------------------------");
            console.log("!!! DISCORD BİZİ ENGELLEDİ !!!");
            console.log("Hata Kodu (Status):", error.status);
            console.log("Hata Sebebi (Message):", error.message);
            console.log("-----------------------------------------");
        }
    }
};
