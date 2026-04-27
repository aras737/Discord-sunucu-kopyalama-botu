const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucu analizini başlatır.'),

    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`: discord.gg/base64`)
                .addFields({ name: 'mesaj:', value: '7272' });

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('baslat_buton')
                        .setLabel('.gg/json')
                        .setStyle(ButtonStyle.Danger),
                );

            const response = await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });

            // Buton tıklamasını dinleyen kısım
            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 600000 // 10 dakika aktif kalır
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'baslat_buton') {
                    await i.reply({ content: '✅ İşlem başladı, kanallar taranıyor...', ephemeral: true });

                    const channels = i.guild.channels.cache.filter(c => c.type === 0);

                    for (const [id, channel] of channels) {
                        try {
                            // Görseldeki efekt: Yazıyor... -> Mesaj At -> Sil
                            await channel.sendTyping();
                            const msg = await channel.send('10');
                            
                            // 1 saniye sonra sil (Orijinal mesaj silindi yazısı için)
                            setTimeout(() => msg.delete().catch(() => {}), 1000);

                            // İnsan hızı: Her kanal arası 2 saniye bekle
                            await new Promise(res => setTimeout(res, 2000));
                        } catch (e) {
                            continue; // Yetki yoksa diğer kanala geç
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Komut hatası:", err);
        }
    },
};
