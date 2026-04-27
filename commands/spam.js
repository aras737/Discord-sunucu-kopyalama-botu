const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType 
} = require('discord.js');

module.exports = {
    name: '!spam',
    async execute(message) {
        const client = message.client;

        // --- AKILLI DİNLEYİCİ: INDEX'E GEREK KALMADAN ÇALIŞIR ---
        if (!client.spamBotEventSet) {
            client.on('interactionCreate', async (interaction) => {
                // Sadece bu komutun buton ve modallarına cevap ver
                if (interaction.customId === 'btn_spam_go' || interaction.customId === 'modal_spam_go') {
                    await this.handleInteraction(interaction);
                }
            });
            client.spamBotEventSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'Aethelgard Sunucu Kopyalayıcı', iconURL: client.user.displayAvatarURL() })
            .setTitle('🚀 Aethelgard Spam Sistemi')
            .setDescription(
                `**Ufak bilgilendirme:** Discord’daki her sunucuda olur. Bu, bize yazanları korumaya alıyoruz. Sunucusunu korumak isteyenlerde sadece olmaz; haberiniz olsun.\n\n` +
                `“Bilinmeyen entegrasyon hatası” alırsanız sayfayı yenileyin, düzelir.\n\n` +
                `**-- Atılan spamlardan biz sorumlu değiliz!**`
            )
            .addFields(
                { name: '🔹 Operasyon Modu', value: 'Bot yetkisiyle tüm kanallara erişim.', inline: false },
                { name: '⚡ Hız', value: 'Limitlere takılmadan seri gönderim.', inline: false }
            )
            .setFooter({ text: 'Aethelgard Protection & Raid System' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_spam_go')
                .setLabel('Saldırıyı Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('☣️')
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    // --- ETKİLEŞİM YÖNETİMİ ---
    async handleInteraction(interaction) {
        // BUTON BASILDIĞINDA
        if (interaction.isButton() && interaction.customId === 'btn_spam_go') {
            const modal = new ModalBuilder()
                .setCustomId('modal_spam_go')
                .setTitle('Operasyon Başlatılıyor');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('msg')
                        .setLabel('Spam Mesajı')
                        .setPlaceholder('Ne yazılsın?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('count')
                        .setLabel('Kaç Tane Atılsın?')
                        .setPlaceholder('Örn: 20')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );
            return await interaction.showModal(modal).catch(() => {});
        }

        // MODAL GÖNDERİLDİĞİNDE
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_spam_go') {
            // O KIRMIZI HATAYI ÖNLEYEN DEFERREPLY
            await interaction.deferReply({ ephemeral: true });

            const sMsg = interaction.fields.getTextInputValue('msg');
            const sCount = parseInt(interaction.fields.getTextInputValue('count')) || 10;

            const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());
            
            await interaction.editReply({ 
                content: `✅ **Operasyon Başladı!** ${channels.size} kanala dalıyorum.` 
            });

            // Botun kendi üzerinden (Self değil) mesaj atma döngüsü
            channels.forEach(async (chan) => {
                for (let i = 0; i < sCount; i++) {
                    try {
                        await chan.send(sMsg);
                        await new Promise(r => setTimeout(r, 200)); // Hız ayarı
                    } catch (err) {
                        break; // Yetki yoksa diğer kanala geç
                    }
                }
            });
        }
    }
};
