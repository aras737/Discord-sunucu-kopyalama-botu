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
        GatewayIntentBits.GuildMembers // Gerekli izinler
    ]
});

client.commands = new Collection();
client.slashCommands = []; // Slash komutlarını kayıt için ayrı liste

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
            console.log(`📡 Mesaj Komutu Yüklendi: ${command.name}`);
        }

        // Slash komutlar (/destek-kur gibi)
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            console.log(`🚀 Slash Komutu Yüklendi: ${command.data.name}`);
        }
    }
}

// --- SLASH KOMUTLARI KAYDETME (Ready Olayı) ---
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        console.log('🔄 Slash komutları yenileniyor...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        console.log('✨ Slash komutları başarıyla kaydedildi.');
    } catch (error) {
        console.error('❌ Slash kaydı hatası:', error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ (Slash & Buton & Menu) ---
client.on('interactionCreate', async (interaction) => {
    // 1. Slash Komutları Çalıştır
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Bu komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        }
    }

    // 2. Buton ve SelectMenu Etkileşimleri (Destek Sistemi için)
    // 'destek-kur.js' içindeki interactionHandler'ı tetikler
    const supportCommand = client.commands.get('destek-kur');
    if (supportCommand && supportCommand.interactionHandler) {
        try {
            await supportCommand.interactionHandler(interaction);
        } catch (err) {
            // Hata loglama (isteğe bağlı)
        }
    }
});

// --- MESAJ TABANLI KOMUTLAR (!kur için) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = "!"; // Prefix buraya
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = prefix + args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (command) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
            message.reply("❌ Komut uygulanırken bir hata oluştu.");
        }
    }
});

// --- SONSUZ ÇALIŞMA & HATADAN KORUNMA (Anti-Crash) ---
process.on('unhandledRejection', (reason, p) => {
    console.log('⚠️ [Hata Yakalandı] unhandledRejection:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.log('⚠️ [Hata Yakalandı] uncaughtException:', err);
});

// Uptime için basit web sunucu
http.createServer((req, res) => {
    res.write("FORCES Uptime Online");
    res.end();
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
