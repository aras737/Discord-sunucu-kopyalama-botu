const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, WebhookClient } = require('discord.js');

const activeSpams = new Map();

module.exports = {
    name: '!spam',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const args = message.content.split(' ').slice(1);
        const spamMesajı = args.join(' ');

        if (!spamMesajı) return message.reply("⚠️ Kullanım: `!spam [mesaj]`");

        // Önceki spamı temizle
        if (activeSpams.has(message.channel.id)) {
            clearInterval(activeSpams.get(message.channel.id));
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🕵️ Hayalet Spam (Webhook) Başladı')
            .setDescription(`**Mesaj:** ${spamMesajı}\n**Yöntem:** Webhook (Banlanamaz)`)
            .setFooter({ text: 'Durdurmak için butona bas.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('stop_webhook_spam').setLabel('Sistemi Kapat').setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });

        // --- WEBHOOK OLUŞTURMA VE BASMA ---
        const startSpam = async () => {
            try {
                // Kanalda bir webhook oluştur (veya var olanı kullan)
                const webhook = await message.channel.createWebhook({
                    name: 'Ghost Bot', // Buraya rastgele isimler de ekleyebilirsin
                    avatar: 'https://i.imgur.com/8nLFC9S.png',
                });

                const interval = setInterval(async () => {
                    await webhook.send({
                        content: `@everyone ${spamMesajı}`,
                        username: `User-${Math.floor(Math.random() * 9999)}`, // Sürekli değişen isim
                    }).catch(async () => {
                        // Eğer webhook silinirse döngüyü kır ve yeni webhook aç
                        clearInterval(interval);
                        startSpam(); 
                    });
                }, 800); // 0.8 saniye hız

                activeSpams.set(message.channel.id, interval);
            } catch (e) {
                message.author.send("❌ Webhook oluşturma yetkim yok kanka!").catch(() => {});
            }
        };

        startSpam();

        // --- DURDURMA BUTONU ---
        const collector = message.channel.createMessageComponentCollector({ 
            filter: i => i.customId === 'stop_webhook_spam' && i.user.id === OWNER_ID 
        });

        collector.on('collect', async i => {
            clearInterval(activeSpams.get(message.channel.id));
            activeSpams.delete(message.channel.id);
            await i.update({ content: '✅ Hayalet Spam durduruldu.', embeds: [], components: [] });
            collector.stop();
        });
    }
};
