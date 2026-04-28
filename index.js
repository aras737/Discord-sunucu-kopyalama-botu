require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
const http = require('http');

// En stabil intent ayarları
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = "1389930042200559706";

// --- KOMUT TANIMLARI ---
const commands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Belirlenen mesajı miktar kadar gönderir.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Yazılacak metin').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Kaç adet gönderilsin?').setRequired(true)),

    new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Sunucuyu kopyalar.')
        .addStringOption(opt => opt.setName('id').setDescription('Kaynak Sunucu ID').setRequired(true))
].map(c => c.toJSON());

// --- BOT HAZIR ---
client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ Eski Sistem Aktif: ${client.user.tag}`);
    } catch (e) { console.error(e); }
});

// --- KOMUT ÇALIŞTIRICI ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetkin yok!", ephemeral: true });

    const { commandName, options, channel, guild } = interaction;

    // --- SPAM KOMUDU ---
    if (commandName === 'spam') {
        const msg = options.getString('mesaj');
        const count = options.getInteger('miktar');
        await interaction.reply({ content: `🚀 İşlem başladı.`, ephemeral: true });

        for (let i = 0; i < count; i++) {
            try {
                await channel.send(msg);
                await new Promise(r => setTimeout(r, 1000)); // 1 saniye gecikme (stabilite için)
            } catch (e) { break; }
        }
    }

    // --- KUR KOMUDU ---
    if (commandName === 'kur') {
        const srcId = options.getString('id');
        const src = client.guilds.cache.get(srcId);
        if (!src) return interaction.reply({ content: "❌ Bot kaynak sunucuda değil!", ephemeral: true });

        await interaction.reply({ content: "🏗️ Kurulum başladı...", ephemeral: true });

        try {
            // Mevcut kanalları temizle
            const currentChans = await guild.channels.fetch();
            for (const c of currentChans.values()) await c.delete().catch(() => {});

            // Kategorileri ve Kanalları Oluştur
            const srcChans = await src.channels.fetch();
            const cats = srcChans.filter(c => c.type === ChannelType.GuildCategory).sort((a,b) => a.position - b.position);

            for (const cat of cats.values()) {
                const newCat = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
                const children = srcChans.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                
                for (const ch of children.values()) {
                    await guild.channels.create({ name: ch.name, type: ch.type, parent: newCat.id }).catch(() => {});
                    await new Promise(r => setTimeout(r, 800));
                }
            }
        } catch (e) { console.error(e); }
    }
});

// 7/24 Aktif Tutucu
http.createServer((req, res) => res.end("System Online")).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
