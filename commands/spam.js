const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Mesaj yağmuru panelini açar.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🚀 Aethelgard Spam Sistemi')
            .setDescription(
                `**Ufak bilgilendirme:** Discord’daki her sunucuda olur. Bu, bize yazanları korumaya alıyoruz. Sunucusunu korumak isteyenlerde sadece olmaz; haberiniz olsun. Koruma olanlarda olmaz. Onun dışında hepsi porna ve “bilinmeyen entegrasyon hatası” alırsanız sayfayı yenileyin, düzelir.\n\n` +
                `+ olarak Sunucularınızı korumak istiyorsanız <#1439518145714061413> açın karşılıksız 2 saniyede korumayı aktif ediyoruz\n\n` +
                `-- **Atılan spamlardan biz sorumlu değiliz!**`
            )
            .addFields(
                { name: '🔹 /mesajat-forces', value: 'Ana sunucuda abone rolüne sahip kişiler kullanabilir.', inline: false },
                { name: '⚡ /mesajat-hızlı', value: '1x boost basanlar içindir.', inline: false },
                { name: '🔥 /mesajat-aşırı-hızlı', value: '5x boost basanlar içindir.', inline: false }
            )
            .setFooter({ text: 'Aethelgard Protection & Raid System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('spam_modal_ac')
                .setLabel('Saldırıyı Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
};
