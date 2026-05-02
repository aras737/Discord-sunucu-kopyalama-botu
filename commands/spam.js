const { SlashCommandBuilder, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Phantom Component Bypass: Görseldeki gibi mermileri dizer.')
        .addStringOption(o => o.setName('mesaj').setDescription('İçerik').setRequired(true))
        .addIntegerOption(o => o.setName('miktar').setDescription('Mermi sayısı').setRequired(false))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const content = interaction.options.getString('mesaj');
        const amount = interaction.options.getInteger('miktar') || 20;

        // --- ADIM 1: GÖRSELDEKİ O "KOMUTU GÖR" BUTONUNU OLUŞTUR ---
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('phantom_check')
                    .setLabel('Komutu görmek için dokun')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📝')
            );

        // İlk yanıtı veriyoruz (Görseldeki en üstteki yapı)
        await interaction.reply({ 
            content: `**${interaction.user.username}, \`/spam\` kullandı.**`, 
            components: [row],
            ephemeral: false // ZORLAMA: Herkese açık olması için
        }).catch(async () => {
            // Eğer sunucu public mesajı engelliyorsa gizli başla ama bypass'a devam et
            await interaction.reply({ content: '🌑 Phantom Initializing...', ephemeral: true });
        });

        // --- ADIM 2: RAW API İLE FOLLOWER BOMBALAMASI ---
        // Görseldeki (image_22.png) o alt alta dizilen temiz mesajları oluşturur.
        for (let i = 0; i < amount; i++) {
            try {
                // Rastgele gecikme: Discord'un "spam" algısını bozmak için
                const jitter = Math.floor(Math.random() * 200) + 700;
                await new Promise(r => setTimeout(r, jitter));

                // Kütüphaneyi devre dışı bırakıp ham v10 API isteği atıyoruz
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: content,
                            flags: 0, // 0 = HERKESE AÇIK (PUBLIC) ZORLAMASI
                            allowed_mentions: { parse: ['everyone', 'users', 'roles'] }
                        }
                    }
                );
            } catch (err) {
                if (err.status === 429) {
                    await new Promise(r => setTimeout(r, err.retry_after * 1000));
                    i--;
                } else break;
            }
        }
    }
};
