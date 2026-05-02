const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Herkesin gorebilecegi seri mesaj.')
        .addStringOption(o => o.setName('mesaj').setDescription('Icerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Adet').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const msg = interaction.options.getString('mesaj');
        const count = interaction.options.getInteger('miktar') || 20;

        // 1. ADIM: ILK YANITI GIZLI VER (Kirmizi hata cikmasin diye)
        await interaction.reply({ content: 'Saldırı baslatildi kanka...', ephemeral: true });

        // 2. ADIM: ASIL MESAJLARI HERKESE AÇIK GÖNDER
        let i = 0;
        const interval = setInterval(async () => {
            if (i >= count) {
                clearInterval(interval);
                return;
            }

            try {
                // Buradaki 'flags: 0' çok önemli! 
                // Bu sayede "Sadece sen görebilirsin" yazısı kalkar.
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    { 
                        body: { 
                            content: msg, 
                            flags: 0 // 0 = Herkes Görür, 64 = Sadece Sen Görürsün
                        } 
                    }
                );
                i++;
            } catch (err) {
                // Eğer burada hata veriyorsa sunucu User App mesajlarını BLOKLAMIŞTIR.
                console.log("Mesaj gonderilemedi, muhtemelen kanal izni kapali.");
                clearInterval(interval);
            }
        }, 850);
    }
};
