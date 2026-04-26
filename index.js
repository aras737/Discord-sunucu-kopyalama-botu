require('dotenv').config();
const { 
    Client: BotClient, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

// BU ANA BOT (PANELİ GÖSTERECEK OLAN)
const bot = new BotClient({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

bot.on('ready', () => console.log(`🤖 Panel Botu Aktif: ${bot.user.tag}`));

bot.on('messageCreate', async (message) => {
    if (message.content === '!kur') {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Sunucu Kopyalama Sistemi')
            .setDescription('Aşağıdaki butona basarak formu açın ve bilgileri girin.')
            .setColor('#2f3136');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_copy')
                .setLabel('Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

bot.on('interactionCreate', async (interaction) => {
    // MODALI AÇ
    if (interaction.isButton() && interaction.customId === 'btn_copy') {
        const modal = new ModalBuilder()
            .setCustomId('modal_copy')
            .setTitle('Self-Bot Kopyalama Formu');

        const tokenInput = new TextInputBuilder()
            .setCustomId('self_token')
            .setLabel('Kullanıcı (Self) Tokeni')
            .setPlaceholder('Hesabınızın tokenini buraya girin...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const sourceInput = new TextInputBuilder()
            .setCustomId('source_id')
            .setLabel('Kaynak Sunucu ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const targetInput = new TextInputBuilder()
            .setCustomId('target_id')
            .setLabel('Hedef Sunucu ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(sourceInput),
            new ActionRowBuilder().addComponents(targetInput)
        );

        await interaction.showModal(modal);
    }

    // FORM GÖNDERİLDİĞİNDE
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_copy') {
        const selfToken = interaction.fields.getTextInputValue('self_token');
        const sourceId = interaction.fields.getTextInputValue('source_id');
        const targetId = interaction.fields.getTextInputValue('target_id');

        await interaction.reply({ content: '⏳ Self-bot girişi yapılıyor ve işlem başlatılıyor...', ephemeral: true });

        // ARKA PLANDA SELF BOTU ÇALIŞTIR
        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sourceId);
                const target = self.guilds.cache.get(targetId);

                if (!source || !target) {
                    return interaction.followUp({ content: '❌ Sunucu bulunamadı! Tokenin bu sunucularda olduğundan emin ol.', ephemeral: true });
                }

                // Kopyalama İşlemi (Kanallar ve Kategoriler)
                const channels = await source.channels.fetch();
                const categories = channels.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = channels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                    
                    for (const child of children.values()) {
                        await target.channels.create(child.name, {
                            type: child.type,
                            parent: newCat.id
                        }).catch(() => {});
                    }
                }

                await interaction.followUp({ content: `✅ **${source.name}** başarıyla kopyalandı!`, ephemeral: true });
                self.destroy(); // İşlem bitince self botu kapat
            } catch (err) {
                console.error(err);
                interaction.followUp({ content: '❌ Bir hata oluştu! (Rate limit veya Yetki eksikliği)', ephemeral: true });
            }
        });

        self.login(selfToken).catch(() => {
            interaction.followUp({ content: '❌ Geçersiz Self-Token girdiniz!', ephemeral: true });
        });
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);
