const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Forces şık paneli ile her yerde gelişmiş mesaj gönderimi sağlar.')
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin içeriği').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Gönderilecek mesaj sayısı').setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');

        // Benzersiz bir ID üreterek buton verilerinin karışmasını önlüyoruz kanka
        const benzersizId = `forces_${interaction.id}`;

        const panelEmbed = new EmbedBuilder()
            .setColor('#ff0033')
            .setTitle('☄️ Abone Modu Aktif')
            .setDescription('Mesajını sunucu genelinde göndermek için aşağıdaki kırmızı butona tıkla.')
            .addFields(
                { name: '💬 Mesaj Content', value: `\`\`\`text\n${mesaj}\n\`\`\``, inline: false },
                { name: '🔢 Gönderilecek Miktar', value: `\`${miktar} adet\``, inline: true },
                { name: '⚙️ Gönderim Modu', value: '`Abone Ultra`', inline: true },
                { name: '⏱️ Çekirdek Gecikme', value: '`100ms`', inline: true }
            )
            .setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000')
            .setFooter({ text: 'Forces • Spam System | Güç Merkezi', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(benzersizId)
                .setLabel('🚀 Başlat!')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ embeds: [panelEmbed], components: [row] });

        // KANKA KESİN ÇÖZÜM: Buton için özel bir toplayıcı (Collector) oluşturuyoruz, böylece veri asla kaybolmuyor
        const filter = i => i.customId === benzersizId && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (btnInteraction) => {
            // İlk olarak alt yazıyı ekrana veriyoruz (Ekran görüntündeki yer)
            await btnInteraction.reply({ 
                content: `⚡ **Forces Spam Sistemi:** \`${miktar}\` adet mesaj hedef alana fırlatılıyor...`, 
                flags: MessageFlags.Ephemeral 
            });

            // Discord filtrelerini bypass etmek için görünmez karakter
            const temizMesaj = mesaj.split('').join('\u200b');
            const kanal = btnInteraction.channel;

            if (kanal) {
                for (let i = 0; i < miktar; i++) {
                    // Kanala asıl mesajı zorla gönderiyoruz kanka
                    await kanal.send({ content: temizMesaj }).catch((err) => console.log("Mesaj basılamadı:", err));
                    // 100ms çekirdek gecikme
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        });

        collector.on('end', async () => {
            // 1 dakika sonra butonun süresi dolunca pasif yap kanka sunucuyu yormasın
            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(benzersizId)
                    .setLabel('Süre Doldu!')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
