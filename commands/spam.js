const { SlashCommandBuilder, Routes, InteractionResponseType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Illegal Bypass: Discord bariyerini zorlayarak herkese açık spam atar.')
        .addStringOption(option => option.setName('mesaj').setRequired(true).setDescription('İçerik'))
        .addIntegerOption(option => option.setName('tekrar').setRequired(false).setDescription('Miktar'))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return;

        const icerik = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('tekrar') || 10;

        // --- ILLEGAL ADIM 1: RAW API KULLANIMI ---
        // discord.js'in standart 'reply' fonksiyonu güvenlidir, biz güvenli olmayanı kullanacağız.
        // Mesajı 'ephemeral' (gizli) flag'i OLMADAN (0 yaparak) zorluyoruz.
        
        try {
            // İlk yanıtı 'Düşünüyor' olarak değil, direkt mesaj olarak '0' flagiyle atıyoruz.
            // Bu, bazı sunucu izinlerinde Discord'un 'zorunlu gizle' filtresini atlatabilir.
            await interaction.client.rest.post(
                Routes.interactionCallback(interaction.id, interaction.token),
                {
                    body: {
                        type: 4, // ChannelMessageWithSource
                        data: {
                            content: icerik,
                            flags: 0 // 64 (Ephemeral) DEĞİL, 0 (Public) zorlaması
                        }
                    }
                }
            );

            // --- ILLEGAL ADIM 2: FOLLOWUP ZİNCİRİ ---
            for (let i = 0; i < miktar - 1; i++) {
                await new Promise(r => setTimeout(r, 600));
                
                // Standart followUp yerine yine RAW API ile flag'siz gönderim
                await interaction.client.rest.post(
                    Routes.webhookMessage(interaction.applicationId, interaction.token),
                    {
                        body: {
                            content: icerik,
                            flags: 0 // Zorla herkese açık yap
                        }
                    }
                ).catch(() => {
                    // Eğer Discord 'Yakaladım seni' derse döngüyü kır
                    console.log("Bypass engellendi.");
                });
            }
        } catch (err) {
            console.error("Bypass denemesi başarısız:", err);
            // Eğer RAW API patlarsa normal yolla devam et (en azından sen görürsün)
            await interaction.reply({ content: "⚠️ Global bypass başarısız, normal moda geçildi.", ephemeral: true });
        }
    }
};
