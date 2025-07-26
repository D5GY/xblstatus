import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  hyperlink,
} from 'discord.js';
import xbls from '../../Client';
import { SQLsettingsData } from '../../Utils/types';
import config from '../../config';
import { CommandIDs } from '../../Utils/enums';

const LAST_STATUS_BUTTON = new ActionRowBuilder<ButtonBuilder>().addComponents([
  new ButtonBuilder()
    .setCustomId('last_status')
    .setLabel('Retrive last Live status')
    .setEmoji('1054479963761410108')
    .setStyle(ButtonStyle.Secondary),
]);

module.exports = {
  name: 'xblstatus',
  async execute(interaction: ChatInputCommandInteraction, client: xbls) {
    await interaction.deferReply();
    xbls.database
      .query(
        'INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
        interaction.guild ? interaction.guild.id : null,
        interaction.user.id,
        Date.now(),
        CommandIDs.XBLSTATUS
      )
      .catch((error) => {
        throw error;
      });
    const secsAgo: number = Math.floor(
      Math.round(Date.now() / 1000 - xbls.lastSocketUpdate / 1000)
    );

    if (xbls.statusSocketErrored) {
      await interaction.editReply({
        embeds: [
          xbls.utils
            .defaultEmbed(client, xbls.Colors.YELLOW)
            .setDescription(
              `XBLStatus WebSocket Errored, join our ${hyperlink(
                'support discord',
                config.MAIN_GUILD_INVITE_URL
              )} and report it!`
            ),
        ],
        components: [LAST_STATUS_BUTTON],
      });
      return;
    }

    if (secsAgo > 300) {
      await interaction.editReply({
        embeds: [
          xbls.utils
            .defaultEmbed(client, xbls.Colors.YELLOW)
            .setDescription(
              'Sorry, unable to gather accurate data from xblstatus.com'
            ),
        ],
        components: [LAST_STATUS_BUTTON],
      });
      return;
    }

    let type: string = 'default';
    if (interaction.guild) {
      try {
        const data = (await xbls.database.query(
          'SELECT emoji FROM settings WHERE guildID = ?',
          interaction.guildId
        )) as [SQLsettingsData];
        if (!data.length) type = 'default';
        else type = data[0].emoji;
      } catch (error) {
        type = 'default';
        console.error(error);
        xbls.error.send({
          content: '<@1004109994888798218>',
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.RED)
              .setTitle('/xblstatus command error')
              .setDescription(`Error: ${error}`),
          ],
          components: [LAST_STATUS_BUTTON],
        });
      }
    }

    await interaction.editReply({
      embeds: [
        xbls.utils
          .defaultEmbed(client, xbls.Colors.BLUE)
          .setTitle(xbls.utils.titleMessage(secsAgo))
          .setDescription(
            xbls.currentStatus
              .map(
                (data) =>
                  `${xbls.utils.getEmoji(data.color, type)}  ${data.name} - ${
                    data.description
                  }`
              )
              .join('\n')
          ),
      ],
    });
  },
};
