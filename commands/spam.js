const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Belirtilen kanala veya mevcut kanala mesaj yağmuru başlatır.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek mesaj')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('miktar')
                .setDescription('Kaç adet gönderilecek (Max: 100)')
                .setRequired(true))
        .addChannelOption(option => 
            option.setName('kanal')
                .setDescription('Spam yapılacak kanal (Seçilmezse mevcut kanal)')
                .setRequired(false)),

    async execute(interaction) {
        // Sadece senin (Bot sahibi) kullanabilmen için kontrol
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '❌ Bu komutu sadece bot sahibi kullanabilir!', ephemeral: true });
        }

        const messageContent = interaction.options.getString('mesaj');
        const amount = interaction.options.getInteger('miktar');
        const targetChannel = interaction.options.getChannel('kanal') || interaction.channel;

        // Limiti aşmasın diye ufak bir önlem
        const finalAmount = amount > 100 ? 100 : amount;

        await interaction.reply({ content: `🚀 **${targetChannel.name}** kanalında ${finalAmount} adet spam başlatılıyor...`, ephemeral: true });

        for (let i = 0; i < finalAmount; i++) {
            try {
                await targetChannel.send(messageContent);
                // Discord rate limitine takılmamak için her mesaj arası 1 saniye (1000ms)
                await new Promise(r => setTimeout(r, 1000)); 
            } catch (error) {
                console.error("Spam hatası:", error);
                break; // Hata alırsak döngüyü kır
            }
        }
    },
};
