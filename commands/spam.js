const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ghost Bypass: Orijinal mesajı silerek herkese açık spam atar.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Spam içeriği')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tekrar')
                .setDescription('Miktar')
                .setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('tekrar') || 10;

        // 1. ADIM: Videodaki gibi "Komut gönderiliyor..." yanıtını ver (Gizli başlat)
        await interaction.reply({ content: '⌛ Komut gönderiliyor...', ephemeral: true });

        // 2. ADIM: Orijinal yanıtı siliyoruz
        // Görseldeki (image_13.png) "Orijinal mesaj silinmiş" yazısı tam burada oluşur.
        await interaction.deleteReply().catch(() => {});

        // 3. ADIM: RAW API ile Follow-up Bombardımanı
        // Kütüphaneyi devre dışı bırakıp doğrudan Discord API'sine "flag: 0" (Public) gönderiyoruz.
        for (let i = 0; i < miktar; i++) {
            try {
                await new Promise(r => setTimeout(r, 700)); // Hız sınırı koruması

                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: icerik,
                            flags: 0, // 0 = Herkese Açık (Public) Zorlaması
                            allowed_mentions: { parse: ['users', 'roles', 'everyone'] }
                        }
                    }
                );
            } catch (err) {
                // Eğer kanal tamamen kilitliyse Discord burada durdurur
                break;
            }
        }
    }
};
