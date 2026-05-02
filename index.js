const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Eski klasik seri mermi modu.')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Adet').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const msg = interaction.options.getString('mesaj');
        const count = interaction.options.getInteger('miktar') || 25;

        // 1. ADIM: Discord'un 'Etkileşim Başarısız' uyarısını engellemek için sessiz bir yanıt.
        await interaction.reply({ content: '..', ephemeral: true });

        // 2. ADIM: KLASİK DÖNGÜ (Mermileri herkesin göreceği şekilde fırlatır)
        let i = 0;
        const pinger = setInterval(async () => {
            if (i >= count) {
                clearInterval(pinger);
                return;
            }

            try {
                // En klasik ve bypass odaklı gönderim: flags: 0 (HERKES GÖRÜR)
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: msg,
                            flags: 0 // Burası 0 olmalı ki image_16.png'deki gibi gizli kalmasın!
                        }
                    }
                );
                i++;
            } catch (err) {
                // Hata verirse (sunucu koruması vb.) döngüyü kesme, devam etmeyi dene
                if (err.status !== 429) {
                    console.log("Kanal korumasına çarpıldı, mola veriliyor...");
                }
            }
        }, 800); // Klasik 0.8 saniye hızı
    }
};
