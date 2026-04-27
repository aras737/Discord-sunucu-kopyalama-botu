const { Client, GatewayIntentBits, Collection, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Railway'deki değişken ve senin verdiğin Bot ID
const token = process.env.DİSCORD_BOT_TOKENİ;
const clientId = '1394574380394221719'; 

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

client.commands = new Collection();

// 1. KOMUTLARI DİSCORD'A KAYDETME İŞLEMİ (REGISTER)
const commands = [
    new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucu analizini ve kopyalamayı başlatır.')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('⏳ Slash komutları Discord\'a yükleniyor (Register işlemi)...');
        await rest.put(
            Routes.applicationCommands(clientId), // Senin Bot ID'n kullanılıyor
            { body: commands },
        );
        console.log('✅ BAŞARILI! /spam komutu Discord sistemine kaydedildi!');
    } catch (error) {
        console.error('KOMUT YÜKLENİRKEN HATA ÇIKTI:', error);
    }
})();

// 2. KOMUTLARI KLASÖRDEN OKUMA (Klasör yapısını kullanıyorsan)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
    }
}

// 3. BOT HAZIR OLDUĞUNDA
client.once(Events.ClientReady, c => {
    console.log(`🤖 Bot aktif ve giriş yaptı: ${c.user.tag}`);
});

// 4. ETKİLEŞİM YÖNETİMİ (Komutu çalıştıran kısım)
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Bu komutu çalıştırırken bir hata oluştu!', ephemeral: true });
    }
});

client.login(token);
