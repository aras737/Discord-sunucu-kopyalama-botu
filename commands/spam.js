const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Kullanıcı Uygulaması: Herkesin göreceği şekilde spam atar.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek içerik')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tekrar')
                .setDescription('Kaç adet gönderilsin? (Max: 30)')
                .setRequired(false))
        // --- KRİTİK: GLOBAL ERİŞİM AYARLARI ---
        .setContexts([0, 1, 2]) // Sunucu, DM ve Gruplar
        .setIntegrationTypes([0, 1]), // Sunucu ve Kullanıcı Yüklemesi

    async execute(interaction) {
        // Sadece senin ID'n çalıştırabilir
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            // Hata mesajı sadece sana görünür (ephemeral: true)
            return interaction.reply({ content: "❌ Bu güç sadece sahibime aittir.", ephemeral: true });
        }

        const icerik = interaction.options.getString('mesaj');
        let miktar = interaction.options.getInteger('tekrar') || 5;
        if (miktar > 30) miktar = 30; 

        // İLK MESAJ: Herkes görecek şekilde yanıt verir
        // (ephemeral ayarı olmadığı için varsayılan olarak herkese açıktır)
        await interaction.reply({ content: icerik });

        // DİĞER MESAJLAR: followUp ile alt alta dizilir
        for (let i = 0; i < miktar - 1; i++) {
            try {
                await new Promise(res => setTimeout(res, 700)); // Hız sınırı koruması
                await interaction.followUp({ content: icerik });
            } catch (err) {
                break; // Yetki çekilirse veya kanal kilitlenirse durur
            }
        }
    }
};
