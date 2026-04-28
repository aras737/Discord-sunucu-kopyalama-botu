require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();

// KOMUTLARI YÜKLEME (Hata veren kısım burasıydı, düzelttim)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Burada 'command.data.name' yerine direkt 'command.name' bakıyoruz
        if (command.name) {
            client.commands.set(command.name, command);
            console.log(`📡 Komut Yüklendi: ${command.name}`);
        }
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const command = client.commands.get(message.content.split(' ')[0]);
    if (command) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
        }
    }
});

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
});

http.createServer((req, res) => res.end("FORCES Online")).listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_BOT_TOKEN);
