require('dotenv').config();
const { 
    Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, ChannelType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = "1389930042200559706";

// --- KOMUTLAR ---
const commands = [
    new SlashCommandBuilder()
        .setName('kur-panel')
        .setDescription('Kopyalama ve Spam panelini açar.'),
    new SlashCommandBuilder()
        .setName('hizli-spam')
        .setDescription('Kanala hızlı mermi yağdırır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam içeriği').setRequired(true))
        .addIntegerOption(opt => opt.setName('adet').setDescription('Kaç adet?').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`☣️ FORCES ULTRA READY: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    // Sadece senin ID'n
    if (interaction.user.id !== OWNER_ID) return;

    // 1. PANEL KOMUTU
    if (interaction.isChatInputCommand() && interaction.commandName === 'kur-panel') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('👑 FORCES Ultra Sistem')
            .setDescription('Kopyalama ve Spam işlemleri için aşağıdaki butonu kullan.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_ultra_copy').setLabel('Sistemi Başlat').setStyle(ButtonStyle.Danger)
        );
        return interaction.reply({ embeds: [embed], components: [row] });
    }

    // 2. MODAL AÇILIŞI
    if (interaction.isButton() && interaction.customId === 'btn_ultra_copy') {
        const modal = new ModalBuilder().setCustomId('modal_ultra_copy').setTitle('Ultra Operasyon Bilgileri');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel('Self/Bot Token').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('s').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('h').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return await interaction.showModal(modal);
    }

    // 3. KLONLAMA VE SPAM MANTIĞI (MODAL SUBMIT)
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_ultra_copy') {
        await interaction.deferReply({ ephemeral: true });

        const token = interaction.fields.getTextInputValue('t');
        const srcId = interaction.fields.getTextInputValue('s');
        const trgId = interaction.fields.getTextInputValue('h');

        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const src = self.guilds.cache.get(srcId);
                const trg = self.guilds.cache.get(trgId);

                if (!src || !trg) return interaction.editReply('❌ Sunucu bulunamadı!');

                // --- FULL KLONLAMA (SENİN KODUNUN GELİŞTİRİLMİŞ HALİ) ---
                await interaction.editReply('🧹 Temizlik ve Klonlama başladı...');

                // Kanalları sil
                const targetChannels = await trg.channels.fetch();
                for (const c of targetChannels.values()) {
                    await c.delete().catch(() => {});
                    await new Promise(r => setTimeout(r, 500));
                }

                // Kanalları ve Kategorileri Oluştur (Gelişmiş Sıralama)
                const srcChans = await src.channels.fetch();
                const cats = srcChans.filter(c => c.type === 4 || c.type === 'GUILD_CATEGORY').sort((a,b) => a.position - b.position);

                for (const cat of cats.values()) {
                    const newCat = await trg.channels.create(cat.name, { type: 4 }).catch(() => null);
                    if(newCat) {
                        const children = srcChans.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                        for (const child of children.values()) {
                            await trg.channels.create(child.name, { 
                                type: child.type === 2 ? 2 : 0, 
                                parent: newCat.id 
                            }).catch(() => {});
                            await new Promise(r => setTimeout(r, 800));
                        }
                    }
                }

                await interaction.editReply('✅ Operasyon başarıyla tamamlandı.');
                self.destroy();
            } catch (err) {
                await interaction.editReply('❌ Hata: ' + err.message);
                self.destroy();
            }
        });

        self.login(token).catch(() => interaction.editReply('❌ Token hatalı.'));
    }

    // 4. HIZLI SPAM KOMUTU
    if (interaction.isChatInputCommand() && interaction.commandName === 'hizli-spam') {
        const mesaj = interaction.options.getString('mesaj');
        const adet = interaction.options.getInteger('adet');
        await interaction.reply({ content: `🔥 ${adet} mermi sürülüyor...`, ephemeral: true });

        for (let i = 0; i < adet; i++) {
            try {
                await interaction.channel.send(mesaj);
                await new Promise(r => setTimeout(r, 400));
            } catch (e) { break; }
        }
    }
});

// Render 7/24 Uyanık Tutucu
http.createServer((req, res) => res.end("Forces Online")).listen(process.env.PORT || 3000);
client.login(process.env.DISCORD_BOT_TOKEN);
