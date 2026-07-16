const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits,
    MessageFlags 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verify-kur')
        .setDescription('Sunucu için güvenli doğrulama panelini kurar.')
        // KESİN ÇÖZÜM: Sadece YÖNETİCİ (Administrator) yetkisi olanlar görebilir ve kullanabilir
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Komutun sadece sunucu içinde çalışmasını garanti ediyoruz
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ Bu komut sadece sunucu içerisinde kullanılabilir.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const verifyEmbed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🛡️ Sunucu Doğrulama Sistemi')
            .setDescription('Sunucudaki diğer kanallara erişim sağlamak ve topluluğumuza katılmak için aşağıdaki **Doğrula** butonuna tıklayın.')
            .setFooter({ text: `${interaction.guild.name} Güvenlik Sistemi` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel('✅ Doğrula')
                .setStyle(ButtonStyle.Success)
        );

        // Paneli kanala herkesin göreceği şekilde gönderiyoruz
        await interaction.reply({ 
            content: '⚙️ Doğrulama paneli başarıyla kuruldu.', 
            flags: MessageFlags.Ephemeral 
        });
        
        await interaction.channel.send({ embeds: [verifyEmbed], components: [row] });
    }
};
