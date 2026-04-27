require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    Collection, 
    REST, 
    Routes, 
    InteractionType, 
    Events 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

// Railway Değişkeni ve Bot Kimliği
const TOKEN = process.env.DISCORD_BOT_TOKEN; 
const CLIENT_ID = '1394574380394221719';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// --- KOMUTLARI YÜKLE ---
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// --- BOT HAZIR OLDUĞUNDA ---
client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log(`✅ ${client.user.tag} aktif! Komutlar yüklendi.`);
    } catch (err) { console.error('Komut yükleme hatası:', err); }
});

// --- ANA ETKİLEŞİM YÖNETİMİ ---
client.on(Events.InteractionCreate, async (interaction) => {
    
    // 1. SLASH KOMUT ÇALIŞTIRICI
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // 2. BUTONA BASILDIĞINDA MODAL AÇMA (spam.js içindeki butonu yakalar)
    if (interaction.isButton() && interaction.customId === 'spam_modal_ac') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('klon_form').setTitle('Klonlama Sistemi');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('token').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('source').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('target').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    // 3. MODAL GÖNDERİLDİĞİNDE: KOPYALAMA VE SPAM İŞLEMİ
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'klon_form') {
        const selfToken = interaction.fields.getTextInputValue('token');
        const sId = interaction.fields.getTextInputValue('source');
        const tId = interaction.fields.getTextInputValue('target');

        await interaction.reply({ content: '☣️ **İşlem Başlatıldı.** Hedef sunucu imha ediliyor ve yeniden inşa ediliyor...', ephemeral: true });

        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sId);
                const target = self.guilds.cache.get(tId);

                if (!source || !target) return interaction.followUp({ content: '❌ Sunucu bulunamadı! Tokenin her iki sunucuda olduğundan emin ol.', ephemeral: true });

                // --- HEDEFİ TEMİZLE ---
                const tChannels = await target.channels.fetch();
                for (const c of tChannels.values()) await c.delete().catch(() => {});
                
                const tRoles = await target.roles.fetch();
                for (const r of tRoles.values()) {
                    if (!r.managed && r.name !== "@everyone") await r.delete().catch(() => {});
                }

                // --- ROLLERİ KOPYALA ---
                const sRoles = [...(await source.roles.fetch()).values()].sort((a,b) => a.position - b.position);
                for (const role of sRoles) {
                    if (role.managed || role.name === "@everyone") continue;
                    await target.roles.create({ name: role.name, color: role.color, permissions: role.permissions, hoist: role.hoist }).catch(() => {});
                }

                // --- KANALLARI KOPYALA VE SPAM YAP ---
                const sChannels = await source.channels.fetch();
                const categories = sChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a,b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = sChannels.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                    
                    for (const child of children.values()) {
                        const newChan = await target.channels.create(child.name, { type: child.type, parent: newCat.id });

                        // GÖRSELDEKİ SPAM EFEKTİ (1 yaz sil)
                        if (newChan.type === 'GUILD_TEXT') {
                            const m = await newChan.send("1").catch(() => {});
                            if (m) setTimeout(() => m.delete().catch(() => {}), 1200);
                        }
                        
                        // BAN KORUMASI: Her kanal için bekleme
                        await new Promise(r => setTimeout(r, 2200));
                    }
                }

                await interaction.followUp({ content: '✅ **İşlem Tamam!** Sunucu başarıyla klonlandı ve spamlandı.', ephemeral: true });
                self.destroy();
            } catch (err) {
                console.error(err);
                self.destroy();
            }
        });

        self.login(selfToken).catch(() => interaction.followUp({ content: '❌ Hatalı Self Token!', ephemeral: true }));
    }
});

// Çökmeyi önleme
process.on('unhandledRejection', error => console.error(error));

client.login(TOKEN).catch(e => console.log("Token geçersiz!"));
