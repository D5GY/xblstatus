import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';
import xbls from '../../Client';
import { SQLsettingsData } from '../../Utils/types';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
  name: 'last_status',

  async execute(interaction: ButtonInteraction, client: xbls) {
    await interaction.deferUpdate();

    await xbls.database
      .query(
        'INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
        interaction.guild ? interaction.guild.id : null,
        interaction.user.id,
        Date.now(),
        CommandIDs.LAST_STATUS
      )
      .catch((error) => {
        throw error;
      });

    const secsAgo: number = Math.floor(
      (Date.now() - xbls.lastSocketUpdate) / 1000
    );

    const updatedComponents: ActionRowBuilder<MessageActionRowComponentBuilder>[] =
      [];

    for (const row of interaction.message.components) {
      if (!('components' in row)) continue;

      const newRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

      for (const component of row.components as unknown as MessageActionRowComponentBuilder[]) {
        if (isButton(component)) {
          const disabledButton =
            ButtonBuilder.from(component).setDisabled(true);
          newRow.addComponents(disabledButton);
        }
      }

      if (newRow.components.length > 0) {
        updatedComponents.push(newRow);
      }
    }

    let type = 'default';

    if (interaction.guild) {
      try {
        const data = (await xbls.database.query(
          'SELECT emoji FROM settings WHERE guildID = ?',
          interaction.guildId
        )) as [SQLsettingsData];

        type = data.length ? data[0].emoji : 'default';
      } catch (error) {
        console.error(error);
        xbls.error.send({
          content: '<@1004109994888798218>',
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.RED)
              .setTitle('last_status button error')
              .setDescription(`Error: ${error}`),
          ],
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
      components: updatedComponents,
    });
  },
};

function isButton(
  component: MessageActionRowComponentBuilder
): component is ButtonBuilder {
  return (component as ButtonBuilder).data?.style !== undefined;
}
