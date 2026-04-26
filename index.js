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

const bot = new BotClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// 🚀 SAHİP KONTROLÜ İÇİN AYAR
const OWNER_ID = "1389930042200559706"; // Buraya kendi Discord ID'ni yaz

bot.on('ready', () => {
    console.log(`✅ Panel Botu Aktif: ${bot.user.tag}`);
    console.log(`📌 Kurulum yetkisi sadece ID: ${OWNER_ID} kullanıcısındadır.`);
});

// 📩 PANEL KOMUTU
bot.on('messageCreate', async (message) => {
    if (message.content === '!kur') {
        // Sadece bot sahibi kurabilsin kontrolü
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Bu komutu sadece bot sahibi kullanabilir!").then(msg => {
                setTimeout(() => msg.delete(), 5000); // 5 saniye sonra uyarıyı siler
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚙️ JSON Sunucu Kopyalama')
            .setColor('#5865F2')
            .setDescription(
                `✅ **Gelişmiş Klonlama Sistemi**\n` +
                `Bu araç ile istediğiniz sunucunun tüm kanal, rol ve izin yapılarını saniyeler içerisinde hedef sunucuya aktarabilirsiniz.\n\n` +
                `🔹 **Klonlanan İçerikler:**\n` +
                `> • Tüm Roller ve İzinler\n` +
                `> • Tüm Kategoriler ve Kanallar\n` +
                `> • Kanal Pozisyonları ve İzinleri\n` +
                `> • Sunucu Adı ve İkonu\n\n` +
                `🔹 **Kullanım Kısıtlaması:**\n` +
                `> Yetkililer haricindeki kullanıcılar bu paneli **1 saatte 1 kere** kullanabilir.\n\n` +
                `⚠️ **Önemli Uyarı:**\n` +
                `Hedef sunucudaki tüm eski kanal ve roller **kalıcı olarak silinecektir!**\n\n` +
                `⏰ İşlemi başlatmak için aşağıdaki butona basın.`
            )
            .addFields({ name: '➕ Kopyalamayı Başlat', value: '*Yeni bir klonlama operasyonu oluşturun.*' })
            .setFooter({ text: 'Risk size aittir • Self-Bot gerektirir' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('copy_trigger')
                .setLabel('Kopyalamayı Başlat')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🚀')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete(); // Kurulum komutunu silerek temizlik yapar
    }
});

// ⚙️ ETKİLEŞİM YÖNETİMİ (Burada herkes butona basabilir)
bot.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'copy_trigger') {
        const modal = new ModalBuilder()
            .setCustomId('copy_modal')
            .setTitle('Klonlama Bilgilerini Girin');

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('self_token')
                    .setLabel('Hesap (Self) Tokeni')
                    .setPlaceholder('Tokeninizi buraya yapıştırın')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('source_id')
                    .setLabel('Kaynak Sunucu ID')
                    .setPlaceholder('Kopyalanacak sunucu ID')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('target_id')
                    .setLabel('Hedef Sunucu ID')
                    .setPlaceholder('Yapıştırılacak sunucu ID')
                    .setStyle(TextInputStyle.Short).setRequired(true)
            )
        );

        await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'copy_modal') {
        const selfToken = interaction.fields.getTextInputValue('self_token');
        const sourceId = interaction.fields.getTextInputValue('source_id');
        const targetId = interaction.fields.getTextInputValue('target_id');

        await interaction.reply({ content: '⏳ Klonlama başlatıldı...', ephemeral: true });

        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sourceId);
                const target = self.guilds.cache.get(targetId);

                if (!source || !target) {
                    return interaction.followUp({ content: '❌ Sunucu bulunamadı!', ephemeral: true });
                }

                // Temizleme ve Kopyalama Mantığı
                const targetChannels = await target.channels.fetch();
                for (const chan of targetChannels.values()) await chan.delete().catch(() => {});

                const roles = await source.roles.fetch();
                for (const role of roles.sort((a, b) => a.position - b.position).values()) {
                    if (role.managed || role.name === "@everyone") continue;
                    await target.roles.create({ name: role.name, color: role.color, permissions: role.permissions }).catch(() => {});
                }

                const allChannels = await source.channels.fetch();
                const categories = allChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = allChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                    for (const child of children.values()) {
                        await target.channels.create(child.name, { type: child.type, parent: newCat.id }).catch(() => {});
                    }
                }

                await interaction.followUp({ content: `✅ İşlem Başarılı!`, ephemeral: true });
                self.destroy();
            } catch (err) {
                interaction.followUp({ content: '❌ Bir hata oluştu.', ephemeral: true });
            }
        });

        self.login(selfToken).catch(() => interaction.followUp({ content: '❌ Geçersiz Token!', ephemeral: true }));
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);
