const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Belirlediğiniz kullanıcıya özelden mesaj yağdırır.')
        .addUserOption(o => o.setName('hedef').setDescription('Spam atılacak kullanıcı').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Kaç adet gönderilsin?').setRequired(true)),

    async execute(interaction) {
        const hedef = interaction.options.getUser('hedef');
        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');

        // İlk yanıtı verelim ki Discord "cevap vermedi" demesin
        await interaction.reply({ content: `🚀 ${hedef.tag} kullanıcısına ${miktar} adet mesaj gönderimi başlıyor...`, ephemeral: true });

        let gönderilen = 0;

        for (let i = 0; i < miktar; i++) {
            try {
                // Mesajı özelden (DM) gönder
                await hedef.send(mesaj);
                gönderilen++;

                // Discord'un seni hemen banlamaması için her mesaj arasına 1 saniye boşluk koyuyoruz.
                // Eğer "illegal" olsun dersen bu süreyi 500ms yapabilirsin ama risk artar.
                await new Promise(r => setTimeout(r, 1000)); 

            } catch (error) {
                console.error(`${hedef.tag} kullanıcısına DM gönderilemedi:`, error.message);
                // Eğer DM kapalıysa veya ban yediysen döngüyü kır
                break;
            }
        }

        // İşlem bittiğinde bildirim gönder
        await interaction.followUp({ content: `✅ Spam tamamlandı! Başarıyla gönderilen: ${gönderilen}/${miktar}`, ephemeral: true });
    }
};
