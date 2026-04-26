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

// 🤖 ANA BOT (PANELİ GÖSTERECEK OLAN)
const bot = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🚀 BOT HAZIR OLDUĞUNDA
bot.on('ready', () => {
    console.log(`✅ Panel Botu Aktif: ${bot.user.tag}`);
    console.log(`📌 Komut: !kur`);
});

// 📩 PANEL KOMUTU
bot.on('messageCreate', async (message) => {
    if (message.content === '!kur' && !message.author.bot) {
        const embed = new EmbedBuilder()
            .setTitle('🚀 Gelişmiş Sunucu Kopyalayıcı')
            .setDescription('Kopyalama işlemini başlatmak için aşağıdaki butona basın.\n\n**UYARI:** Bu işlem bir kullanıcı hesabı (Self-Bot) gerektirir. Risk size aittir!')
            .setColor('#5865F2')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('copy_trigger')
                .setLabel('Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔥')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// ⚙️ ETKİLEŞİM YÖNETİMİ
bot.on('interactionCreate', async (interaction) => {
    
    // 1. MODAL (FORM) AÇILIŞI
    if (interaction.isButton() && interaction.customId === 'copy_trigger') {
        const modal = new ModalBuilder()
            .setCustomId('copy_modal')
            .setTitle('Klonlama Bilgilerini Girin');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('self_token')
                    .setLabel('Hesap (Self) Tokeni')
                    .setPlaceholder('Hesabınızın tokenini buraya yapıştırın')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('source_id')
                    .setLabel('Kaynak Sunucu ID')
                    .setPlaceholder('Kopyalanacak sunucunun IDsi')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('target_id')
                    .setLabel('Hedef Sunucu ID')
                    .setPlaceholder('Yapıştırılacak sunucunun IDsi')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            )
        );

        await interaction.showModal(modal);
    }

    // 2. MODAL ONAYLANDIĞINDA (KLONLAMA BAŞLAR)
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'copy_modal') {
        const selfToken = interaction.fields.getTextInputValue('self_token');
        const sourceId = interaction.fields.getTextInputValue('source_id');
        const targetId = interaction.fields.getTextInputValue('target_id');

        await interaction.reply({ content: '⏳ Self-bot girişi yapılıyor... Lütfen bekleyin.', ephemeral: true });

        // 🟢 SELF BOTU BAŞLAT
        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sourceId);
                const target = self.guilds.cache.get(targetId);

                if (!source || !target) {
                    return interaction.followUp({ content: '❌ Sunucu bulunamadı! Tokenin bu sunucularda olduğundan emin olun.', ephemeral: true });
                }

                // A. Hedef Sunucuyu Temizle
                const targetChannels = await target.channels.fetch();
                for (const chan of targetChannels.values()) await chan.delete().catch(() => {});

                // B. Roller Kopyalanıyor
                const roles = await source.roles.fetch();
                for (const role of roles.sort((a, b) => a.position - b.position).values()) {
                    if (role.managed || role.name === "@everyone") continue;
                    await target.roles.create({
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions,
                        hoist: role.hoist
                    }).catch(() => {});
                }

                // C. Kategoriler ve Kanallar Kopyalanıyor
                const channels = await source.channels.fetch();
                const categories = channels.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = channels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                    
                    for (const child of children.values()) {
                        await target.channels.create(child.name, {
                            type: child.type,
                            parent: newCat.id,
                            nsfw: child.nsfw
                        }).catch(() => {});
                    }
                }

                await interaction.followUp({ content: `✅ Klonlama başarılı! **${source.name}** -> **${target.name}**`, ephemeral: true });
                self.destroy();

            } catch (err) {
                console.error(err);
                interaction.followUp({ content: '❌ Bir hata oluştu! Yetkilerinizi veya tokeni kontrol edin.', ephemeral: true });
            }
        });

        self.login(selfToken).catch(() => {
            interaction.followUp({ content: '❌ Geçersiz Self-Token!', ephemeral: true });
        });
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);
