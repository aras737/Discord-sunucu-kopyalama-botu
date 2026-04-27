const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'spam',
    description: 'Spam sistemini başlatır (Bölge Korumalı).',
    // User Install ve Context ayarları (Profil üzerinden kullanım için)
    integration_types: [0, 1],
    contexts: [0, 1, 2],
    options: [
        {
            name: 'mesaj',
            description: 'Gönderilecek metin',
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: 'miktar',
            description: 'Kaç adet gönderilecek?',
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 100
        }
    ],

    run: async (client, interaction) => {
        const OWNER_ID = "1389930042200559706"; // Senin ID'n
        const { guild, user, channel, options } = interaction;
        
        const mesaj = options.getString('mesaj');
        const miktar = options.getInteger('miktar');

        // 🛡️ BÖLGE KORUMASI MANTIĞI
        if (guild && user.id !== OWNER_ID) {
            // Sahibin sunucuda olup olmadığını kontrol et
            const isOwnerHere = await guild.members.fetch(OWNER_ID).catch(() => null);

            if (isOwnerHere) {
                return interaction.reply({ 
                    content: "❌ **Erişim Engellendi:** Bu bölge sahibim tarafından korunuyor. Burada sadece o emir verebilir!", 
                    ephemeral: true 
                });
            }
        }

        // Komutu kullanan sensen veya sahibin olmadığı bir yerse devam et
        await interaction.reply({ 
            content: `⚡ **İşlem Başlatıldı:** ${miktar} mesaj gönderiliyor...`, 
            ephemeral: true 
        });

        // SPAM DÖNGÜSÜ
        for (let i = 0; i < miktar; i++) {
            try {
                await channel.send(mesaj);
                // Rate limit yememek için 600ms bekleme
                await new Promise(resolve => setTimeout(resolve, 600)); 
            } catch (err) {
                console.log("Mesaj gönderimi kesildi:", err.message);
                break; // Yetki yoksa veya kanal kapandıysa dur
            }
        }
    }
};
