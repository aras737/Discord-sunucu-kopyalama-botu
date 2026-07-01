const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Filtresiz ve sınırsız şekilde her yerde spam gönderimi sağlar.')
        .addStringOption(o => o.setName('tip')
            .setDescription('Spam yapılacak alanın türü')
            .setRequired(true)
            .addChoices(
                { name: '💬 Sunucu İçi (Kanal / Her Yer)', value: 'kanal' },
                { name: '👤 Kullanıcı Özel Mesaj (DM)', value: 'dm' }
            ))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin içeriği').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Gönderilecek mesaj sayısı').setRequired(true))
        .addUserOption(o => o.setName('hedef_kullanici').setDescription('DM modu için kullanıcı seçin').setRequired(false))
        .addChannelOption(o => o.setName('hedef_kanal').setDescription('Belirli bir kanal seçin (Boş bırakılırsa mevcut kanal)').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const tip = interaction.options.getString('tip');
        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');
        const hedefKullanici = interaction.options.getUser('hedef_kullanici');
        const hedefKanal = interaction.options.getChannel('hedef_kanal');

        // Görünmez karakter entegrasyonu
        const temizMesaj = mesaj.split('').join('\u200b');

        try {
            if (tip === 'dm') {
                if (!hedefKullanici) {
                    return await interaction.editReply({ content: '❌ **Hata:** DM modunu seçtiğiniz için bir hedef kullanıcı belirtmelisiniz kanka.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await hedefKullanici.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                return await interaction.editReply({ content: `🚀 **DM Gönderimi Tamamlandı:** ${hedefKullanici.tag} alanına ${sendCount} adet mesaj iletildi.` });
            } 
            
            else if (tip === 'kanal') {
                // Kanal belirtilmediyse komutun tetiklendiği alanı (ne olursa olsun) hedef alıyoruz
                const kanal = hedefKanal || interaction.channel;

                if (!kanal) {
                    return await interaction.editReply({ content: '❌ **Hata:** Gönderim yapılacak geçerli bir alan saptanamadı.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    // Türü ne olursa olsun (metin, ses, duyuru vb.) doğrudan mesajı gönderiyoruz
                    await kanal.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                return await interaction.editReply({ content: `🚀 **Gönderim Tamamlandı:** Hedef alana ${sendCount} adet mesaj iletildi.` });
            }
        } catch (error) {
            console.error("Gönderim hatası:", error);
            await interaction.editReply({ content: `❌ **Hata:** İşlem gerçekleştirilirken bir sorun oluştu.` });
        }
    }
};
