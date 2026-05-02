const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Yaz artık lan!')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Adet').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const content = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar') || 20;

        // 1. ANINDA ONAY (Bunu yapmazsak Discord 'fail' verir)
        await interaction.deferReply({ ephemeral: true });

        // 2. MERMİ DÖNGÜSÜ
        for (let i = 0; i < miktar; i++) {
            try {
                // interaction.followUp kullanarak 'Webhook' bariyerini zorla
                await interaction.followUp({ 
                    content: content, 
                    ephemeral: false // ZORLAMA: Herkes görsün
                });

                // Discord'un bizi engellememesi için kısa bir mola
                await new Promise(r => setTimeout(r, 900));
            } catch (err) {
                // Hata alırsak bile durma, mermiyi tekrar namluya sür
                console.log("Mermi takıldı, tekrar deneniyor...");
                i--; 
            }
        }
        
        // İşlem bittiğinde gizli bir onay ver
        await interaction.editReply({ content: '✅ Operasyon bitti.' });
    }
};
