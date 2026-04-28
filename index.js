require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = '1394574380394221719'; // Botunun ID'si olduğundan emin ol
const OWNER_ID = "1389930042200559706";
const PREFIX = '!';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) client.commands.set(command.name, command);
}

client.once(Events.ClientReady, (c) => {
    console.log(`🚀 Bot Aktif: ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = PREFIX + args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command && message.author.id === OWNER_ID) {
        try { await command.execute(message, args); } catch (e) { console.error(e); }
    }
});

// RENDER 7/24 UYKU ENGELLEYİCİ
http.createServer((req, res) => {
    res.write("FORCES Sunucu Kopyalayici 7/24 Aktif!");
    res.end();
}).listen(process.env.PORT || 3000);

client.login(TOKEN);
