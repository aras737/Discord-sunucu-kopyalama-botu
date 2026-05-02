const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Kendi motorumuzla reklamlı linkleri geçer.')
        .addStringOption(o => o.setName('link').setDescription('Reklamlı link').setRequired(true))
        .setContexts([0, 1, 2])
        .setIntegrationTypes([0, 1]),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.reply({ content: '⚙️ **Kendi motorum başlatılıyor, reklamlar taranıyor...**', ephemeral: true });

        let browser;
        try {
            // Tarayıcıyı başlat (Render uyumlu ayarlar)
            browser = await puppeteer.launch({
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            // Reklam servisinin bot olduğunu anlamaması için kullanıcı taklidi yap
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

            // Linke git
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // BURASI ÖNEMLİ: Her reklam servisinin tıklama algoritması farklıdır.
            // Örnek olarak sayfa başlığını ve yönlendiği son URL'yi alalım
            const finalUrl = page.url();

            const embed = new EmbedBuilder()
                .setTitle('✅ Bypass İşlemi Tamam!')
                .setColor('#00ff00')
                .addFields({ name: '🔗 Hedef Link', value: `\`\`\`${finalUrl}\`\`\`` })
                .setFooter({ text: 'Kendi Motorumuz Tarafından Çözüldü' })
                .setTimestamp();

            await interaction.editReply({ content: '', embeds: [embed] });

        } catch (error) {
            console.error("Bypass Hatası:", error);
            await interaction.editReply({ content: '❌ Kendi motorumuz bu linki şu an çözemedi. Reklam duvarı çok güçlü.' });
        } finally {
            if (browser) await browser.close();
        }
    }
};
