const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // Slash Komutu Tanımlama
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Woodhook Style: Kanala mesaj yağmuru başlatır.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek metin')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Gönderilecek mesaj sayısı')
                .setRequired(true)),

    async execute(interaction) {
        // --- GÜVENLİK KONTROLÜ ---
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '❌ **Erişim Engellendi:** Bu komut sadece proje sahibine özeldir.', 
                ephemeral: true 
            });
        }

        const text = interaction.options.getString('mesaj');
        const count = interaction.options.getInteger('miktar');

        // Kullanıcıya bilgi ver (Sadece sen görürsün)
        await interaction.reply({ 
            content: `🚀 **İşlem Başladı:** "${text}" mesajı ${count} kez gönderiliyor...`, 
            ephemeral: true 
            });

        // --- SPAM DÖNGÜSÜ ---
        for (let i = 0; i < count; i++) {
            try {
                // Kanalda mesajı gönder
                await interaction.channel.send(text);

                // --- 1 SANİYE GECİKME (WOODHOOK STANDARTI) ---
                // Bu kısım botun Discord tarafından banlanmasını veya rate-limit yemesini engeller.
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                // Eğer kanal silinirse veya yetki alınırsa döngüyü durdur
                console.error("Spam durduruldu veya bir hata oluştu:", error.message);
                break;
            }
        }
    },
};
