require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const OWNER_ID = "1389930042200559706";

// --- KOMUT TANIMLAMALARI ---
const commands = [
    // SPAM KOMUDU
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Woodhook Style: Kanala mesaj yağmuru başlatır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Metin').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Sayı').setRequired(true)),
    
    // KUR (CLONE) KOMUDU
    new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Sunucuyu kopyalar.')
        .addStringOption(opt => opt.setName('id').setDescription('Kaynak Sunucu ID').setRequired(true))
].map(command => command.toJSON());

// --- BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`✅ Woodhook v2 Aktif: ${client.user.tag}`);
    } catch (e) { console.error(e); }
});

// --- KOMUT ÇALIŞTIRICI ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetkin yok!", ephemeral: true });

    const { commandName, options, channel } = interaction;

    // --- SPAM MANTIĞI ---
    if (commandName === 'spam') {
        const msg = options.getString('mesaj');
        const count = options.getInteger('miktar');
        await interaction.reply({ content: `🚀 Spam başlatıldı: ${count} adet.`, ephemeral: true });

        for (let i = 0; i < count; i++) {
            try {
                await channel.send(msg);
                await new Promise(r => setTimeout(r, 1000)); // 1 Saniye Gecikme
            } catch (e) { break; }
        }
    }

    // --- KUR MANTIĞI ---
    if (commandName === 'kur') {
        const srcId = options.getString('id');
        const src = client.guilds.cache.get(srcId);
        const trg = interaction.guild;

        if (!src) return interaction.reply({ content: "❌ Bot kaynak sunucuda yok!", ephemeral: true });

        await interaction.reply({ content: "🏗️ Kopyalama başladı (1sn gecikmeli)...", ephemeral: true });

        try {
            await trg.setName(src.name);
            const chans = await trg.channels.fetch();
            for (const c of chans.values()) { await c.delete().catch(() => {}); await new Promise(r => setTimeout(r, 500)); }

            const srcChans = await src.channels.fetch();
            const cats = srcChans.filter(c => c.type === ChannelType.GuildCategory).sort((a,b) => a.position - b.position);

            for (const cat of cats.values()) {
                const newCat = await trg.channels.create({ name: cat.name, type: ChannelType.GuildCategory }).catch(() => null);
                if (newCat) {
                    const children = srcChans.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                    for (const ch of children.values()) {
                        await trg.channels.create({ name: ch.name, type: ch.type, parent: newCat.id }).catch(() => {});
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
        } catch (e) { console.error(e); }
    }
});

// --- 7/24 AKTİF TUTUCU ---
http.createServer((req, res) => { res.write("Woodhook Online"); res.end(); }).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
