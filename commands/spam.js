const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Belirtilen hedef alanda (Kanal veya DM) gelişmiş mesaj gönderimi sağlar.')
        .addStringOption(o => o.setName('tip')
            .setDescription('Spam yapılacak alanın türü')
            .setRequired(true)
            .addChoices(
                { name: '💬 Belirli Bir Kanal', value: 'kanal' },
                { name: '👤 Kullanıcı Özel Mesaj (DM)', value: 'dm' }
            ))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin içeriği').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Gönderilecek mesaj sayısı (Maksimum 50)').setRequired(true))
        .addUserOption(o => o.setName('hedef_kullanici').setDescription('Eğer DM seçtiyseniz kullanıcıyı seçin').setRequired(false))
        .addChannelOption(o => o.setName('hedef_kanal').setDescription('Eğer Kanal seçtiyseniz kanalı seçin').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const tip = interaction.options.getString('tip');
        const mesaj = interaction.options.getString('mesaj');
        const miktar = Math.min(interaction.options.getInteger('miktar'), 50); // Hız sınırına takılmamak için max 50 limit
        const hedefKullanici = interaction.options.getUser('hedef_kullanici');
        const hedefKanal = interaction.options.getChannel('hedef_kanal');

        // Discord filtrelerini esnetmek için görünmez karakter entegrasyonu
        const temizMesaj = mesaj.split('').join('\u200b');

        try {
            if (tip === 'dm') {
                if (!hedefKullanici) {
                    return await interaction.editReply({ content: '❌ **Hata:** DM modunu seçtiğiniz için bir hedef kullanıcı belirtmelisiniz.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await hedefKullanici.send(temizMesaj).catch(() => {});
                    sendCount++;
                    // Discord hız sınırlarına (Rate Limit) yakalanmamak için kısa bir es (gecikme) veriyoruz
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                return await interaction.editReply({ content: `🚀 **DM Gönderimi Tamamlandı:** ${hedefKullanici.tag} kullanıcısına ${sendCount} adet mesaj başarıyla iletildi.` });
            } 
            
            else if (tip === 'kanal') {
                // Eğer kanal seçilmediyse komutun yazıldığı mevcut kanalı hedef alıyoruz
                const kanal = hedefKanal || interaction.channel;

                if (kanal.type !== ChannelType.GuildText) {
                    return await interaction.editReply({ content: '❌ **Hata:** Seçilen kanal türü mesaj gönderimine uygun bir yazı kanalı değil.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await kanal.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                return await interaction.editReply({ content: `🚀 **Kanal Gönderimi Tamamlandı:** ${kanal.name} kanalına ${sendCount} adet mesaj başarıyla iletildi.` });
            }
        } catch (error) {
            console.error("Gönderim hatası:", error);
            await interaction.editReply({ content: `❌ **Hata:** İşlem gerçekleştirilirken yetki eksikliği veya sistemsel bir kısıtlamaya rastlandı.` });
        }
    }
};
