const { 
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
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.kurListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_kur_setup' || int.customId === 'modal_kur_setup') {
                    await this.handleInteraction(int);
                }
            });
            client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setAuthor({ name: 'FORCES Sunucu Taşıma Sistemi' })
            .setTitle('🚀 Kurulum Sihirbazı')
            .setDescription('Self-bot kullanarak bir sunucuyu diğerine kopyalar.\n\n**Gerekli Bilgiler:**\n▫️ Self Token\n▫️ Kaynak Sunucu ID\n▫️ Hedef Sunucu ID');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_kur_setup')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_kur_setup') {
            const modal = new ModalBuilder().setCustomId('modal_kur_setup').setTitle('Klonlama Bilgileri');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('tkn').setLabel('Self-Bot Token').setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('src').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('trg').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                )
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_kur_setup') {
            await interaction.deferReply({ ephemeral: true });

            const token = interaction.fields.getTextInputValue('tkn');
            const sourceId = interaction.fields.getTextInputValue('src');
            const targetId = interaction.fields.getTextInputValue('trg');

            const targetGuild = interaction.client.guilds.cache.get(targetId);
            if (!targetGuild) return interaction.editReply('❌ Hedef sunucuyu bulamadım. Botun orada yönetici olması lazım!');

            const self = new SelfClient({ checkUpdate: false });

            self.on('ready', async () => {
                try {
                    const sourceGuild = self.guilds.cache.get(sourceId);
                    if (!sourceGuild) return interaction.editReply('❌ Self-bot kaynak sunucuda bulunmuyor!');

                    await interaction.editReply('🔄 Temizlik başladı...');

                    // 1. Hedef Sunucu Temizliği
                    const targetChans = await targetGuild.channels.fetch();
                    for (const c of targetChans.values()) await c.delete().catch(() => {});

                    await interaction.editReply('🏗️ Kanallar inşa ediliyor...');

                    // 2. Kanalları Kopyala (v13 self -> v14 bot)
                    const sourceChans = sourceGuild.channels.cache.sort((a, b) => a.position - b.position);
                    
                    // Önce Kategoriler
                    const cats = sourceChans.filter(c => c.type === 'GUILD_CATEGORY' || c.type === 4);
                    for (const cat of cats.values()) {
                        const newCat = await targetGuild.channels.create({ name: cat.name, type: 4 });

                        // Alt Kanallar
                        const children = sourceChans.filter(c => c.parentId === cat.id);
                        for (const child of children.values()) {
                            let type = (child.type === 'GUILD_VOICE' || child.type === 2) ? 2 : 0;
                            await targetGuild.channels.create({
                                name: child.name,
                                type: type,
                                parent: newCat.id
                            });
                            await new Promise(r => setTimeout(r, 700));
                        }
                    }
                    
                    await interaction.editReply('✅ Kopyalama tamamlandı!');
                    self.destroy();
                } catch (err) {
                    await interaction.editReply('Hata: ' + err.message);
                    self.destroy();
                }
            });

            self.login(token).catch(() => interaction.editReply('❌ Token hatalı!'));
        }
    }
};
