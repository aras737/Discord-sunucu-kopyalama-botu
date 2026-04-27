require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    REST, 
    Routes, 
    Events 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// --- AYARLAR ---
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = '1394574380394221719';
const OWNER_ID = "1389930042200559706";
const PREFIX = '!'; // !kur gibi komutlar için

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Komut depolama
client.commands = new Collection();
const slashCommands = [];

// --- KOMUTLARI OTOMATİK YÜKLEME (Akıllı Tarama) ---
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath);

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Slash Komut mu yoksa Mesaj Komutu mu?
    if ('data' in command && 'execute' in command) {
        // Slash komutu (Örn: /sorgu, /spam)
        client.commands.set(command.data.name, command);
        slashCommands.push(command.data.toJSON());
    } else if ('name' in command && 'execute' in command) {
        // Mesaj komutu (Örn: !kur)
        client.commands.set(command.name, command);
    }
}

// --- BOT HAZIR OLDUĞUNDA ---
client.once(Events.ClientReady, async (c) => {
    console.log(`🚀 Sistem Başlatıldı!`);
    console.log(`🤖 Giriş Yapılan Bot: ${c.user.tag}`);
    console.log(`📂 Yüklenen Komut Sayısı: ${client.commands.size}`);

    // Slash komutlarını Discord API'ye kaydet
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands });
        console.log('✅ Slash komutları global olarak senkronize edildi.');
    } catch (error) {
        console.error('❌ Komut yükleme hatası:', error);
    }
});

// --- ETKİLEŞİM YÖNETİMİ (Slash, Buton, Modal) ---
client.on(Events.InteractionCreate, async (interaction) => {
    // Slash Komut Çalıştırıcı
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Bu komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        }
    }
    
    // Not: Buton ve Modal eventleri komut dosyalarının (sorgu.js, kur.js) 
    // içinde "collector" veya "interactionCreate" dinleyicisi olarak çalıştığı için 
    // burayı kalabalıklaştırmıyoruz. Akıllı yönetim bunu gerektirir!
});

// --- MESAJ KOMUTLARI YÖNETİMİ (!kur vb.) ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = PREFIX + args.shift().toLowerCase(); // "!kur" haline getirir

    const command = client.commands.get(commandName);
    if (!command) return;

    // Yetki Kontrolü (Sadece sahip kullanabilsin diyorsan)
    if (commandName === '!kur' && message.author.id !== OWNER_ID) {
        return message.reply('❌ Bu komutu sadece bot sahibi kullanabilir.');
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Komut yürütülürken bir hata oluştu.');
    }
});

// --- GLOBAL HATA YAKALAYICI (Botun Kapanmasını Önler) ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Yakalanmayan Hata:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('🚫 Kritik Hata (Bot Durdurulmadı):', err);
});

// --- GİRİŞ ---
client.login(TOKEN).catch(err => {
    console.error('❌ Giriş Başarısız: Token geçersiz olabilir.');
});
