require('dotenv').config();
const { 
    Client, GatewayIntentBits, ChannelType, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, EmbedBuilder, InteractionType 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

client.on('ready', () => {
    console.log(`✅ Panel sistemi aktif: ${client.user.tag}`);
});

// 1. ADIM: !kur komutu ile Paneli Gönder
client.on('messageCreate', async (message) => {
    if (message.content !== '!kur' || message.author.bot) return;

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🚀 Sunucu Klonlama Paneli')
        .setDescription('Aşağıdaki butona basarak kopyalama işlemini başlatabilirsiniz.\n\n**Dikkat:** Hedef sunucudaki her şey silinecektir!')
        .setFooter({ text: 'Güvenli Kopyalama Sistemi' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('klon_baslat')
            .setLabel('Klonlamayı Başlat')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚙️')
    );

    await message.channel.send({ embeds: [embed], components: [row] });
});

// 2. ADIM: Buton ve Modal İşlemleri
client.on('interactionCreate', async (interaction) => {
    
    // Butona basıldığında Modal (Form) aç
    if (interaction.isButton() && interaction.customId === 'klon_baslat') {
        const modal = new ModalBuilder()
            .setCustomId('klon_modal')
            .setTitle('Sunucu Bilgilerini Girin');

        const sourceInput = new TextInputBuilder()
            .setCustomId('source_id')
            .setLabel('Kaynak Sunucu ID')
            .setPlaceholder('Kopyalanacak sunucunun IDsi')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const targetInput = new TextInputBuilder()
            .setCustomId('target_id')
            .setLabel('Hedef Sunucu ID')
            .setPlaceholder('Her şeyin silineceği hedef sunucu IDsi')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(sourceInput),
            new ActionRowBuilder().addComponents(targetInput)
        );

        await interaction.showModal(modal);
    }

    // Modal gönderildiğinde Kopyalamayı Başlat
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'klon_modal') {
        const sourceId = interaction.fields.getTextInputValue('source_id');
        const targetId = interaction.fields.getTextInputValue('target_id');

        await interaction.reply({ content: '🔄 İşlem başlatıldı, lütfen bekleyin...', ephemeral: true });

        const sourceGuild = client.guilds.cache.get(sourceId);
        const targetGuild = client.guilds.cache.get(targetId);

        if (!sourceGuild || !targetGuild) {
            return interaction.followUp({ content: '❌ Bot iki sunucuda da olmalıdır!', ephemeral: true });
        }

        try {
            // --- KOPYALAMA MANTIĞI BAŞLANGICI ---
            
            // Hedef Sunucuyu Temizle
            const targetChannels = await targetGuild.channels.fetch();
            for (const channel of targetChannels.values()) {
                await channel.delete().catch(() => {});
            }

            // Rolleri Kopyala
            const roles = await sourceGuild.roles.fetch();
            for (const role of roles.values()) {
                if (role.managed || role.name === "@everyone") continue;
                await targetGuild.roles.create({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions,
                    hoist: role.hoist
                }).catch(() => {});
            }

            // Kategorileri ve Kanalları Kopyala
            const sourceChannels = await sourceGuild.channels.fetch();
            const categories = sourceChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);

            for (const category of categories.values()) {
                const newCat = await targetGuild.channels.create({ name: category.name, type: ChannelType.GuildCategory });
                const children = sourceChannels.filter(c => c.parentId === category.id).sort((a, b) => a.position - b.position);
                
                for (const child of children.values()) {
                    await targetGuild.channels.create({
                        name: child.name,
                        type: child.type,
                        parent: newCat.id
                    });
                }
            }

            await interaction.followUp({ content: `✅ **${sourceGuild.name}** başarıyla **${targetGuild.name}** sunucusuna kopyalandı!`, ephemeral: true });

        } catch (err) {
            console.error(err);
            await interaction.followUp({ content: '❌ Bir hata oluştu, yetkileri kontrol et.', ephemeral: true });
        }
    }
});

client.login(TOKEN);
