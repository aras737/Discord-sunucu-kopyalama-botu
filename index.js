require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    ChannelType, 
    PermissionsBitField, 
    EmbedBuilder 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Ayarlar
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PREFIX = "!";

client.on('ready', () => {
    console.log(`✅ Bot aktif: ${client.user.tag}`);
    console.log(`🚀 Komut: ${PREFIX}kopyala <kaynak_id> <hedef_id>`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'kopyala') {
        const sourceId = args[0];
        const targetId = args[1];

        if (!sourceId || !targetId) {
            return message.reply("❌ Kullanım: `!kopyala <Kaynak_Sunucu_ID> <Hedef_Sunucu_ID>`");
        }

        const sourceGuild = client.guilds.cache.get(sourceId);
        const targetGuild = client.guilds.cache.get(targetId);

        if (!sourceGuild || !targetGuild) {
            return message.reply("❌ Botun her iki sunucuda da olması ve 'Yönetici' yetkisine sahip olması gerekir!");
        }

        const statusMsg = await message.channel.send("🔄 Hazırlanıyor... Hedef sunucu temizleniyor.");

        try {
            // 1. ADIM: Hedef Sunucuyu Temizle
            const targetChannels = await targetGuild.channels.fetch();
            for (const channel of targetChannels.values()) {
                await channel.delete().catch(() => {});
            }

            // 2. ADIM: Rolleri Kopyala
            await statusMsg.edit("📝 Roller kopyalanıyor...");
            const roles = await sourceGuild.roles.fetch();
            const roleMap = new Map();

            for (const role of roles.values()) {
                if (role.managed || role.name === "@everyone") continue;
                try {
                    const newRole = await targetGuild.roles.create({
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions,
                        hoist: role.hoist,
                        mentionable: role.mentionable
                    });
                    roleMap.set(role.id, newRole.id);
                } catch (e) { console.log(`Rol hatası: ${role.name}`); }
            }

            // 3. ADIM: Kategorileri ve Kanalları Kopyala
            await statusMsg.edit("📂 Kategoriler ve kanallar oluşturuluyor...");
            const sourceChannels = await sourceGuild.channels.fetch();
            
            // Önce Kategoriler
            const categories = sourceChannels.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
            
            for (const category of categories.values()) {
                const newCategory = await targetGuild.channels.create({
                    name: category.name,
                    type: ChannelType.GuildCategory
                });

                // Bu kategoriye ait alt kanallar
                const children = sourceChannels.filter(c => c.parentId === category.id).sort((a, b) => a.position - b.position);
                
                for (const child of children.values()) {
                    await targetGuild.channels.create({
                        name: child.name,
                        type: child.type,
                        parent: newCategory.id,
                        nsfw: child.nsfw,
                        topic: child.topic,
                        bitrate: child.bitrate || undefined,
                        userLimit: child.userLimit || undefined
                    });
                }
            }

            // 4. ADIM: Kategori Dışı Kanallar (Eğer varsa)
            const noParentChannels = sourceChannels.filter(c => !c.parentId && c.type !== ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
            for (const channel of noParentChannels.values()) {
                await targetGuild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    nsfw: channel.nsfw,
                    topic: channel.topic
                });
            }

            await statusMsg.edit("✅ Sunucu başarıyla kopyalandı!");

        } catch (err) {
            console.error(err);
            await statusMsg.edit("❌ Bir hata oluştu! Konsolu kontrol et.");
        }
    }
});

client.login(TOKEN).catch(e => {
    console.error("❌ TOKEN HATASI: Girdiğin token geçersiz!");
});
