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
    async execute(message, args) {
        const OWNER_ID = "1389930042200559706"; // Senin ID'n
        const client = message.client;

        // --- SELF-EXECUTING EVENT LISTENER (YÖNLENDİRMEYİ İÇİNE GÖMDÜK) ---
        // Bu kısım sayesinde buton ve modal işlemleri index.js'den bağımsız burada döner.
        if (!client.sorguListenerSet) {
            client.on('interactionCreate', async (interaction) => {
                await this.handleInteraction(interaction);
            });
            client.sorguListenerSet = true; // Eventin birden fazla kez tanımlanmasını engeller
        }

        // --- PANEL KURULUMU: Sadece sen '!sorgu panel' yazınca çalışır ---
        if (args[0] === 'panel') {
            if (message.author.id !== OWNER_ID) return;

            const panelEmbed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setAuthor({ 
                    name: '🆔 FORCES ID Sorgu Paneli 🕵️', 
                    iconURL: client.user.displayAvatarURL() 
                })
                .setTitle('Discord kullanıcı ID’si ile veri sorgulamak için en kolay yol!')
                .setDescription(
                    `▫️ **1.** Aşağıdaki **Sorgula** butonuna tıkla.\n` +
                    `▫️ **2.** Açılan alana sorgulamak istediğin Discord ID'yi gir (örn: 123456789012345678).\n` +
                    `▫️ **3.** Sonuçları sadece sana özel, detaylı embed mesaj olarak alırsın.\n\n` +
                    `---\n` +
                    `🛡️ Sorgu hem hızlı hem de gizlidir. Tüm analizler veritabanına erişerek yapılır!`
                )
                .setImage('https://i.imgur.com/kSly8Z6.png') // Berk Forces Banner
                .setFooter({ text: '⚡ MADE BY FORCES | Discord ID Paneli' });

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

    // --- ETKİLEŞİM YÖNETİCİSİ (Buton ve Modal İşlemleri) ---
    async handleInteraction(interaction) {
        
        // 1. BUTONA BASILDIĞINDA (MODAL AÇILIŞI)
        if (interaction.isButton() && interaction.customId === 'user_sorgu_button') {
            const modal = new ModalBuilder()
                .setCustomId('modal_sorgu_system')
                .setTitle('Kullanıcı Sorgu Paneli');

            const idInput = new TextInputBuilder()
                .setCustomId('sorgu_id_input')
                .setLabel('Sorgulanacak ID')
                .setPlaceholder('Buraya bir ID yapıştır...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(15)
                .setMaxLength(21);

            modal.addComponents(new ActionRowBuilder().addComponents(idInput));
            return await interaction.showModal(modal).catch(() => {});
        }

        // 2. MODAL GÖNDERİLDİĞİNDE (BİLGİLERİ DÖKME)
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_sorgu_system') {
            
            // "Etkileşim Başarısız" hatasını önlemek için deferReply
            await interaction.deferReply({ ephemeral: true });

            const targetId = interaction.fields.getTextInputValue('sorgu_id_input');

            try {
                const user = await interaction.client.users.fetch(targetId);
                
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
                    .setFooter({ text: `Sorgulayan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                // Kullanıcının banner'ını çekmek için tam veriyi al
                const fullUser = await user.fetch();
                if (fullUser.banner) {
                    resultEmbed.setImage(fullUser.bannerURL({ dynamic: true, size: 1024 }));
                }

                await interaction.editReply({ embeds: [resultEmbed] });

            } catch (err) {
                await interaction.editReply({ content: '❌ **Hata:** Geçersiz bir ID girdiniz veya kullanıcı bulunamadı!' });
            }
        }
    }
};
