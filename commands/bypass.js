const { 
    SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ActionRowBuilder, EmbedBuilder, InteractionType 
} = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Delta ve PlatoRelay linklerini yerel tarayıcı motoru ile çözer.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 10 * 1000;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ content: `❌ | Lütfen tekrar denemeden önce ${timeLeft.toFixed(1)} saniye bekleyin.`, ephemeral: true });
            }
        }

        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    await int.deferReply({ ephemeral: true });
                    await int.editReply({ content: `<a:loading:1507818079776935966> **Zen Engine: Yerel tarayıcı motoru ayağa kaldırılıyor...**` });

                    const url = int.fields.getTextInputValue('urlInput').trim();
                    const browser = await puppeteer.launch({
                        headless: "new",
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-blink-features=AutomationControlled']
                    });

                    try {
                        const page = await browser.newPage();
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
                        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

                        await int.editReply({ content: `<a:loading:1507818079776935966> **Zen Engine: Sayfa analiz ediliyor, reklamlar manipüle ediliyor...**` });

                        const finalKey = await page.evaluate(async () => {
                            if (window.checkpointData) return window.checkpointData.key || null;
                            const btns = Array.from(document.querySelectorAll('button, a'));
                            const skipBtn = btns.find(b => b.innerText.toLowerCase().includes('free access') || b.innerText.toLowerCase().includes('get key') || b.innerText.toLowerCase().includes('continue'));
                            if (skipBtn) skipBtn.click();
                            return null;
                        });

                        await new Promise(r => setTimeout(r, 7000));
                        const currentUrl = page.url();
                        const pageText = await page.evaluate(() => document.body.innerText);

                        const keyMatch = pageText.match(/[a-zA-Z0-9]{20,40}/) || currentUrl.match(/key=([^&]+)/);
                        const resultKey = keyMatch ? (typeof keyMatch === 'string' ? keyMatch : keyMatch[0]) : null;

                        const embed = new EmbedBuilder()
                            .setTitle('🔓 Zen Yerel Bypass Sistemi')
                            .setColor('#00ffb3')
                            .addFields(
                                { name: '🔑 Sonuç / Anahtar', value: `\`\`\`${resultKey || "Anahtar doğrudan metinde yakalanamadı, sayfayı kontrol edin."}\`\`\`` },
                                { name: '🌐 Son Yönlendirilen Adres', value: `[Bağlantıya Git](${currentUrl})` }
                            )
                            .setTimestamp();

                        await int.editReply({ content: null, embeds: [embed] });
                    } catch (error) {
                        console.error(error);
                        await int.editReply({ content: '❌ **Bypass Başarısız:** Tarayıcı motoru sayfayı işleyemedi.' });
                    } finally {
                        await browser.close();
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        const modal = new ModalBuilder().setCustomId('bypassModal').setTitle('Zen Yerel Bypass');
        const urlInput = new TextInputBuilder().setCustomId('urlInput').setLabel("Bypass edilecek URL").setStyle(TextInputStyle.Short).setPlaceholder('https://auth.platorelay.com/...').setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        await interaction.showModal(modal);
    }
};
