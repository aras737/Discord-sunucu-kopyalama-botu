const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sadece mesajı dizer.')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Adet').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const content = interaction.options.getString('mesaj');
        const count = interaction.options.getInteger('miktar') || 20;

        // 1. Etkileşimi onayla (Yazmamazlık yapmasın diye)
        await interaction.reply({ content: '...', ephemeral: true });

        // 2. Mermileri tek tek, aralıksız ama güvenli hızda diz
        let sent = 0;
        const interval = setInterval(async () => {
            if (sent >= count) {
                clearInterval(interval);
                return;
            }

            try {
                // En kestirme yol: Raw Rest Post
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    { body: { content: content, flags: 0 } }
                );
                sent++;
            } catch (e) {
                // Hata alırsan durma, devam et (Retry)
                if (e.status !== 429) clearInterval(interval);
            }
        }, 800); // Hız: 0.8 saniye
    }
};
