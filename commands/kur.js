const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType,
    ChannelType 
} = require('discord.js');

module.exports = {
    name: '!kur',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        // --- AKILLI EVENT DİNLEYİCİ (Dosya İçi) ---
        if (!message.client.kurListenerSet) {
            message.client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_kur_baslat' || int.customId === 'modal_kur_config') {
                    await this.handleInteraction(int);
                }
            });
            message.client.kurListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛠️ Sunucu Kurulum Sistemi')
            .setDescription('Kaynak sunucudaki her şeyi (Kategoriler, Kanallar) buraya kopyalar.\n\n**Dikkat:** Önce mevcut kanallar silinecektir!')
            .setFooter({ text: 'FORCES Kopyalama Sistemi' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_kur_baslat')
                .setLabel('Kurulumu Başlat')
                .setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        // 1. BUTON: ID GİRİŞ MODALINI AÇ
        if (interaction.isButton() && interaction.customId === 'btn_kur_baslat') {
            const modal = new ModalBuilder().setCustomId('modal_kur_config').setTitle('Sunucu Klonla');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('kaynak_id')
                        .setLabel('Kaynak Sunucu ID')
                        .setPlaceholder('Kopyalanacak sunucunun IDsi')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );
            return await interaction.showModal(modal);
        }

        // 2. MODAL: SİLME VE KURMA İŞLEMİ
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_kur_config') {
            await interaction.deferReply({ ephemeral: true });

            const kaynakId = interaction.fields.getTextInputValue('kaynak_id');
            const kaynakSunucu = interaction.client.guilds.cache.get(kaynakId);
            const hedefSunucu = interaction.guild;

            if (!kaynakSunucu) return interaction.editReply('❌ Kaynak sunucuyu bulamadım (Botun orada da olması lazım).');

            try {
                await interaction.editReply('🔄 Eski kanallar temizleniyor...');
                
                // --- SİLME İŞLEMİ ---
                const eskiKanallar = await hedefSunucu.channels.fetch();
                for (const kanal of eskiKanallar.values()) {
                    await kanal.delete().catch(() => {});
                    await new Promise(r => setTimeout(r, 400)); // 0.4 sn bekle (Rate limit önleyici)
                }

                await interaction.editReply('🏗️ Kategoriler ve kanallar inşa ediliyor...');

                // --- KURMA İŞLEMİ ---
                const kaynakKanallar = await kaynakSunucu.channels.fetch();
                
                // Önce Kategorileri Kopyala
                const kategoriler = kaynakKanallar.filter(c => c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);

                for (const cat of kategoriler.values()) {
                    const yeniCat = await hedefSunucu.channels.create({
                        name: cat.name,
                        type: ChannelType.GuildCategory
                    });

                    // Kategorinin altındaki kanalları bul ve kur
                    const altKanallar = kaynakKanallar.filter(c => c.parentId === cat.id).sort((a, b) => a.position - b.position);
                    
                    for (const alt of altKanallar.values()) {
                        await hedefSunucu.channels.create({
                            name: alt.name,
                            type: alt.type,
                            parent: yeniCat.id
                        });
                        await new Promise(r => setTimeout(r, 600)); // Kurulum yaparken daha yavaş git ki Discord banlamasın
                    }
                }

                await interaction.editReply('✅ Sunucu başarıyla kopyalandı kanka!');

            } catch (err) {
                console.error(err);
                await interaction.editReply('❌ Bir hata oldu, botun yetkisi yetmiyor olabilir.');
            }
        }
    }
};
