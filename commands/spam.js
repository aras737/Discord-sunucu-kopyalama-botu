const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // Slash komutu tanımlaması
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Woodhook Mesaj Yağmuru (1 saniye gecikmeli)')
        .addStringOption(opt => 
            opt.setName('mesaj')
                .setDescription('Gönderilecek mesaj içeriği')
                .setRequired(true))
        .addIntegerOption(opt => 
            opt.setName('miktar')
                .setDescription('Toplam kaç adet gönderilsin?')
                .setRequired(true)),

    async execute(interaction) {
        // Sadece senin ID'n kullanabilsin
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: "❌ Bu komutu kullanmaya yetkiniz yok!", ephemeral: true });
        }

        const msg = interaction.options.getString('mesaj');
        const count = interaction.options.getInteger('miktar');

        // Kullanıcıya işlemin başladığını gizli mesajla bildir
        await interaction.reply({ content: `🚀 **${count}** adet mesaj gönderimi başlatıldı.`, ephemeral: true });

        // Spam döngüsü
        for (let i = 0; i < count; i++) {
            try {
                await interaction.channel.send(msg);
                // Woodhook tarzı 1 saniye bekleme (Rate limit yememek için)
                await new Promise(r => setTimeout(r, 1000)); 
            } catch (error) {
                console.error("Mesaj gönderilemedi:", error);
                break; // Hata durumunda döngüyü durdur
            }
        }
    }
};
