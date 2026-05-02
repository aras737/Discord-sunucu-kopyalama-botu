require('dotenv').config(); // 'Require' düzeltildi
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

        // Mesaj tabanlı komutlar (!kur gibi)
        if (command.name) {
            client.commands.set(command.name, command);
        }

        // Slash komutlar (/spam gibi)
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            console.log(`🚀 Slash Komutu Listeye Eklendi: ${command.data.name}`);
        }
    }
}

// --- HAZIR OLMA & SLASH KAYDI ---
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
    
    // REST API'yi başlat
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

    try {
        console.log("🔄 Slash komutları globale kaydediliyor...");
        
        // Komutları yükle (client.user.id hazır olduğu için Routes artık çalışır)
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        
        console.log("✨ Komutlar Discord API sistemine başarıyla çakıldı.");
    } catch (error) {
        console.error("❌ Komut yükleme sırasında hata oluştu:", error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Komut çalıştırılırken hata oluştu!', ephemeral: true });
            }
        }
    }

    // Destek sistemi handler'ı
    const supportCommand = client.commands.get('destek-kur');
    if (supportCommand && supportCommand.interactionHandler) {
        try {
            await supportCommand.interactionHandler(interaction);
        } catch (err) {}
    }
});

// --- MESAJ KOMUTLARI ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (command && !command.data) { // Sadece mesaj komutlarını (slash olmayan) çalıştır
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
        }
    }
});

// --- ANTI-CRASH & UPTIME ---
process.on('unhandledRejection', e => console.log('🛑 Rejection:', e));
process.on('uncaughtException', e => console.log('🛑 Exception:', e));

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("FORCES ACTIVE");
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
