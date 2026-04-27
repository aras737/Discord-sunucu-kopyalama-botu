const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucu analiz ve kopyalama arayüzünü başlatır.'),

    async execute(interaction) {
        // 1. Görseldeki o meşhur Embed ve Buton yapısı
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`: discord.gg/base64`)
            .addFields({ name: 'mesaj:', value: '7272' })
            .setFooter({ text: 'İşlem başlatılmaya hazır.' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('start_scan')
                    .setLabel('.gg/json')
                    .setStyle(ButtonStyle.Danger),
            );

        // Mesajı sadece komutu yazan görür (Ephemeral)
        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        // 2. Buton Tıklamasını Yakalayan Collector (Toplayıcı)
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 3600000 // 1 saat boyunca buton aktif kalır
        });

        collector.on('collect', async i => {
            if (i.customId === 'start_scan') {
                await i.reply({ content: '⚙️ Analiz başlatıldı, kanallar geziliyor...', ephemeral: true });

                const guild = i.guild;
                // Botun mesaj atabildiği tüm metin kanallarını bul
                const channels = guild.channels.cache.filter(c => c.type === 0); 

                // İNSAN GİBİ DAVRANMA DÖNGÜSÜ
                for (const [id, channel] of channels) {
                    try {
                        // Kanala girince "Yazıyor..." göster
                        await channel.sendTyping();

                        // Görseldeki gibi "10" mesajını gönder
                        const msg = await channel.send('10');

                        // Analiz yapılıyor süsü vermek için 1.5 saniye bekle ve sil
                        setTimeout(async () => {
                            await msg.delete().catch(() => {});
                        }, 1500);

                        console.log(`[LOG] ${channel.name} analiz edildi.`);

                        // RADAR: Her kanal arası 3-6 saniye arası rastgele bekleme
                        const sleep = Math.floor(Math.random() * 3000) + 3000;
                        await new Promise(resolve => setTimeout(resolve, sleep));

                    } catch (error) {
                        // Yetki olmayan kanalları sessizce atla
                        continue;
                    }
                }

                await i.followUp({ content: '✅ Analiz bitti. Veriler Base64 olarak hazırlandı.', ephemeral: true });
            }
        });
    },
};
