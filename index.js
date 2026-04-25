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
  PermissionsBitField,
} = require('discord.js');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('HATA: DISCORD_BOT_TOKEN ortam degiskeni bulunamadi.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const RL_DELAY = 1200;

client.once('ready', () => {
  console.log(`[BOT] Hazir: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.trim().toLowerCase() !== '!kur') return;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Sunucu Klonlama Sistemi')
    .setDescription(
      'Asagidaki **Baslat** butonuna basarak klonlama formunu acabilirsin.\n\n' +
        '> Form acildiginda;\n' +
        '> - Hesap Tokeni\n' +
        '> - Kaynak Sunucu ID\n' +
        '> - Hedef Sunucu ID\n\n' +
        'bilgilerini girmen yeterli.',
    )
    .setFooter({ text: 'Klonlayici v1' })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId('clone_start')
    .setLabel('Baslat')
    .setStyle(ButtonStyle.Success)
    .setEmoji('▶');

  const row = new ActionRowBuilder().addComponents(button);

  await message.channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === 'clone_start') {
      const modal = new ModalBuilder()
        .setCustomId('clone_modal')
        .setTitle('Sunucu Klonlama Formu');

      const tokenInput = new TextInputBuilder()
        .setCustomId('token')
        .setLabel('Hesap Tokeni')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Bot/Hesap tokeni')
        .setRequired(true);

      const sourceInput = new TextInputBuilder()
        .setCustomId('source')
        .setLabel('Kaynak Sunucu ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Klonlanacak sunucunun IDsi')
        .setRequired(true);

      const targetInput = new TextInputBuilder()
        .setCustomId('target')
        .setLabel('Hedef Sunucu ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Hedef sunucunun IDsi')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(tokenInput),
        new ActionRowBuilder().addComponents(sourceInput),
        new ActionRowBuilder().addComponents(targetInput),
      );

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'clone_modal') {
      await interaction.reply({
        content: 'Klonlama islemi baslatildi. Bu islem birkac dakika surebilir...',
        ephemeral: true,
      });

      const token = interaction.fields.getTextInputValue('token').trim();
      const sourceId = interaction.fields.getTextInputValue('source').trim();
      const targetId = interaction.fields.getTextInputValue('target').trim();

      runCloner({ token, sourceId, targetId, interaction }).catch(async (err) => {
        console.error('[CLONER] Hata:', err);
        try {
          await interaction.followUp({
            content: `Hata olustu: \`${err.message || err}\``,
            ephemeral: true,
          });
        } catch (_) {}
      });
    }
  } catch (err) {
    console.error('[INTERACTION] Hata:', err);
    if (interaction.isRepliable()) {
      try {
        await interaction.reply({
          content: `Beklenmeyen hata: \`${err.message || err}\``,
          ephemeral: true,
        });
      } catch (_) {}
    }
  }
});

async function runCloner({ token, sourceId, targetId, interaction }) {
  const worker = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  const ready = new Promise((resolve, reject) => {
    worker.once('ready', () => resolve());
    worker.once('error', reject);
  });

  await worker.login(token);
  await ready;

  const status = async (msg) => {
    console.log('[CLONER]', msg);
    try {
      await interaction.followUp({ content: msg, ephemeral: true });
    } catch (_) {}
  };

  try {
    const source = await worker.guilds.fetch(sourceId);
    const target = await worker.guilds.fetch(targetId);

    await source.roles.fetch();
    await source.channels.fetch();
    await target.roles.fetch();
    await target.channels.fetch();

    await status(`Kaynak: **${source.name}** | Hedef: **${target.name}**`);

    await status('Hedef sunucu temizleniyor...');
    await wipeTarget(target);

    await status('Roller klonlaniyor...');
    const roleMap = await cloneRoles(source, target);

    await status('Kategoriler klonlaniyor...');
    const categoryMap = await cloneCategories(source, target, roleMap);

    await status('Kanallar klonlaniyor...');
    await cloneChannels(source, target, roleMap, categoryMap);

    await status('Klonlama tamamlandi.');
  } finally {
    worker.destroy();
  }
}

