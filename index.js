require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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

        if (command.name) {
            client.commands.set(command.name, command);
        }

        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            console.log(`🚀 Komut Hazır: ${command.data.name}`);
        }
    }
}

// --- SONSUZ AKTİFLİK & SLASH KAYDI ---
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Aktif ve Tetikte!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        console.log('✨ Komutlar Discord API'ye çakıldı.');
    } catch (error) {
        console.error('❌ Kayıt hatası:', error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            // Komutu çalıştırırken 'await' kullanarak botun bitmesini beklemesini sağlıyoruz
            await command.execute(interaction);
        } catch (error) {
            console.error("Komut Hatası:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: '❌ İşlem sırasında bir kopukluk oldu!', ephemeral: true });
            }
        }
    }
});

// --- ANTİ-CRASH (BOTU HAYATTA TUTAR) ---
process.on('unhandledRejection', (reason) => { console.log('🛑 Rejection:', reason); });
process.on('uncaughtException', (err) => { console.log('🛑 Exception:', err); });

// --- UPTIME & SELF-PINGER (RENDER UYUMAZ) ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("FORCES ACTIVE 24/7");
});

server.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Web Sunucusu Aktif.");
    
    // Her 5 dakikada bir Render URL'ini pingleyerek botu uyanık tutar
    setInterval(() => {
        const url = `http://localhost:${process.env.PORT || 3000}`;
        http.get(url);
    }, 300000); 
});

client.login(process.env.DISCORD_BOT_TOKEN);
