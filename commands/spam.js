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

        // KANKA ÇÖZÜMÜN İLK ADIMI: Yanıt objesini (response) değişkene alıyoruz
        const response = await interaction.editReply({ embeds: [panelEmbed], components: [row] });

        // KANKA ÇÖZÜMÜN ESAS ADIMI: Collector'ı kanal yerine direkt gönderilen mesaj (response) üzerinden açıyoruz
        const filter = i => i.customId === benzersizId && i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async (btnInteraction) => {
            // "Etkileşim Başarısız Oldu" uyarısını önlemek için önce butonu yanıtlıyoruz
            await btnInteraction.reply({ 
                content: `⚡ **Forces Spam Sistemi:** \`${miktar}\` adet mesaj fırlatılıyor...`, 
                flags: MessageFlags.Ephemeral 
            });

            const temizMesaj = mesaj.split('').join('\u200b');
            
            // Eğer kanal null ise interaction üzerinden kanalı zorla buluyoruz
            const kanal = btnInteraction.channel || await interaction.client.channels.fetch(interaction.channelId).catch(() => null);

            if (kanal) {
                for (let i = 0; i < miktar; i++) {
                    await kanal.send({ content: temizMesaj }).catch(() => {});
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        });

        collector.on('end', async () => {
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
