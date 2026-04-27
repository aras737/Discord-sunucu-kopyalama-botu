const { Client, GatewayIntentBits, Collection, REST, Routes, InteractionType } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.DİSCORD_BOT_TOKENİ; // Railway değişkenin
const CLIENT_ID = '1394574380394221719'; // Senin Bot ID'n

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

// Komutları Yükle ve Kaydet
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
});

// Etkileşimler
client.on('interactionCreate', async (interaction) => {
    // 1. Slash Komut Çalıştırıcı
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // 2. Butona Basıldığında Modal Aç
    if (interaction.isButton() && interaction.customId === 'copy_trigger') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('copy_modal').setTitle('Klonlama Bilgileri');

        const tokenInput = new TextInputBuilder().setCustomId('self_token').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true);
        const sourceInput = new TextInputBuilder().setCustomId('source_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true);
        const targetInput = new TextInputBuilder().setCustomId('target_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(sourceInput),
            new ActionRowBuilder().addComponents(targetInput)
        );
        await interaction.showModal(modal);
    }

    // 3. Modal Formu Gönderildiğinde (Asıl Klonlama)
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'copy_modal') {
        const selfToken = interaction.fields.getTextInputValue('self_token');
        const sourceId = interaction.fields.getTextInputValue('source_id');
        const targetId = interaction.fields.getTextInputValue('target_id');

        await interaction.reply({ content: '⏳ İşlem başlatıldı, kanallar geziliyor...', ephemeral: true });

        const self = new SelfClient({ checkUpdate: false });

        self.on('ready', async () => {
            try {
                const source = self.guilds.cache.get(sourceId);
                const target = self.guilds.cache.get(targetId);

                if (!source || !target) return interaction.followUp({ content: '❌ Sunucu bulunamadı!', ephemeral: true });

                // HEDEF TEMİZLİK
                const tChannels = await target.channels.fetch();
                for (const c of tChannels.values()) await c.delete().catch(() => {});

                // KANAL KOPYALAMA + GÖRSELDEKİ "1" EFEKTİ
                const sChannels = await source.channels.fetch();
                const categories = sChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a,b) => a.position - b.position);

                for (const cat of categories.values()) {
                    const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                    const children = sChannels.filter(c => c.parentId === cat.id);
                    
                    for (const child of children.values()) {
                        const newChan = await target.channels.create(child.name, { 
                            type: child.type, 
                            parent: newCat.id 
                        });

                        // İNSAN MODU: "1" yazıp silme efekti
                        if (newChan.type === 'GUILD_TEXT') {
                            const m = await newChan.send("1");
                            setTimeout(() => m.delete().catch(() => {}), 1000);
                        }
                        // Discord banlamasın diye bekleme
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }

                await interaction.followUp({ content: '✅ Klonlama başarıyla bitti!', ephemeral: true });
                self.destroy();
            } catch (err) {
                console.error(err);
                self.destroy();
            }
        });

        self.login(selfToken).catch(() => interaction.followUp({ content: '❌ Token hatalı!', ephemeral: true }));
    }
});

client.login(TOKEN);
