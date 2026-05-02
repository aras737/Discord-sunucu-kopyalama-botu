const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Discord-Wide Vulnerability Mode: Mermileri limitleri zorlayarak diz.')
        .addStringOption(o => o.setName('mesaj').setDescription('Saldırı metni').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Mermi sayısı (Max 100)').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const content = interaction.options.getString('mesaj');
        const amount = interaction.options.getInteger('miktar') || 50;

        // 🛡️ ADIM 1: SİSTEMİ KANDIR (Defer)
        // Discord'a "ben şu an yoğunum" diyerek 15 dakikalık bir açık kapı bırakıyoruz.
        await interaction.deferReply({ ephemeral: true });

        console.log(`[TARGET] ${interaction.channelId} kanalına saldırı başladı.`);

        // 🛡️ ADIM 2: WEBHOOK BYPASS DÖNGÜSÜ
        let fired = 0;
        const interval = setInterval(async () => {
            if (fired >= amount) {
                clearInterval(interval);
                await interaction.editReply({ content: '✅ Bombardıman tamamlandı.' });
                return;
            }

            try {
                // Discord'un en hızlı mesaj yolu: Interaction Token ile Post
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: content,
                            flags: 0, // Herkese açık (Public)
                            allowed_mentions: { parse: ['everyone'] } // Etiketleri zorla
                        }
                    }
                );
                fired++;
            } catch (err) {
                if (err.status === 429) {
                    // Hız sınırına takılırsa 1 saniye bekle ve devam et
                    console.log("[!] Discord yavaşla dedi, 1s mola...");
                } else {
                    console.log("[X] Kanal korumalı veya yetki kapalı.");
                    clearInterval(interval);
                }
            }
        }, 650); // 0.65 saniye: Discord'un "güvenli" dediği ama aslında en seri olan hız.
    }
};
