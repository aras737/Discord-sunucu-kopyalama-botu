const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yam')
        .setDescription('Hedef kullanıcıya mesaj yağmuru başlatır.')
        .addUserOption(o => o.setName('hedef').setDescription('Kime yazılacak?').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Ne yazılacak?').setRequired(true))
        .addIntegerOption(o => o.setName('adet').setDescription('Kaç kere yazılacak?').setRequired(true)),

    async execute(interaction) {
        const hedef = interaction.options.getUser('hedef');
        const mesaj = interaction.options.getString('mesaj');
        const adet = interaction.options.getInteger('adet');

        // Ghost Mode: Filtreleri delmek için her harf arasına görünmez boşluk ekle
        const bypassMesaj = mesaj.split('').join('\u200b');

        await interaction.reply({ 
            content: `🔥 **Yam yazma işlemi başladı:** ${hedef.tag} hedefine ${adet} mesaj gönderiliyor...`, 
            ephemeral: true 
        });

        for (let i = 0; i < adet; i++) {
            try {
                // Mesajı gönder
                await hedef.send(bypassMesaj);
                
                // Hız Ayarı (Kritik): 
                // Discord seni "Robot" diye banlamasın diye araya 0.8 saniye koydum.
                // Eğer çok risk almak istersen 500 yapabilirsin.
                await new Promise(r => setTimeout(r, 800)); 
            } catch (err) {
                console.error("Mesaj gönderilemedi:", err.message);
                break; // Hata (DM kapalıysa vb.) döngüden çık
            }
        }

        await interaction.followUp({ 
            content: `✅ **İşlem Tamam:** ${hedef.tag} kullanıcısına yam yazma bitti.`, 
            ephemeral: true 
        });
    }
};
