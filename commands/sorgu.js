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
    name: '!sorgu',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        const client = message.client;
        const args = message.content.split(' ').slice(1); // Argümanları burada tanımlıyoruz

        // --- EVENT LISTENER SİSTEMİ ---
        if (!client.sorguListenerSet) {
            client.on('interactionCreate', async (interaction) => {
                // Sadece bu komutla ilgili etkileşimleri işle
                if (interaction.customId === 'user_sorgu_button' || interaction.customId === 'modal_sorgu_system') {
                    await this.handleInteraction(interaction);
                }
            });
            client.sorguListenerSet = true;
        }

        // --- PANEL KOMUDU (!sorgu panel) ---
        if (args[0] === 'panel') {
            if (message.author.id !== OWNER_ID) return;

            const panelEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ 
                    name: '🆔 FORCES ID Sorgu Paneli 🕵️', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('Discord Kullanıcı Sorgulama Sistemi')
                .setDescription(
                    `▫️ **1.** Aşağıdaki **Sorgula** butonuna tıkla.\n` +
                    `▫️ **2.** Açılan alana bir Kullanıcı ID yapıştır.\n` +
                    `▫️ **3.** Sonuçları anında görüntüle.\n\n` +
                    `---\n` +
                    `🛡️ Sorgu sonuçları sadece size özel (ephemeral) olarak gösterilir.`
                )
                .setFooter({ text: '⚡ MADE BY FORCES' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('user_sorgu_button')
                    .setLabel('Sorgula')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔍')
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
            return message.delete().catch(() => {}); 
        }
    },

    async handleInteraction(interaction) {
        // 1. BUTON MANTIĞI
        if (interaction.isButton() && interaction.customId === 'user_sorgu_button') {
            const modal = new ModalBuilder()
                .setCustomId('modal_sorgu_system')
                .setTitle('Kullanıcı Sorgu Paneli');

            const idInput = new TextInputBuilder()
                .setCustomId('sorgu_id_input')
                .setLabel('Sorgulanacak ID')
                .setPlaceholder('Örn: 1389930042200559706')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(17)
                .setMaxLength(20);

            modal.addComponents(new ActionRowBuilder().addComponents(idInput));
            return await interaction.showModal(modal);
        }

        // 2. MODAL MANTIĞI
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_sorgu_system') {
            // "Etkileşim Başarısız" hatasını önlemek için hemen cevap veriyoruz
            await interaction.deferReply({ ephemeral: true });

            const targetId = interaction.fields.getTextInputValue('sorgu_id_input').trim();

            try {
                const user = await interaction.client.users.fetch(targetId);
                const fullUser = await user.fetch(); // Banner için tam veri
                
                const resultEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({ name: `${user.tag} Sorgu Sonucu`, iconURL: user.displayAvatarURL() })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .addFields(
                        { name: '🆔 Kullanıcı ID', value: `\`${user.id}\``, inline: true },
                        { name: '👤 Kullanıcı Adı', value: `\`${user.username}\``, inline: true },
                        { name: '📅 Hesap Kuruluş', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false },
                        { name: '🤖 Durum', value: user.bot ? '✅ Bot Hesabı' : '👤 Gerçek Kullanıcı', inline: true }
                    )
                    .setFooter({ text: `Sorgulayan: ${interaction.user.tag}` })
                    .setTimestamp();

                if (fullUser.banner) {
                    resultEmbed.setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }));
                }

                await interaction.editReply({ embeds: [resultEmbed] });

            } catch (err) {
                await interaction.editReply({ content: '❌ **Hata:** Kullanıcı bulunamadı! Lütfen ID\'nin doğruluğundan emin olun.' });
            }
        }
    }
};
