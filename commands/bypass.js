const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('PlatoBoost ve diğer zorlu linkleri gerçek tarayıcıyla geçer.')
        .addStringOption(o => o.setName('link').setDescription('Bypass edilecek link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        
        // Botun "düşünüyor..." kısmında takılmaması için ilk yanıtı veriyoruz
        await interaction.deferReply({ ephemeral: true });

        const browser = await puppeteer.launch({
            headless: "new", // Render'da sorun çıkmaması için yeni headless modu
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

            // 1. Siteye Git
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // 2. PlatoBoost "Checkpoint" Atlatma
            // Genelde "LootLabs" veya "Free Access" butonları olur
            await page.evaluate(async () => {
                const delay = ms => new Promise(res => setTimeout(res, ms));
                
                // Sayfadaki tüm butonları tara ve reklam geçişlerini tetikle
                const buttons = Array.from(document.querySelectorAll('button, a'));
                const skipBtn = buttons.find(b => 
                    b.innerText.toLowerCase().includes('free access') || 
                    b.innerText.toLowerCase().includes('get key')
                );
                
                if (skipBtn) skipBtn.click();
            });

            // Bekleme süresi (Reklamların yüklenmesi için)
            await new Promise(r => setTimeout(r, 7000));

            // 3. Key'i veya Hedef URL'yi Yakala
            const pageText = await page.evaluate(() => document.body.innerText);
            const currentUrl = page.url();

            // Eğer Key sayfada yazıyorsa onu bulalım
            const keyMatch = pageText.match(/[a-zA-Z0-9]{15,45}/); // Genelde 15+ karakterlik bir koddur
            const result = keyMatch ? keyMatch[0] : (currentUrl !== url ? currentUrl : "Key henüz oluşmadı, tekrar dene.");

            const embed = new EmbedBuilder()
                .setTitle('🔓 PlatoBoost Bypass Tamamlandı')
                .setColor('#5865F2')
                .addFields(
                    { name: '🔑 Alınan Key', value: `\`\`\`${result}\`\`\`` },
                    { name: '🌐 Son Konum', value: `[Sayfaya Git](${currentUrl})` }
                )
                .setFooter({ text: 'Aethelgard Sunucu Kopyalayıcı | Güçlü Mod' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Bypass Hatası:", error);
            await interaction.editReply({ content: '❌ **Hata:** Site botu engelledi veya Render RAM sınırına ulaştı.' });
        } finally {
            await browser.close();
        }
    }
};
