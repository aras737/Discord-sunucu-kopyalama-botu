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
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Sadece Yöneticiler kullanabilir

    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ 
                content: '❌ Bu komut sadece sunucu içerisinde kullanılabilir.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Şık bir doğrulama embed tasarımı
        const verifyEmbed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🛡️ Sunucu Doğrulama Sistemi')
            .setDescription('Sunucudaki diğer kanallara erişim sağlamak ve topluluğumuza katılmak için aşağıdaki **Doğrula** butonuna tıklayın.')
            .setFooter({ text: `${interaction.guild.name} Güvenlik Sistemi`, iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        // Tıklanacak buton
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('forces_verify_btn')
                .setLabel('✅ Doğrula')
                .setStyle(ButtonStyle.Success)
        );

        // Komutu yazana gizli bildirim yolluyoruz, kanala embed fırlatıyoruz
        await interaction.reply({ 
            content: '⚙️ Doğrulama paneli başarıyla oluşturuldu.', 
            flags: MessageFlags.Ephemeral 
        });
        
        await interaction.channel.send({ embeds: [verifyEmbed], components: [row] });
    }
};
