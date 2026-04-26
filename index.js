const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  InteractionType,
} = require('discord.js');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN; // Railway/Koyeb'e girdiğin ana bot tokeni

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const RL_DELAY = 1200; // Hız sınırı koruması

client.on('messageCreate', async (message) => {
  if (message.content !== '!kur') return;

  const embed = new EmbedBuilder()
    .setColor('#f0f0f0')
    .setTitle('⚙️ Json Sunucu Kopyalama')
    .setDescription(
      '**Gelişmiş Klonlama Sistemi**\n' +
      'Bu araç ile istediğiniz sunucunun tüm kanal, rol ve izin yapılarını saniyeler içerisinde hedef sunucuya aktarabilirsiniz.\n\n' +
      '🟡 **Klonlanan İçerikler:**\n' +
      '• Tüm Roller ve İzinler\n• Tüm Kategoriler ve Kanallar\n• Kanal Pozisyonları ve İzinleri\n• Sunucu Adı ve İkonu\n\n' +
      '🔴 **Önemli Uyarı:**\n' +
      'Hedef sunucudaki tüm eski kanal ve roller **kalıcı olarak silinecektir!**'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('baslat')
      .setLabel('Başlat')
      .setEmoji('🚫')
      .setStyle(ButtonStyle.Danger)
  );

  await message.channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton() && interaction.customId === 'baslat') {
    const modal = new ModalBuilder().setCustomId('copy_modal').setTitle('Sunucu Kopyalama - Bilgiler');

    const inputs = [
      { id: 'token', label: 'Hesap Tokeni (Self)', ph: 'Aynalandığı hesap tokeni...' },
      { id: 'source', label: 'Kaynak Sunucu ID', ph: 'Kopyalanacak sunucunun ID...' },
      { id: 'target', label: 'Hedef Sunucu ID', ph: 'Aktarılacak sunucunun ID...' },
      { id: 'old_name', label: 'Değişecek İsim (Eski)', ph: 'Örn: dievas', req: false },
      { id: 'new_name', label: 'Yeni İsim (Yeni)', ph: 'Örn: dievas', req: false }
    ];

    inputs.forEach(i => {
      const input = new TextInputBuilder()
        .setCustomId(i.id)
        .setLabel(i.label)
        .setPlaceholder(i.ph)
        .setStyle(TextInputStyle.Short)
        .setRequired(i.req !== false);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    await interaction.reply({ content: '✅ İşlem başlatıldı...', ephemeral: true });
    // Klonlama fonksiyonuna verileri gönderiyoruz
  }
});

client.login(BOT_TOKEN);
