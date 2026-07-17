const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rblx-kopyala')
        .setDescription('Roblox üzerindeki varlıkları (Ses, Animasyon, Model) kopyalar ve indirir.')
        .addStringOption(option =>
            option.setName('tip')
                .setDescription('Kopyalamak istediğiniz varlık türü')
                .setRequired(true)
                .addChoices(
                    { name: '🎵 Ses / Müzik (Audio)', value: 'sound' },
                    { name: '🏃 Animasyon (Animation)', value: 'animation' },
                    { name: '📦 Model / Mesh / Kıyafet', value: 'model' }
                ))
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Roblox Varlık (Asset) ID\'si')
                .setRequired(true)),

    async execute(interaction) {
        const type = interaction.options.getString('tip');
        const assetId = interaction.options.getString('id').trim();

        // Sayı kontrolü
        if (!/^\d+$/.test(assetId)) {
            return interaction.reply({ 
                content: '❌ Lütfen geçerli bir Roblox ID\'si girin (Sadece sayılardan oluşmalıdır).', 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        try {
            // Roblox Asset Delivery API
            const robloxApiUrl = `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`;
            const response = await fetch(robloxApiUrl);

            if (!response.ok) {
                return interaction.editReply({ content: '❌ Roblox API\'sine bağlanırken bir sorun oluştu.' });
            }

            const buffer = await response.buffer();

            // Dosya doğrulama (Eğer çok küçükse büyük ihtimalle boş veya gizlidir)
            if (buffer.length < 100) {
                return interaction.editReply({ 
                    content: '❌ Bu ID\'ye ait veri bulunamadı veya varlık gizli/silinmiş.' 
                });
            }

            let fileName = '';
            let fileTitle = '';
            let fileEmoji = '';

            // Seçilen tipe göre dosya uzantısını ve başlığı ayarlıyoruz
            switch (type) {
                case 'sound':
                    fileName = `roblox_sound_${assetId}.mp3`;
                    fileTitle = 'Ses / Müzik İndirildi';
                    fileEmoji = '🔊';
                    break;
                case 'animation':
                    fileName = `roblox_anim_${assetId}.rbxm`; // Roblox Studio'ya sürükle-bırak yapılabilir
                    fileTitle = 'Animasyon Verisi Kopyalandı';
                    fileEmoji = '🏃';
                    break;
                case 'model':
                    fileName = `roblox_model_${assetId}.rbxm`; // Mesh, Model veya Nesne dosyası
                    fileTitle = 'Model / Nesne Kopyalandı';
                    fileEmoji = '📦';
                    break;
            }

            const attachment = new AttachmentBuilder(buffer, { name: fileName });

            const embed = new EmbedBuilder()
                .setColor('#00aaff')
                .setTitle(`${fileEmoji} Roblox ${fileTitle}!`)
                .setDescription(`İstediğin varlık Roblox sunucularından başarıyla kopyalandı. İndirdiğin dosyayı direkt kullanabilirsin.`)
                .addFields(
                    { name: 'Varlık Tipi', value: `\`${type.toUpperCase()}\``, inline: true },
                    { name: 'Varlık ID', value: `\`${assetId}\``, inline: true },
                    { name: 'Bağlantı', value: `[Roblox Sayfası](https://www.roblox.com/library/${assetId})`, inline: false }
                )
                .setFooter({ text: 'Roblox Asset Downloader & Cloner' })
                .setTimestamp();

            // Animasyon ve Model için Roblox Studio hatırlatması ekleyelim
            if (type === 'animation' || type === 'model') {
                embed.addFields({ 
                    name: '💡 Nasıl Kullanılır?', 
                    value: 'İndirdiğin `.rbxm` dosyasını direkt olarak açık olan **Roblox Studio** ekranının içine sürükleyip bırakarak (import) kullanabilirsin.' 
                });
            }

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Kopyalama hatası:', error);
            await interaction.editReply({ content: '❌ Dosya kopyalanırken teknik bir hata meydana geldi.' });
        }
    },
};
