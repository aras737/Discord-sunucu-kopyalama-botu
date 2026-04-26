require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    ApplicationCommandOptionType 
} = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers // Üyeleri kontrol etmek için bu şart!
    ] 
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = "1394574380394221719"; 
const OWNER_ID = "1389930042200559706"; // Senin ID'n

const commands = [
    {
        name: 'spam',
        description: 'Hızlı mesaj gönderir (Koruma sistemi devrede).',
        integration_types: [1],
        contexts: [0, 1, 2],
        options: [
            {
                name: 'mesaj',
                description: 'Gönderilecek metin',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'miktar',
                description: 'Kaç adet gönderilecek?',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                min_value: 1,
                max_value: 100
            }
        ]
    }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Aethelgard Bölge Koruması Aktif!');
    } catch (error) {
        console.error(error);
    }
})();

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'spam') {
        const { guild, user } = interaction;

        // 🛡️ BÖLGE KORUMASI MANTIĞI
        if (guild) {
            // Eğer komutu kullanan SEN DEĞİLSEN, senin o sunucuda olup olmadığını kontrol et
            if (user.id !== OWNER_ID) {
                // Botun olduğu bir sunucudaysak üyeleri kontrol et
                const isOwnerInServer = guild.members.cache.has(OWNER_ID) || 
                                       await guild.members.fetch(OWNER_ID).catch(() => null);

                if (isOwnerInServer) {
                    return interaction.reply({ 
                        content: "❌ **Erişim Engellendi:** Bu sunucuda sahibim bulunuyor. Burada benden sadece o emir alabilir!", 
                        ephemeral: true 
                    });
                }
            }
        }

        // Komutu kullanan sensen veya senin olmadığın bir sunucuysa devam et
        const mesaj = interaction.options.getString('mesaj');
        const miktar = interaction.options.getInteger('miktar');

        await interaction.reply({ content: `⚡ İşlem senin için başlatıldı kanka...`, ephemeral: true });

        for (let i = 0; i < miktar; i++) {
            try {
                await interaction.channel.send(mesaj);
                await new Promise(resolve => setTimeout(resolve, 300)); 
            } catch (err) {
                break;
            }
        }
    }
});

client.login(TOKEN);
