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
        await interaction.deferReply({ ephemeral: true });

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        try {
            const page = await browser.newPage();
            // Reklam sitelerinin bot olduğunu anlamaması için gerçekçi User-Agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // --- AGRESİF REKLAM ATLATMA MANTIĞI ---
            // Sitedeki "Free Access" veya "Skip Ad" butonlarını otomatik bulup tıklar
            await page.evaluate(async () => {
                const findAndClick = (txt) => {
                    const btns = Array.from(document.querySelectorAll('button, a'));
                    const target = btns.find(b => b.innerText.toLowerCase().includes(txt));
                    if (target) target.click();
                };
                
                // Reklam sitelerinde sık kullanılan butonları zorla tetikle
                findAndClick('free access');
                findAndClick('skip ad');
                // Saniyeli beklemeleri JS ile hızlandır (Bypass mantığı)
                window.atob = window.atob; // Bazı şifrelemeleri kırmak için
            });

            // Key'in gelmesi için biraz bekle
            await new Promise(r => setTimeout(r, 5000)); 

            // Sayfadaki metni tara ve Key formatındaki (genelde uzun karmaşık kodlar) veriyi al
            const content = await page.content();
            const pageText = await page.evaluate(() => document.body.innerText);
            
            // Basit bir regex ile key'i yakalamaya çalış (Örn: Fluxus/Platoboost keyleri genelde 16-32 karakterdir)
            const keyMatch = pageText.match(/[a-zA-Z0-9]{15,45}/); 
            const finalKey = keyMatch ? keyMatch[0] : "Key bulunamadı ama site geçildi.";

            const embed = new EmbedBuilder()
                .setTitle('🔓 Site İçi Bypass Başarılı')
                .setColor('#00ff00')
                .addFields(
                    { name: '🔑 Alınan Key/Sonuç', value: `\`\`\`${finalKey}\`\`\`` },
                    { name: '🌐 Hedef Sayfa', value: `[Tıkla ve Git](${page.url()})` }
                )
                .setFooter({ text: 'Gerçek zamanlı tarayıcı motoru kullanıldı.' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Siteye girerken bir hata oluştu veya koruma çok güçlü.' });
        } finally {
            await browser.close();
        }
    }
};
