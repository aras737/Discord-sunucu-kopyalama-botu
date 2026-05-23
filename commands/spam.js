const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Mesaj gönderim modunu seçin ve her yerde kontrolü elinize alın.')
        .addUserOption(o => o.setName('hedef').setDescription('Hedef kişi').setRequired(true))
        .addStringOption(o => o.setName('mesaj').setDescription('Gönderilecek metin').setRequired(true))
        .addStringOption(o => o.setName('mod')
            .setDescription('Gönderim tarzı')
            .setRequired(true)
            .addChoices(
                { name: '🚀 Hayvan Gibi (Tek Seferde Toplu)', value: 'toplu' },
                { name: '🎯 Tekli (Ben Bastıkça At)', value: 'tekli' }
            ))
        .addIntegerOption(o => o.setName('miktar').setDescription('Sadece toplu mod için miktar girin (Tekli modda 1 adet gider)').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const hedef = interaction.options.getUser('hedef');
        const mesaj = interaction.options.getString('mesaj');
        const mod = interaction.options.getString('mod');
        const miktar = interaction.options.getInteger('miktar') || 1;

        // Filtre delme (Ghost Mode)
        const ghostMesaj = mesaj.split('').join('\u200b');

        try {
            if (mod === 'tekli') {
                // İstediğin zaman tek tek atmak için mod
                await hedef.send(ghostMesaj);
                await interaction.editReply({ content: `🎯 **Tekli Atış Başarılı:** ${hedef.tag} hedefine 1 adet mesaj gönderildi. İstediğin an komutu tekrarla!` });
            } 
            
            else if (mod === 'toplu') {
                // Önceki agresif toplu fırlatma modu
                const spamHavuzu = [];
                for (let i = 0; i < miktar; i++) {
                    spamHavuzu.push(hedef.send(ghostMesaj).catch(() => {}));
                }
                await Promise.all(spamHavuzu);
                await interaction.editReply({ content: `🚀 **Toplu Fırlatma Bitti:** ${hedef.tag} hedefine ${miktar} adet mesaj aynı anda üflendi!` });
            }

        } catch (error) {
            await interaction.editReply({ content: `❌ **Hata:** Gönderim başarısız oldu (DM kapalı veya rate limit).` });
        }
    }
};
