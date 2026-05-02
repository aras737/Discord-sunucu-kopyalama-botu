require('dotenv').config(); // Büyük harf hatası düzeltildi
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // !kur için bu şart
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.slashCommands = [];

// --- KOMUT YÜKLEME MERKEZİ ---
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        // 1. Durum: Mesaj Tabanlı Komutlar (Örn: name: 'kur')
        if (command.name) {
            client.commands.set(command.name, command);
            console.log(`📡 Prefix Komutu Hazır: !${command.name}`);
        }

        // 2. Durum: Slash Komutlar (Örn: data: new SlashCommandBuilder...)
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            console.log(`🚀 Slash Komutu Hazır: /${command.data.name}`);
        }
    }
}

// --- HAZIR OLMA & KOMUTLARI DİSCORD'A GÖNDERME ---
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Giriş Yaptı!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        console.log("🔄 Slash komutları globale kaydediliyor...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        console.log("✨ Komutlar Discord API sistemine başarıyla çakıldı.");
    } catch (error) {
        console.error("❌ Kayıt hatası:", error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ (Slash Komutlar) ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Komut hatası!', ephemeral: true });
        }
    }
});

// --- MESAJ YÖNETİMİ (!kur Komutları) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = "!"; // Prefix buraya
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Sadece 'name' özelliği olan prefix komutlarını bul
    const command = client.commands.get(commandName);
    
    if (command && command.execute && !command.data) {
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply("❌ Bu komut çalıştırılırken bir hata oluştu.");
        }
    }
});

// --- ANTI-CRASH & UPTIME ---
process.on('unhandledRejection', e => console.log('🛑 Hata:', e));
process.on('uncaughtException', e => console.log('🛑 Hata:', e));

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("BOT ONLINE");
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
