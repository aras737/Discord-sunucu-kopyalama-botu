require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Botu başlat (Tüm yetkiler açık)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// Komutları saklamak için bir koleksiyon oluştur
client.commands = new Collection();

// --- KOMUT YÜKLEYİCİ (Command Handler) ---
const commandsPath = path.join(__dirname, 'commands'); // Komutların olduğu klasör adı

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('name' in command && 'execute' in command) {
            client.commands.set(command.name, command);
            console.log(`📡 Komut Yüklendi: ${command.name}`);
        }
    }
} else {
    console.log("⚠️ 'commands' klasörü bulunamadı! Lütfen oluşturun.");
}

// --- MESAJ DİNLEYİCİ ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Komut dosyasındaki 'name' (örneğin !kur) ile eşleşiyor mu bak
    const command = client.commands.get(message.content.split(' ')[0]);

    if (command) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
            message.reply('❌ Komut çalıştırılırken bir hata oluştu!');
        }
    }
});

// Bot hazır olduğunda
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} Giriş Yaptı! Komutlar dinleniyor.`);
});

// --- 7/24 AKTİF TUTUCU ---
http.createServer((req, res) => {
    res.write("FORCES Cloner System is Online!");
    res.end();
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
