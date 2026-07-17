const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

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

        if (!/^\d+$/.test(assetId)) {
            return interaction.reply({ 
                content: '❌ Lütfen geçerli bir Roblox ID\'si girin (Sadece sayılardan oluşmalıdır).', 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        // Ortak Tarayıcı Başlıkları (Spoofing)
        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        };

        // Sırasıyla denenecek Roblox API URL'leri (Bypass amacıyla alternatifler eklenmiştir)
        const urlsToTry = [
            `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
            `https://roblox.com/asset/?id=${assetId}`,
            `https://www.roblox.com/asset/?id=${assetId}`
        ];

        let response = null;
        let successUrl = null;

        // URL'leri sırayla dene (Hangisi çalışırsa)
        for (const url of urlsToTry) {
            try {
                const res = await fetch(url, { method: 'GET', headers: requestHeaders });
                if (res.ok) {
                    const checkBuffer = await res.clone().arrayBuffer();
                    // Eğer dönen veri çok küçükse boş veya hata sayfasıdır, atla
                    if (checkBuffer.byteLength > 100) {
                        response = res;
                        successUrl = url;
                        break;
                    }
                }
            } catch (err) {
                console.log(`${url} adresi denenirken hata oluştu, diğerine geçiliyor...`);
            }
        }

        if (!response) {
            return interaction.editReply({ 
                content: '❌ Roblox API engeli aşılamadı. Sunucu IP adresi Roblox tarafından tamamen engellenmiş veya varlık gizli/silinmiş.' 
            });
        }

        try {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            let fileName = '';
            let fileTitle = '';
            let fileEmoji = '';

            switch (type) {
                case 'sound':
                    fileName = `roblox_sound_${assetId}.mp3`;
                    fileTitle = 'Ses / Müzik İndirildi';
                    fileEmoji = '🔊';
                    break;
                case 'animation':
                    fileName = `roblox_anim_${assetId}.rbxm`;
                    fileTitle = 'Animasyon Verisi Kopyalandı (Spoofed)';
                    fileEmoji = '🏃';
                    break;
                case 'model':
                    fileName = `roblox_model_${assetId}.rbxm`;
                    fileTitle = 'Model / Nesne Kopyalandı';
                    fileEmoji = '📦';
                    break;
            }

            const attachment = new AttachmentBuilder(buffer, { name: fileName });

            const embed = new EmbedBuilder()
                .setColor('#00ff77')
                .setTitle(`${fileEmoji} Roblox ${fileTitle}!`)
                .setDescription(`İstediğin varlık alternatif hatlar kullanılarak Roblox sunucularından başarıyla çekildi.`)
                .addFields(
                    { name: 'Varlık Tipi', value: `\`${type.toUpperCase()}\``, inline: true },
                    { name: 'Varlık ID', value: `\`${assetId}\``, inline: true },
                    { name: 'Kullanılan Hat', value: `\`API Spoof v2\``, inline: false },
                    { name: 'Bağlantı', value: `[Roblox Sayfası](https://www.roblox.com/library/${assetId})`, inline: false }
                )
                .setFooter({ text: 'Roblox Asset Downloader & Spoofer' })
                .setTimestamp();

            if (type === 'animation' || type === 'model') {
                embed.addFields({ 
                    name: '💡 Roblox Studio Notu', 
                    value: 'İndirdiğin `.rbxm` uzantılı dosyayı direkt olarak **Roblox Studio** projenin içerisine sürükleyip bırakarak (Import) entegre edebilirsin.' 
                });
            }

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Kopyalama hatası:', error);
            await interaction.editReply({ content: '❌ Dosya işlenirken teknik bir hata meydana geldi.' });
        }
    },
};
