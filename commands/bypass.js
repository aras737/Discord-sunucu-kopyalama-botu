const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Siteye girer, reklamları atlar ve keyi çeker.')
        .addStringOption(o => o.setName('link').setDescription('Reklamlı link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');

        // 1. ADIM: Discord'a "Bekle, işlem uzun sürecek" diyoruz (Zaman aşımını engeller)
        await interaction.deferReply({ ephemeral: true });

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

            // 2. ADIM: Siteye giriş ve agresif bekleme
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // PlatoBoost/Linkvertise geçiş butonlarını tetikle
            await page.evaluate(async () => {
                const btns = Array.from(document.querySelectorAll('button, a'));
                const target = btns.find(b => 
                    b.innerText.toLowerCase().includes('free access') || 
                    b.innerText.toLowerCase().includes('get key')
                );
                if (target) target.click();
            });

            // Reklamların geçilmesi için 8 saniye zorunlu bekleme
            await new Promise(r => setTimeout(r, 8000)); 

            // 3. ADIM: Key'i yakala
            const pageText = await page.evaluate(() => document.body.innerText);
            const keyMatch = pageText.match(/[a-zA-Z0-9]{15,45}/); 
            const finalKey = keyMatch ? keyMatch[0] : "Key bulunamadı veya site henüz yönlendirmedi.";

            const embed = new EmbedBuilder()
                .setTitle('🔓 Bypass Başarılı')
                .setColor('#00ff00')
                .addFields(
                    { name: '🔑 Alınan Key', value: `\`\`\`${finalKey}\`\`\`` },
                    { name: '🌐 Hedef URL', value: `[Linke Git](${page.url()})` }
                )
                .setFooter({ text: 'Aethelgard Agresif Motor' });

            // 4. ADIM: interaction.reply yerine editReply kullanıyoruz (deferReply kullandığımız için)
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Bypass Hatası:", error);
            await interaction.editReply({ content: '❌ **Hata:** Tarayıcı motoru siteyi geçemedi veya RAM doldu.' });
        } finally {
            await browser.close();
        }
    }
};
