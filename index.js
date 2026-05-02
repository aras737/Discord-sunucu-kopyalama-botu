require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// --- BOT İZİNLERİ (INTENTS) ---
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
        }
    }
}

// --- HAZIR OLMA & SLASH KAYDI ---
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Aktif ve Tetikte!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        console.log("🔄 Slash komutları yenileniyor...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        // Tırnak hatası (SyntaxError) vermemesi için çift tırnak kullanıldı!
        console.log("✨ Komutlar Discord sistemine başarıyla çakıldı.");
    } catch (error) {
        console.error("❌ Kayıt hatası:", error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ (Slash & Buton & Menü) ---
client.on('interactionCreate', async (interaction) => {
    // 1. Slash Komutları
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error("Komut Hatası:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ İşlem sırasında bir kopukluk oldu!', ephemeral: true });
            }
        }
    }

    // 2. Buton ve Menü Etkileşimleri (Destek Sistemi vb. için)
    const supportCommand = client.commands.get('destek-kur');
    if (supportCommand && supportCommand.interactionHandler) {
        try {
            await supportCommand.interactionHandler(interaction);
        } catch (err) {
            // Arka plandaki küçük hataları yoksay
        }
    }
});

// --- MESAJ KOMUTLARI (!kur vb. Prefix Sistemi) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = "!"; // Prefix buraya
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = prefix + args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (command && command.execute) {
        try {
            await command.execute(message);
        } catch (error) {
            console.error(error);
            message.reply("❌ Komut uygulanırken bir hata oluştu.");
        }
    }
});

// --- ANTİ-CRASH (BOTUN ÇÖKMESİNİ ENGELLER) ---
process.on('unhandledRejection', (reason) => { console.log('🛑 Rejection:', reason); });
process.on('uncaughtException', (err) => { console.log('🛑 Exception:', err); });

// --- UPTIME / WEB SUNUCUSU (RENDER UYUMASIN DİYE) ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("FORCES ACTIVE 24/7");
});

server.listen(process.env.PORT || 3000, () => {
    console.log("🌐 Web Sunucusu Aktif.");
    
    // Her 5 dakikada bir Render'ı dürterek botun uykuya dalmasını engeller
    setInterval(() => {
        const url = `http://localhost:${process.env.PORT || 3000}`;
        http.get(url).on('error', (e) => { console.log("Ping döngüsü çalışıyor."); });
    }, 300000); 
});

client.login(process.env.DISCORD_BOT_TOKEN);
