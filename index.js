require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');

// 1. BOT AYARLARI VE İZİNLER
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();
client.slashCommands = [];

// 2. KOMUTLARI TARA VE YÜKLE
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
        }
    }
}

// 3. HAZIR OLMA VE SLASH KAYDI
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Tekrar Sahada!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: client.slashCommands });
        console.log("✨ Tüm komutlar senkronize edildi.");
    } catch (error) {
        console.error("❌ Kayıt Hatası:", error);
    }
});

// 4. ETKİLEŞİM YÖNETİMİ
client.on('interactionCreate', async (interaction) => {
    // A. SLASH KOMUTLARINI ÇALIŞTIR
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

    // B. VİDEODAKİ BYPASS MODAL YANITI (EKLEDİĞİMİZ KISIM)
    if (interaction.isModalSubmit() && interaction.customId === 'bypassModal') {
        const url = interaction.fields.getTextInputValue('urlInput');
        await interaction.deferReply({ ephemeral: false });

        // Videodaki key ve tasarımın aynısı
        const mockKey = "FREE_8C114EDFA55888FF6D5DC7775A584C69";

        const embed = new EmbedBuilder()
            .setTitle('✅ Bypass Success')
            .setColor(0x2f3136) // Koyu Discord Grisi
            .setDescription(`Your key has been retrieved. Copy it and input it into the application.\n\n\`\`\`${mockKey}\`\`\``)
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('result').setLabel('Result').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('server').setLabel('Server').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setLabel('Website').setStyle(ButtonStyle.Link).setURL('https://google.com') // Buraya kendi siteni koy
        );

        await interaction.editReply({ embeds: [embed], components: [buttons] });
    }

    // C. DESTEK SİSTEMİ BUTONLARI
    const supportCmd = client.commands.get('destek-kur');
    if (supportCmd && supportCmd.interactionHandler) {
        try { await supportCmd.interactionHandler(interaction); } catch (err) {}
    }
});

// 5. MESAJ TABANLI KOMUTLAR (!kur, !sorgu)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command && !command.data) {
        try { await command.execute(message, args); } catch (error) {
            message.reply("❌ Komut uygulanırken hata oluştu!");
        }
    }
});

// 6. SİSTEMİ AYAKTA TUT
process.on('unhandledRejection', e => console.log('🛑 Kritik Hata (Red):', e));
process.on('uncaughtException', e => console.log('🛑 Kritik Hata (Ex):', e));

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("SYSTEM ONLINE");
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
