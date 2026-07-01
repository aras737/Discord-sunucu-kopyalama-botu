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
        // Paneli sadece komutu yazanın görmesi için Ephemeral kalabilir, mesajlar herkesin göreceği şekilde atılacak
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');

        // Ekran görüntüsündeki "THE FORCES" kırmızı temalı şık embed tasarımı
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
            .setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000') // Buraya kendi afiş linkini koyabilirsin kanka
            .setFooter({ text: 'Forces • Spam System | Güç Merkezi', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Tam ekran görüntüsündeki o "Başlat!" butonu
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_start_forces_spam')
                .setLabel('🚀 Başlat!')
                .setStyle(ButtonStyle.Danger) // Kırmızı buton rengi
        );

        const response = await interaction.editReply({ embeds: [panelEmbed], components: [row] });

        // Butona basıldığında tetiklenecek mekanizma
        if (!interaction.client.spamButtonListenerSet) {
            interaction.client.on('interactionCreate', async (btnInteraction) => {
                if (!btnInteraction.isButton() || btnInteraction.customId !== 'btn_start_forces_spam') return;

                // Butona basıldığında durumu güncelle
                await btnInteraction.reply({ 
                    content: `⚡ **Forces Spam Sistemi:** \`${miktar}\` adet mesaj hedef alana fırlatılıyor...`, 
                    flags: MessageFlags.Ephemeral 
                });

                const temizMesaj = mesaj.split('').join('\u200b');
                const kanal = btnInteraction.channel;

                if (kanal) {
                    for (let i = 0; i < miktar; i++) {
                        // Kanala mesajları sırayla gönderiyoruz
                        await kanal.send(temizMesaj).catch(() => {});
                        // Tam ekran görüntüsündeki gibi 100ms gecikme uyguluyoruz kanka
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
            });
            // Dinleyicinin mükerrer (üst üste) çalışmasını engellemek için sabitleme
            interaction.client.spamButtonListenerSet = true;
        }
    }
};