async function wipeTarget(target) {
  const channels = [...target.channels.cache.values()];
  for (const ch of channels) {
    try {
      await ch.delete('Klonlama oncesi temizlik');
      await sleep(RL_DELAY);
    } catch (err) {
      console.warn('[WIPE] Kanal silinemedi:', ch.name, err.message);
    }
  }

  const me = await target.members.fetchMe();
  const myTop = me.roles.highest.position;
  const roles = [...target.roles.cache.values()].sort(
    (a, b) => b.position - a.position,
  );
  for (const role of roles) {
    if (role.id === target.id) continue;
    if (role.managed) continue;
    if (role.position >= myTop) continue;
    try {
      await role.delete('Klonlama oncesi temizlik');
      await sleep(RL_DELAY);
    } catch (err) {
      console.warn('[WIPE] Rol silinemedi:', role.name, err.message);
    }
  }
}

async function cloneRoles(source, target) {
  const map = new Map();
  const everyone = source.roles.everyone;
  map.set(everyone.id, target.roles.everyone.id);

  try {
    await target.roles.everyone.setPermissions(everyone.permissions);
    await sleep(RL_DELAY);
  } catch (err) {
    console.warn('[ROL] @everyone izinleri ayarlanamadi:', err.message);
  }

  const roles = [...source.roles.cache.values()]
    .filter((r) => r.id !== source.id && !r.managed)
    .sort((a, b) => a.position - b.position);

  for (const role of roles) {
    try {
      const created = await target.roles.create({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        permissions: role.permissions,
        mentionable: role.mentionable,
        reason: 'Klonlama',
      });
      map.set(role.id, created.id);
      await sleep(RL_DELAY);
    } catch (err) {
      console.warn('[ROL] Olusturulamadi:', role.name, err.message);
    }
  }

  return map;
}

function buildOverwrites(source, roleMap) {
  const overwrites = [];
  for (const overwrite of source.permissionOverwrites.cache.values()) {
    if (overwrite.type !== 0) continue;
    const newId = roleMap.get(overwrite.id);
    if (!newId) continue;
    overwrites.push({
      id: newId,
      allow: overwrite.allow.bitfield,
      deny: overwrite.deny.bitfield,
      type: 0,
    });
  }
  return overwrites;
}

async function cloneCategories(source, target, roleMap) {
  const map = new Map();
  const categories = [...source.channels.cache.values()]
    .filter((c) => c.type === ChannelType.GuildCategory)
    .sort((a, b) => a.position - b.position);

  for (const cat of categories) {
    try {
      const created = await target.channels.create({
        name: cat.name,
        type: ChannelType.GuildCategory,
        position: cat.position,
        permissionOverwrites: buildOverwrites(cat, roleMap),
        reason: 'Klonlama',
      });
      map.set(cat.id, created.id);
      await sleep(RL_DELAY);
    } catch (err) {
      console.warn('[KATEGORI] Olusturulamadi:', cat.name, err.message);
    }
  }

  return map;
}

async function cloneChannels(source, target, roleMap, categoryMap) {
  const channels = [...source.channels.cache.values()]
    .filter((c) => c.type !== ChannelType.GuildCategory)
    .sort((a, b) => a.rawPosition - b.rawPosition);

  for (const ch of channels) {
    const supported = [
      ChannelType.GuildText,
      ChannelType.GuildVoice,
      ChannelType.GuildAnnouncement,
      ChannelType.GuildStageVoice,
      ChannelType.GuildForum,
    ];
    if (!supported.includes(ch.type)) continue;

    const data = {
      name: ch.name,
      type: ch.type,
      topic: ch.topic || undefined,
      nsfw: ch.nsfw || false,
      bitrate: ch.bitrate || undefined,
      userLimit: ch.userLimit || undefined,
      rateLimitPerUser: ch.rateLimitPerUser || undefined,
      parent: categoryMap.get(ch.parentId) || undefined,
      position: ch.rawPosition,
      permissionOverwrites: buildOverwrites(ch, roleMap),
      reason: 'Klonlama',
    };

    try {
      await target.channels.create(data);
      await sleep(RL_DELAY);
    } catch (err) {
      console.warn('[KANAL] Olusturulamadi:', ch.name, err.message);
    }
  }
}

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED]', err);
});

client.login(BOT_TOKEN).catch((err) => {
  console.error('[LOGIN] Bot girisi basarisiz:', err);
  process.exit(1);
});
