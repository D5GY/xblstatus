import { ChatInputCommandInteraction, hyperlink } from 'discord.js';
import xbls from '../../Client';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
  name: 'credits',
  async execute(interaction: ChatInputCommandInteraction, client: xbls) {
    await interaction.deferReply();
    xbls.database
      .query(
        'INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
        interaction.guild ? interaction.guild.id : null,
        interaction.user.id,
        Date.now(),
        CommandIDs.CREDITS
      )
      .catch((error) => {
        throw error;
      });

    await interaction.editReply({
      embeds: [
        xbls.utils
          .defaultEmbed(client, xbls.Colors.BLUE)
          .setTitle('Credits')
          .setDescription(
            `Main contributors: Cipher (${hyperlink(
              'cipher.services',
              'https://cipher.services'
            )})\n\nOther contributors: Tazhys - xblerror`
          ),
      ],
    });
  },
};
