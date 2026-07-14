const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Kullanıcıya özelden (DM) seri mesaj gönderir.')
        .addUserOption(o => o.setName('hedef').setDescription('Mesaj yağmuruna tutulacak kişi').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Kaç adet gönderilsin?').setRequired(true)),

    async execute(interaction) {
        // 1. ADIM: Discord'un 3 saniye sınırını deferReply ile aşıyoruz.
        // Bu sayede "Bilinmeyen Etkileşim" hatası almazsın.
        await interaction.deferReply({ ephemeral: true });

        const hedef = interaction.options.getUser('hedef');
        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');

        // Filtreleri delmek için harf aralarına görünmez karakter ekliyoruz
        const ghostMesaj = mesaj.split('').join('\u200b');
        let sayac = 0;

        try {
            for (let i = 0; i < miktar; i++) {
                // Mesaj gönderimi
                await hedef.send(ghostMesaj);
                sayac++;

                // Rate limit (ban) yememek için 1 saniye bekleme
                await new Promise(r => setTimeout(r, 1000));
            }

            // 2. ADIM: İşlem bitince yanıtı güncelliyoruz
            await interaction.editReply({ 
                content: `✅ **İşlem Tamam:** ${hedef.tag} kişisine ${sayac} mesaj başarıyla iletildi.` 
            });

        } catch (error) {
            // "İzinler Eksik" hatasını burada yakalıyoruz
            await interaction.editReply({ 
                content: `❌ **Hata:** Mesaj gönderilemedi. (DM kapalı olabilir veya Discord bloklamış olabilir).` 
            });
        }
    }
};
