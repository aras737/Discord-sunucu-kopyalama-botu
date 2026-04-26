const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const BOT_TOKEN = "BOT_TOKENINIZI_BURAYA_YAZIN";

client.on('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
});

client.on('messageCreate', async (message) => {
    // Örnek kullanım: !kopyala [Kaynak_Sunucu_ID] [Hedef_Sunucu_ID]
    if (message.content.startsWith('!kopyala')) {
        const args = message.content.split(' ');
        const sourceId = args[1];
        const targetId = args[2];

        if (!sourceId || !targetId) return message.reply("Lütfen kaynak ve hedef sunucu ID'lerini girin.");

        const sourceGuild = client.guilds.cache.get(sourceId);
        const targetGuild = client.guilds.cache.get(targetId);

        if (!sourceGuild || !targetGuild) return message.reply("Bot her iki sunucuda da ekli olmalıdır!");

        message.channel.send("🔄 Kopyalama işlemi başlatıldı, bu biraz zaman alabilir...");

        try {
            // 1. Önce Hedef Sunucudaki Eski Kanalları Temizle (Opsiyonel)
            const channels = await targetGuild.channels.fetch();
            for (const channel of channels.values()) {
                await channel.delete().catch(() => {});
            }

            // 2. Rolleri Kopyala
            const roles = await sourceGuild.roles.fetch();
            for (const role of roles.values()) {
                if (role.managed || role.name === "@everyone") continue;
                await targetGuild.roles.create({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions,
                    hoist: role.hoist,
                    mentionable: role.mentionable
                }).catch(e => console.log(`Rol oluşturulamadı: ${role.name}`));
            }

            // 3. Kategorileri ve Kanalları Kopyala
            const sourceChannels = await sourceGuild.channels.fetch();
            const categories = sourceChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);

            for (const category of categories.values()) {
                const newCategory = await targetGuild.channels.create({
                    name: category.name,
                    type: ChannelType.GuildCategory
                });

                const children = sourceChannels.filter(c => c.parentId === category.id).sort((a, b) => a.position - b.position);
                for (const child of children.values()) {
                    await targetGuild.channels.create({
                        name: child.name,
                        type: child.type,
                        parent: newCategory.id,
                        nsfw: child.nsfw,
                        topic: child.topic
                    });
                }
            }

            message.channel.send("✅ İşlem başarıyla tamamlandı!");
        } catch (error) {
            console.error(error);
            message.channel.send("❌ Bir hata oluştu. Yetkileri kontrol edin.");
        }
    }
});

client.login(BOT_TOKEN);
