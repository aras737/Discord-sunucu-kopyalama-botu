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
    name: '!sorgu', // Mesaj komutu
    async execute(message, args) {
        const OWNER_ID = "1389930042200559706"; // Senin ID'n

        // --- SADECE SENİN KULLANABİLECEĞİN PANEL KURMA KISMI ---
        if (args[0] === 'panel') {
            if (message.author.id !== OWNER_ID) {
                return message.reply("❌ Bu paneli sadece bot sahibi kurabilir.");
            }

            const panelEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ 
                    name: '🆔 FORCES ID Sorgu Paneli 🕵️', 
                    iconURL: message.client.user.displayAvatarURL() 
                })
                .setTitle('Nasıl Kullanılır?')
                .setDescription(
                    `▫️ **1.** Aşağıdaki **Sorgula** butonuna tıkla.\n` +
                    `▫️ **2.** Açılan alana sorgulamak istediğin Discord ID'yi gir.\n` +
                    `▫️ **3.** Sonuçları detaylı embed mesaj olarak alırsın.\n\n` +
                    `---\n` +
                    `🛡️ Sorgu sistemi aktiftir. Tüm analizler veritabanına erişerek yapılır!`
                )
                .setFooter({ text: '⚡ MADE BY FORCES | Discord ID Paneli' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('user_sorgu_button')
                    .setLabel('Sorgula')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔍')
            );

            await message.channel.send({ embeds: [panelEmbed], components: [row] });
            return message.delete(); // Atılan !sorgu panel mesajını siler, temiz durur.
        }

        // --- EVENTLER (HERKES İÇİN ÇALIŞAN KISIM) ---
        // Not: Index.js'deki akıllı sistem interactionCreate'i buraya yönlendirecek.
    },

    // Buton ve Modal etkileşimlerini yöneten asıl fonksiyon
    async handleInteraction(interaction) {
        // 1. BUTONA BASILDIĞINDA (MODAL AÇILIŞI)
        if (interaction.isButton() && interaction.customId === 'user_sorgu_button') {
            const modal = new ModalBuilder()
                .setCustomId('modal_sorgu_system')
                .setTitle('Kullanıcı Sorgu Paneli');

            const idInput = new TextInputBuilder()
                .setCustomId('sorgu_id_input')
                .setLabel('Sorgulanacak ID')
                .setPlaceholder('Örn: 1389930042200559706')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(idInput));
            return await interaction.showModal(modal);
        }

        // 2. MODAL GÖNDERİLDİĞİNDE (SONUÇLAR)
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_sorgu_system') {
            const targetId = interaction.fields.getTextInputValue('sorgu_id_input');

            try {
                const user = await interaction.client.users.fetch(targetId);
                
                const resultEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({ name: `${user.tag} Sorgu Sonucu`, iconURL: user.displayAvatarURL() })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .addFields(
                        { name: '🆔 Kullanıcı ID', value: `\`${user.id}\``, inline: true },
                        { name: '👤 Kullanıcı Adı', value: `${user.username}`, inline: true },
                        { name: '📅 Hesap Kuruluş', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
                        { name: '🤖 Durum', value: user.bot ? 'Bot Hesabı' : 'Gerçek Kullanıcı', inline: true }
                    )
                    .setFooter({ text: 'Sorgulayan: ' + interaction.user.tag })
                    .setTimestamp();

                await interaction.reply({ embeds: [resultEmbed], ephemeral: true });

            } catch (err) {
                await interaction.reply({ content: '❌ Geçersiz ID veya kullanıcı bulunamadı!', ephemeral: true });
            }
        }
    }
};
