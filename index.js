require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 1. BOT AYARLARI VE İZİNLER
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // !kur ve !sorgu için şart!
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();
client.slashCommands = [];

// 2. KOMUTLARI TARA VE YÜKLE (KIRIKLARI ONARIR)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        // Prefix Komutları (!kur, !sorgu vb.)
        if (command.name) {
            client.commands.set(command.name, command);
            console.log(`📡 Prefix Komutu Yüklendi: !${command.name}`);
        }

        // Slash Komutları (/spam, /destek-kur vb.)
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
            console.log(`🚀 Slash Komutu Yüklendi: /${command.data.name}`);
        }
    }
}

// 3. HAZIR OLMA VE SLASH KAYDI
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Tekrar Sahada!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        console.log("🔄 Slash komutları globale basılıyor...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        console.log("✨ Tüm komutlar başarıyla senkronize edildi.");
    } catch (error) {
        console.error("❌ Kayıt Hatası:", error);
    }
});

// 4. ETKİLEŞİM YÖNETİMİ (Slash & Destek Butonları)
client.on('interactionCreate', async (interaction) => {
    // Slash Komutlarını Çalıştır
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (!interaction.replied) await interaction.reply({ content: '❌ Komut hatası!', ephemeral: true });
        }
    }

    // DESTEK SİSTEMİ BUTONLARI (destek-kur.js içindeki handler)
    const supportCmd = client.commands.get('destek-kur');
    if (supportCmd && supportCmd.interactionHandler) {
        try {
            await supportCmd.interactionHandler(interaction);
        } catch (err) { /* Sessiz hata yönetimi */ }
    }
});

// 5. MESAJ TABANLI KOMUTLAR (!kur, !sorgu)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Sadece prefix tabanlı (slash olmayan) komutları tetikle
    const command = client.commands.get(commandName);
    if (command && !command.data) {
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply("❌ Komut uygulanırken hata oluştu!");
        }
    }
});

// 6. SİSTEMİ AYAKTA TUT (Anti-Crash & Uptime)
process.on('unhandledRejection', e => console.log('🛑 Kritik Hata (Red):', e));
process.on('uncaughtException', e => console.log('🛑 Kritik Hata (Ex):', e));

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("SYSTEM ONLINE");
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
