const { 
    SlashCommandBuilder, 
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
    data: new SlashCommandBuilder()
        .setName('sorgu')
        .setDescription('FORCES ID Sorgu Panelini açar.'),

    async execute(interaction) {
        // --- 1. VİTRİN PANELİ (Görseldeki Tasarım) ---
        const mainEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ 
                name: '🆔 FORCES ID Sorgu Paneli 🕵️', 
                iconURL: interaction.client.user.displayAvatarURL() 
            })
            .setTitle('Nasıl Kullanılır?')
            .setDescription(
                `▫️ **1.** Aşağıdaki **Sorgula** butonuna tıkla.\n` +
                `▫️ **2.** Açılan alana sorgulamak istediğin Discord ID'yi gir.\n` +
                `▫️ **3.** Sonuçları detaylı embed mesaj olarak alırsın.\n\n` +
                `---\n` +
                `🛡️ Sorgu hem hızlı hem de gizlidir. Tüm analizler veritabanına erişerek yapılır!`
            )
            .setFooter({ text: '⚡ MADE BY FORCES | Discord ID Paneli' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_sorgu_tetik')
                .setLabel('Sorgula')
                .setStyle(ButtonStyle.Success)
        );

        // Paneli gönderiyoruz (Sadece komutu yazana görünür)
        const response = await interaction.reply({ 
            embeds: [mainEmbed], 
            components: [row], 
            ephemeral: true 
        });

        // --- 2. ÇALIŞMA PRENSİBİ (EVENTLER) ---
        // Buton tıklamalarını ve Modal gönderimlerini bu komutun içinden dinliyoruz
        const collector = response.createMessageComponentCollector({ time: 300000 }); // 5 dakika aktif kalır

        collector.on('collect', async i => {
            if (i.customId === 'btn_sorgu_tetik') {
                // MODAL AÇILIŞI
                const modal = new ModalBuilder()
                    .setCustomId('modal_id_sorgu')
                    .setTitle('Kullanıcı Bilgi Sorgu');

                const idInput = new TextInputBuilder()
                    .setCustomId('target_id_input')
                    .setLabel('Discord ID Giriniz')
                    .setPlaceholder('1389930042200559706')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const rowModal = new ActionRowBuilder().addComponents(idInput);
                modal.addComponents(rowModal);

                await i.showModal(modal);
            }
        });

        // Modal gönderildiğinde çalışacak "Interaction" dinleyicisi
        const modalFilter = (mInt) => mInt.type === InteractionType.ModalSubmit && mInt.customId === 'modal_id_sorgu';
        
        interaction.client.on('interactionCreate', async (mInt) => {
            if (!modalFilter(mInt)) return;

            const targetId = mInt.fields.getTextInputValue('target_id_input');

            try {
                // Discord API üzerinden bilgileri şak diye çekiyoruz
                const user = await interaction.client.users.fetch(targetId);
                
                const resultEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setAuthor({ name: `${user.tag} Sorgu Sonucu`, iconURL: user.displayAvatarURL() })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .addFields(
                        { name: '🆔 Kullanıcı ID', value: `\`${user.id}\``, inline: true },
                        { name: '👤 Kullanıcı Adı', value: `${user.username}`, inline: true },
                        { name: '📅 Hesap Kuruluş', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
                        { name: '🤖 Bot mu?', value: user.bot ? 'Evet' : 'Hayır', inline: true }
                    )
                    .setFooter({ text: 'Sorgu Tamamlandı • FORCES DB' })
                    .setTimestamp();

                await mInt.reply({ embeds: [resultEmbed], ephemeral: true });

            } catch (err) {
                if (!mInt.replied) {
                    await mInt.reply({ content: '❌ Geçersiz ID veya kullanıcı bulunamadı!', ephemeral: true });
                }
            }
        });
    },
};
