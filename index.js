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
const OWNER_ID = "1389930042200559706"; // Senin Discord ID'n
const BOT_NAME = "Aethelgard Sunucu Kopyalayıcı";

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
            .setTitle(`⚙️ ${BOT_NAME}`)
            .setColor('#5865F2')
            .setDescription(
                `✅ **Gelişmiş Klonlama Sistemi**\n` +
                `Sunucunun tüm kanal, rol, izin ve ikon yapılarını hedef sunucuya aktarır.\n\n` +
                `🔹 **Klonlanan İçerikler:**\n` +
                `> • Sunucu Adı ve **İkonu** 🖼️\n` +
                `> • Tüm **Eski Roller Silinir** ve Yenileri Eklenir 🎭\n` +
                `> • Tüm Kategoriler ve Kanallar 📂\n\n` +
                `⚠️ **Önemli Uyarı:**\n` +
                `Hedef sunucudaki **HER ŞEY** (kanallar ve roller) kalıcı olarak silinecektir!`
            )
            .setFooter({ text: 'Aethelgard Sistemi • Risk size aittir' })
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

        await interaction.reply({ content: '⏳ Klonlama başlatıldı, roller ve kanallar temizleniyor...', ephemeral: true });

        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sourceId);
                const target = self.guilds.cache.get(targetId);

                if (!source || !target) {
                    return interaction.followUp({ content: '❌ Sunucu bulunamadı! Token iki sunucuda da olmalı.', ephemeral: true });
                }

                // 1. İsim ve İkon Kopyalama
                await target.setName(source.name);
                if (source.iconURL()) {
                    await target.setIcon(source.iconURL({ dynamic: true, size: 1024 }));
                }

                // 2. Hedef Kanalları Temizle
                const targetChannels = await target.channels.fetch();
                for (const chan of targetChannels.values()) await chan.delete().catch(() => {});

                // 3. Hedef Rolleri Temizle
                const targetRoles = await target.roles.fetch();
                for (const role of targetRoles.values()) {
                    if (role.managed || role.name === "@everyone" || role.id === target.rulesChannelId) continue;
                    await role.delete().catch(() => {});
                }

                // 4. Kaynak Rolleri Oluştur
                const sourceRoles = await source.roles.fetch();
                for (const role of sourceRoles.sort((a, b) => a.position - b.position).values()) {
                    if (role.managed || role.name === "@everyone") continue;
                    await target.roles.create({ 
                        name: role.name, 
                        color: role.color, 
                        permissions: role.permissions,
                        hoist: role.hoist,
                        mentionable: role.mentionable
                    }).catch(() => {});
                }

                // 5. Kanalları Kopyala
                const allChannels = await source.channels.fetch();
                const categories = allChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a, b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = allChannels.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                    for (const child of children.values()) {
                        await target.channels.create(child.name, { 
                            type: child.type, 
                            parent: newCat.id,
                            nsfw: child.nsfw,
                            topic: child.topic
                        }).catch(() => {});
                    }
                }

                await interaction.followUp({ content: `✅ **Aethelgard** işlemi başarıyla tamamladı! İkon, roller ve kanallar güncellendi.`, ephemeral: true });
                self.destroy();
            } catch (err) {
                console.error(err);
                interaction.followUp({ content: '❌ Bir hata oluştu. Hedef sunucudaki yetkilerinizi kontrol edin.', ephemeral: true });
            }
        });

        self.login(selfToken).catch(() => interaction.followUp({ content: '❌ Geçersiz Token!', ephemeral: true }));
    }
});

bot.login(process.env.DISCORD_BOT_TOKEN);
