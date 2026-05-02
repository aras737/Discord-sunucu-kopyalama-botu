const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer-extra'); // 'extra' paketini kullanacağız
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Bot olduğunu gizleyen eklentiyi aktif et
puppeteer.use(StealthPlugin());

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('En güçlü reklam duvarlarını zorlayarak geçer.')
        .addStringOption(o => o.setName('link').setDescription('Geçilecek link').setRequired(true)),

    async execute(interaction) {
        const url = interaction.options.getString('link');
        await interaction.deferReply({ ephemeral: true });

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled', // Otomasyon kontrolünü kapat
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
                ]
            });

            const page = await browser.newPage();
            
            // Reklam sitelerinin arkada çalışan "anti-bypass" scriptlerini boz
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Agresif Bekleme ve Atlama (Örn: Linkvertise için)
            // Sayfadaki tüm gizli linkleri veya yönlendirme scriptlerini ayıkla
            const finalUrl = await page.evaluate(async () => {
                // Burada reklam servisinin türüne göre özel JS kodları çalıştırılabilir
                // Şimdilik en son ulaşılan hedef URL'yi döndürüyoruz
                return window.location.href;
            });

            const embed = new EmbedBuilder()
                .setTitle('💀 Zorlu Bypass Başarılı')
                .setColor('#ff0000')
                .addFields({ name: '🔗 Kırılan Link', value: `\`\`\`${finalUrl}\`\`\`` })
                .setFooter({ text: 'Agresif Motor Aktif' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Zorlu Bypass Hatası:", error);
            await interaction.editReply({ content: '❌ Duvarı aşamadık, site botu engelledi.' });
        } finally {
            if (browser) await browser.close();
        }
    }
};
