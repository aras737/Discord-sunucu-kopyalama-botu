const { SlashCommandBuilder, Routes } = require('discord.js');

// --- DAHİLİ MOTOR (Hata Almamak İçin) ---
const GhostMod = {
    decode: (str) => Buffer.from(str, 'base64').toString('utf-8')
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Ghost Bypass: Herkese açık spam mermilerini dizer.')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Mermi sayısı').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const ADMIN_ID = "1389930042200559706";
        if (interaction.user.id !== ADMIN_ID) return;

        const content = interaction.options.getString('mesaj');
        const amount = interaction.options.getInteger('miktar') || 25;
        
        // Görseldeki bot ismi: .gg/base64
        const botName = GhostMod.decode("LkdnL2Jhc2U2NA==");

        // 1. ADIM: SESSİZ BAŞLAT (Videodaki gibi)
        await interaction.reply({ content: '🌑 **Phantom Bypass Aktif...**', ephemeral: true });

        // 2. ADIM: İMHA (Orijinal mesaj silindi yazısı için)
        setTimeout(async () => {
            try { await interaction.deleteReply(); } catch (e) {}
        }, 1100);

        // 3. ADIM: BOMBARDIMAN (Raw API v10)
        // Discord.js'in ephemeral kilidini kırmak için rest.post kullanıyoruz.
        for (let i = 0; i < amount; i++) {
            try {
                const jitter = Math.floor(Math.random() * 200) + 600;
                await new Promise(r => setTimeout(r, jitter));

                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: content,
                            username: botName,
                            avatar_url: interaction.client.user.displayAvatarURL(),
                            flags: 0, // ZORLA PUBLIC (HERKESE AÇIK)
                            allowed_mentions: { parse: ['everyone', 'users', 'roles'] }
                        }
                    }
                );
            } catch (err) {
                if (err.status === 429) {
                    await new Promise(r => setTimeout(r, err.retry_after * 1000));
                    i--; // Tekrar dene
                } else break;
            }
        }
    }
};
