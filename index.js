require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios'); // GERÇEK BYPASS İÇİN LAZIM

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();
client.slashCommands = [];

// Komut Yükleme Mantığı (Senin Mevcut Yapın)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.name) client.commands.set(command.name, command);
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
        }
    }
}

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} SAHADA VE GERÇEK BYPASS AKTİF!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: client.slashCommands });
    } catch (error) { console.error(error); }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // --- GERÇEK BYPASS MODAL YANITI ---
    if (interaction.isModalSubmit() && interaction.customId === 'bypassModal') {
        const url = interaction.fields.getTextInputValue('urlInput');
        
        // Kullanıcıya işlemin başladığını göster
        await interaction.deferReply({ ephemeral: false });

        try {
            /* 
               2026'nın en stabil bypass API'sini kullanıyoruz.
               Not: Bazı API'ler günlük limit koyabilir. Eğer 'api.bypass.vip' 
               yanıt vermezse alternatif olarak 'api.ethone.live' denenebilir.
            */
            const apiUrl = `https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);

            // API'den gelen gerçek veri (Status check)
            if (response.data.status === "success") {
                const realKey = response.data.result; // Gerçek çözülen link veya key

                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Success')
                    .setColor(0x2f3136)
                    .setDescription(`Your link has been successfully bypassed!\n\n**Result:**\n\`\`\`${realKey}\`\`\``)
                    .setTimestamp()
                    .setFooter({ text: 'Zen Bypass System • 2026' });

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('result').setLabel('Success').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setLabel('Go to Result').setStyle(ButtonStyle.Link).setURL(realKey.startsWith('http') ? realKey : 'https://google.com'),
                    new ButtonBuilder().setCustomId('server').setLabel('Support Server').setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({ embeds: [embed], components: [buttons] });
            } else {
                throw new Error("API could not bypass this link.");
            }

        } catch (error) {
            console.error("Bypass Error:", error.message);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Bypass Failed')
                .setColor(0xff4b4b)
                .setDescription(`Maalesef bu link çözülemedi.\n\n**Sebep:** Link geçersiz olabilir veya site koruması çok güçlü.\n**Link:** \`${url}\``)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});

// Anti-Crash & Uptime (Senin Mevcut Yapın)
process.on('unhandledRejection', e => console.log('🛑 Hata:', e));
http.createServer((req, res) => { res.writeHead(200); res.end("REAL SYSTEM ONLINE"); }).listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_BOT_TOKEN);
