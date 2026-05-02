const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Global Spam: Herkesin göreceği şekilde mesaj yağdırır.')
        .addStringOption(option => 
            option.setName('mesaj')
                .setDescription('Gönderilecek içerik')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('tekrar')
                .setDescription('Kaç adet gönderilsin?')
                .setRequired(false))
        .setContexts([0, 1, 2]) 
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        let miktar = interaction.options.getInteger('tekrar') || 5;

        // --- DİKKAT: BURASI KRİTİK ---
        // Eğer 'ephemeral: false' bile işe yaramıyorsa, 
        // Discord o kanalda uygulama mesajlarını gizli tutuyor demektir.
        // Ama biz yine de zorlayalım:
        await interaction.reply({ 
            content: icerik, 
            ephemeral: false  // BURAYI ÖZELLİKLE FALSE YAPTIK
        });

        for (let i = 0; i < miktar - 1; i++) {
            try {
                await new Promise(res => setTimeout(res, 800));
                // followUp da varsayılan olarak reply'ın gizlilik ayarını izler
                await interaction.followUp({ 
                    content: icerik, 
                    ephemeral: false 
                });
            } catch (err) {
                break;
            }
        }
    }
};
