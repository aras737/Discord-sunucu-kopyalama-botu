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
        const miktar = Math.min(interaction.options.getInteger('miktar'), 50);
        const hedefKullanici = interaction.options.getUser('hedef_kullanici');
        const hedefKanal = interaction.options.getChannel('hedef_kanal');

        // Discord filtrelerine takılmamak için görünmez karakter ayrıştırması
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
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
                
                return await interaction.editReply({ content: `🚀 **DM Gönderimi Tamamlandı:** ${hedefKullanici.tag} kullanıcısına ${sendCount} adet mesaj iletildi.` });
            } 
            
            else if (tip === 'kanal') {
                // KANKA HATANIN ÇÖZÜMÜ BURASI: Önce hedefKanal var mı diye bakıyoruz, yoksa interaction.channel kullanıyoruz
                const kanal = hedefKanal || interaction.channel;

                if (!kanal || (kanal.type !== ChannelType.GuildText && kanal.type !== ChannelType.GuildVoice)) {
                    return await interaction.editReply({ content: '❌ **Hata:** Seçilen alan mesaj gönderimine uygun bir metin kanalı değil.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await kanal.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                return await interaction.editReply({ content: `🚀 **Kanal Gönderimi Tamamlandı:** <#${kanal.id}> kanalına ${sendCount} adet mesaj iletildi.` });
            }
        } catch (error) {
            console.error("Gönderim hatası:", error);
            await interaction.editReply({ content: `❌ **Hata:** İşlem gerçekleştirilirken bir sorun oluştu.` });
        }
    }
};
