const { SlashCommandBuilder, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Gelişmiş modüllerle donatılmış, her yerde çalışabilen spam komutu.')
        .addStringOption(o => o.setName('tip')
            .setDescription('Spam yapılacak hedef alan')
            .setRequired(true)
            .addChoices(
                { name: '💬 Mevcut Kanal (Buraya At)', value: 'kanal' },
                { name: '👤 Kullanıcı Özel Mesaj (DM)', value: 'dm' },
                { name: '🔥 Sunucudaki TÜM Kanallar (Mass)', value: 'tum_kanallar' }
            ))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin içeriği').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Gönderilecek mesaj sayısı').setRequired(true))
        .addUserOption(o => o.setName('hedef_kullanici').setDescription('DM modu için kullanıcı seçin').setRequired(false))
        .addChannelOption(o => o.setName('hedef_kanal').setDescription('Belirli bir kanal seçin (Boş bırakılırsa mevcut kanal)').setRequired(false)),

    async execute(interaction) {
        // Herkesin görmesini istemiyorsan Ephemeral açık kalabilir kanka
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const tip = interaction.options.getString('tip');
        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');
        const hedefKullanici = interaction.options.getUser('hedef_kullanici');
        const hedefKanal = interaction.options.getChannel('hedef_kanal');

        // Discord filtrelerini (Anti-Spam) atlatmak için görünmez karakter ayrıştırması
        const temizMesaj = mesaj.split('').join('\u200b');

        try {
            // 1. MOD: ÖZEL MESAJ (DM) SPAM
            if (tip === 'dm') {
                if (!hedefKullanici) {
                    return await interaction.editReply({ content: '❌ **Hata:** DM modunu seçtiğiniz için bir hedef kullanıcı belirtmelisiniz kanka.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await hedefKullanici.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 250)); // Hız limiti ayarı
                }
                return await interaction.editReply({ content: `🚀 **DM Gönderimi Tamamlandı:** ${hedefKullanici.tag} alanına ${sendCount} adet mesaj iletildi.` });
            } 
            
            // 2. MOD: TEK BİR KANAL SPAM
            else if (tip === 'kanal') {
                const kanal = hedefKanal || interaction.channel;
                if (!kanal) {
                    return await interaction.editReply({ content: '❌ **Hata:** Gönderim yapılacak geçerli bir alan bulunamadı.' });
                }

                let sendCount = 0;
                for (let i = 0; i < miktar; i++) {
                    await kanal.send(temizMesaj).catch(() => {});
                    sendCount++;
                    await new Promise(resolve => setTimeout(resolve, 250));
                }
                return await interaction.editReply({ content: `🚀 **Gönderim Tamamlandı:** Hedef kanala ${sendCount} adet mesaj iletildi.` });
            }

            // 3. MOD: İNCELEDİĞİMİZ PROJEDEKİ GİBİ TÜM KANALLARA AYNI ANDA (MASS) SPAM
            else if (tip === 'tum_kanallar') {
                if (!interaction.guild) {
                    return await interaction.editReply({ content: '❌ **Hata:** Bu modu sadece bir sunucu içerisinde kullanabilirsiniz.' });
                }

                // Sunucudaki botun görebildiği ve mesaj yazabileceği tüm metin/ses kanallarını filtreliyoruz
                const validChannels = interaction.guild.channels.cache.filter(c => 
                    c.type === ChannelType.GuildText || 
                    c.type === ChannelType.GuildVoice || 
                    c.type === ChannelType.GuildAnnouncement
                );

                if (validChannels.size === 0) {
                    return await interaction.editReply({ content: '❌ **Hata:** Mesaj gönderilebilecek uygun bir kanal bulunamadı.' });
                }

                await interaction.editReply({ content: `⏳ **Zen Mass Engine:** Sunucudaki \`${validChannels.size}\` farklı kanala eşzamanlı gönderim başlatılıyor...` });

                // Her kanala belirlenen miktar kadar mesajı asenkron havuzda gönderiyoruz
                for (let i = 0; i < miktar; i++) {
                    const promises = validChannels.map(kanal => kanal.send(temizMesaj).catch(() => {}));
                    await Promise.all(promises);
                    await new Promise(resolve => setTimeout(resolve, 350)); // Sunucudan ban yememek için güvenli es
                }

                return await interaction.editReply({ content: `🔥 **Mass Spam Tamamlandı:** Sunucudaki \`${validChannels.size}\` kanalın her birine toplam \`${miktar}\` adet mesaj başarıyla fırlatıldı!` });
            }

        } catch (error) {
            console.error("Sistem hatası:", error);
            await interaction.editReply({ content: `❌ **Hata:** İşlem gerçekleştirilirken teknik bir sorun oluştu.` });
        }
    }
};
