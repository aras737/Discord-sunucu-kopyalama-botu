const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spamm')
        .setDescription('Kullanıcı Uygulaması: Her yerde spam atmanızı sağlar.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek içerik')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tekrar')
                .setDescription('Kaç adet gönderilsin? (Max: 20)')
                .setRequired(false))
        // --- KRİTİK AYARLAR ---
        // 0: Guild, 1: DM, 2: Grup/Dış Sunucu (Botun olmadığı yerler)
        .setContexts([0, 1, 2]) 
        // 0: Guild Install, 1: User Install (Hesabına yükleme)
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        // Sadece senin ID'n (FORCES Sahibi)
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: "❌ Bu özel yetenek sadece sahibime aittir.", ephemeral: true });
        }

        const icerik = interaction.options.getString('mesaj');
        let miktar = interaction.options.getInteger('tekrar') || 5;
        if (miktar > 20) miktar = 20; // Botun ban yememesi için limit

        // İlk mesaj (Görseldeki gibi Uygulama yanıtı)
        await interaction.reply({ content: icerik });

        // Döngü ile alt alta dizme
        for (let i = 0; i < miktar - 1; i++) {
            try {
                // Discord Rate Limit koruması için kısa bekleme
                await new Promise(res => setTimeout(res, 700));
                await interaction.followUp({ content: icerik });
            } catch (err) {
                break; // Kanal kilitliyse dur
            }
        }
    }
};
