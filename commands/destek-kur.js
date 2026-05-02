const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField, 
    ChannelType,
    StringSelectMenuBuilder
} = require('discord.js');

module.exports = {
    requiredPerms: [PermissionsBitField.Flags.Administrator],

    data: new SlashCommandBuilder()
        .setName('destek-kur')
        .setDescription('TSA Gelişmiş Destek Sistemini kurar.')
        .addStringOption(option => 
            option.setName('yetkili-roller')
                .setDescription('Yetkili rolleri etiketle (Örn: @Rol1 @Rol2)')
                .setRequired(true)
        )
        .addChannelOption(option => 
            option.setName('log-kanali')
                .setDescription('Bilet kayıtlarının (transkript) gideceği kanal')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const rollerInput = interaction.options.getString('yetkili-roller');
        const logKanali = interaction.options.getChannel('log-kanali');
        const rolIDleri = rollerInput.match(/\d+/g); 

        if (!rolIDleri) return interaction.reply({ content: "❌ Geçerli roller girmelisin!", ephemeral: true });

        const anaEmbed = new EmbedBuilder()
            .setTitle('🛡️ Turkish Armed Forces | Destek Merkezi')
            .setDescription(
                'Yardıma mı ihtiyacınız var? Aşağıdaki butona tıklayarak kategorinizi seçin ve bir bilet oluşturun.\n\n' +
                '🔄 **Moderatör:** Discord içi şikayet & destek.\n' +
                '🎖️ **General:** Oyun içi sorunlar & rütbe desteği.\n' +
                '💰 **Gamepass:** Robux/Ürün sorunları.\n' +
                '🚨 **Yönetim:** Kritik üst düzey konular.'
            )
            .setColor('#2f3136')
            .setImage('https://r.resimlink.com/EnN8AFTihKvk.png')
            .setFooter({ text: 'TEAF Güvenlik ve Destek Sistemi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`tsa_ticket_init_${rolIDleri.join('-')}_${logKanali.id}`)
                .setLabel('Destek Talebi Oluştur')
                .setEmoji('📩')
                .setStyle(ButtonStyle.Success)
        );

        await interaction.reply({ content: `✅ TSA Destek Sistemi log kanalı <#${logKanali.id}> olacak şekilde kuruldu.`, ephemeral: true });
        await interaction.channel.send({ embeds: [anaEmbed], components: [row] });
    },

    async interactionHandler(interaction) {
        // --- 1. KATEGORİ SEÇİM MENÜSÜ ---
        if (interaction.isButton() && interaction.customId.startsWith('tsa_ticket_init_')) {
            const data = interaction.customId.split('_');
            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`tsa_ticket_cat_${data[3]}_${data[4]}`)
                    .setPlaceholder('Bilet kategorisini belirleyin...')
                    .addOptions([
                        { label: 'Moderatör Bileti', value: 'Moderatör', emoji: '🔄', description: 'Discord şikayetleri ve teknik destek.' },
                        { label: 'General Bileti', value: 'General', emoji: '🎖️', description: 'Oyun içi genel konular.' },
                        { label: 'Gamepass Bileti', value: 'Gamepass', emoji: '💰', description: 'Satın alım ve rütbe sorunları.' },
                        { label: 'Yönetim Bileti', value: 'Yönetim', emoji: '🚨', description: 'Üst yönetimle doğrudan temas.' },
                    ])
            );
            return await interaction.reply({ content: 'Lütfen talebinize uygun kategoriyi seçin:', components: [menuRow], ephemeral: true });
        }

        // --- 2. BİLET KANALI OLUŞTURMA ---
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tsa_ticket_cat_')) {
            const data = interaction.customId.split('_');
            const roles = data[3].split('-');
            const logID = data[4];
            const kategori = interaction.values[0];

            await interaction.reply({ content: '⏳ Biletiniz hazırlanıyor...', ephemeral: true });

            const kanal = await interaction.guild.channels.create({
                name: `t-${kategori.toLowerCase()}-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles] },
                    ...roles.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
                ],
                topic: `Bilet Sahibi: ${interaction.user.id} | Log: ${logID} | Kategori: ${kategori}`
            });

            const biletEmbed = new EmbedBuilder()
                .setAuthor({ name: `${interaction.user.tag} tarafından açıldı`, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(`🎫 ${kategori} Destek Birimi`)
                .setDescription(`Hoş geldin! Yetkililer en kısa sürede burada olacak. Lütfen sorununuzu detaylıca açıklayın.\n\n**Hesap Tarihi:** <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:R>`)
                .setColor('Green')
                .setTimestamp();

            const biletButonlar = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('tsa_claim').setLabel('Bileti Üstlen').setStyle(ButtonStyle.Primary).setEmoji('🙋‍♂️'),
                new ButtonBuilder().setCustomId('tsa_close').setLabel('Kapat ve Kaydet').setStyle(ButtonStyle.Danger).setEmoji('🔒')
            );

            await kanal.send({ content: `${roles.map(r => `<@&${r}>`).join(' ')}`, embeds: [biletEmbed], components: [biletButonlar] });
            await interaction.editReply({ content: `✅ Biletiniz açıldı: ${kanal}` });
        }

        // --- 3. BİLETİ ÜSTLEN ---
        if (interaction.isButton() && interaction.customId === 'tsa_claim') {
            const claimEmbed = new EmbedBuilder()
                .setDescription(`✅ Bu bilet **${interaction.user.tag}** tarafından üstlenildi.`)
                .setColor('Yellow');
            
            interaction.component.setDisabled(true); // Butonu pasif yap
            await interaction.update({ components: [new ActionRowBuilder().addComponents(interaction.component, interaction.message.components[0].components[1])] });
            await interaction.channel.send({ embeds: [claimEmbed] });
        }

        // --- 4. KAPAT VE TRANSKRİPT (KAYIT) SİSTEMİ ---
        if (interaction.isButton() && interaction.customId === 'tsa_close') {
            const topicData = interaction.channel.topic;
            const logID = topicData.match(/Log: (\d+)/)?.[1];
            const ownerID = topicData.match(/Bilet Sahibi: (\d+)/)?.[1];

            await interaction.reply('🔒 Bilet kapatılıyor ve transkript hazırlanıyor...');

            const logKanal = interaction.guild.channels.cache.get(logID);
            if (logKanal) {
                // Basit Transkript Hazırlama
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const transkript = messages.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
                
                const logEmbed = new EmbedBuilder()
                    .setTitle('📄 Bilet Kaydı Arşivlendi')
                    .addFields(
                        { name: 'Açan Kullanıcı', value: `<@${ownerID}>`, inline: true },
                        { name: 'Kapatan Yetkili', value: `${interaction.user}`, inline: true },
                        { name: 'Kanal', value: `#${interaction.channel.name}`, inline: true }
                    )
                    .setColor('Red').setTimestamp();

                const buffer = Buffer.from(transkript, 'utf-8');
                await logKanal.send({ 
                    embeds: [logEmbed], 
                    files: [{ attachment: buffer, name: `transkript-${interaction.channel.name}.txt` }] 
                });
            }

            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
};
