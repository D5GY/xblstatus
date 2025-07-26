import {
  ChatInputCommandInteraction,
  hyperlink,
  MessageFlags,
} from 'discord.js';
import xbls from '../../Client';
import { AES, enc } from 'crypto-js';
import { SQLsettingsData } from '../../Utils/types';
import config from '../../config';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
  name: 'settings',
  async execute(interaction: ChatInputCommandInteraction, client: xbls) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    xbls.database
      .query(
        'INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
        interaction.guild ? interaction.guild.id : null,
        interaction.user.id,
        Date.now(),
        CommandIDs.SETTINGS
      )
      .catch((error) => {
        throw error;
      });
    const subCommand = interaction.options.getSubcommand(true) as
      | 'get'
      | 'edit';

    if (subCommand === 'get') {
      const data = (await xbls.database.query(
        'SELECT * FROM settings WHERE guildID = ?',
        interaction.guild?.id
      )) as [SQLsettingsData];
      if (!data.length) {
        return await interaction.editReply({
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.RED)
              .setDescription(
                'Settings are not setup within this guild, please use the `/settings edit` command'
              ),
          ],
        });
      }
      return await interaction.editReply({
        embeds: [
          xbls.utils.defaultEmbed(client, xbls.Colors.BLUE).setFields([
            {
              name: 'Status Webhook URL',
              value:
                data[0].webhookURL === null
                  ? 'No webhook setup'
                  : AES.decrypt(data[0].webhookURL, config.CIPHER_KEY).toString(
                      enc.Utf8
                    ),
            },
            {
              name: 'Emoji Type',
              value: data[0].emoji === null ? 'default' : data[0].emoji,
            },
          ]),
        ],
      });
    } else if (subCommand === 'edit') {
      const setting = interaction.options.getString('setting', true);
      const value = interaction.options.getString('value', true);

      if (setting === 'webhook' && !config.DISCORD_WEBHOOK_REGEX.test(value))
        return await interaction.editReply({
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.RED)
              .setDescription(
                'Invalid value, your webhook should look something like: `https://(canary.)discord.com/api/webhooks/0-9/a-zA-Z0-9`\nIf you think this is an error please contact `Jinx.#0001`'
              ),
          ],
        });
      if (setting === 'emoji' && !['custom', 'default'].includes(value))
        return await interaction.editReply({
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.RED)
              .setDescription(
                'Invalid value, your edit emoji value can either be `custom` or `default`'
              ),
          ],
        });

      const isGuildInDatabase = (await xbls.database.query(
        'SELECT * FROM settings WHERE guildID = ?',
        interaction.guild!.id
      )) as [SQLsettingsData];
      if (!isGuildInDatabase.length) {
        const res: any = await xbls.database.query(
          `INSERT INTO settings (guildID, ${
            setting === 'webhook' ? 'webhookURL' : 'emoji'
          }) VALUES (?, ?)`,
          interaction.guild!.id,
          setting === 'webhook'
            ? AES.encrypt(value!, config.CIPHER_KEY).toString()
            : value!
        );

        if (setting === 'webhook')
          xbls.utils.postWebhookMessage(
            value,
            xbls.utils
              .defaultEmbed(client, xbls.Colors.BLUE)
              .setDescription(
                `Hey, ${
                  interaction.user
                } has setup automatic status updates for this channel. for more support join our ${hyperlink(
                  'discord',
                  config.MAIN_GUILD_INVITE_URL
                )} you can also ${hyperlink(
                  'invite me',
                  config.BOT_INVITE_URL
                )} to your own server!`
              )
              .toJSON()
          );
        return interaction.editReply({
          embeds: [
            xbls.utils
              .defaultEmbed(client, xbls.Colors.GREEN)
              .setDescription(`Successfully updated ${setting}`)
              .setFooter({ text: res.info }),
          ],
        });
      }
      const res: any = await xbls.database.query(
        `UPDATE settings SET ${
          setting === 'webhook' ? 'webhookURL' : 'emoji'
        } = ? WHERE guildID = ?`,
        setting === 'webhook'
          ? AES.encrypt(value!, config.CIPHER_KEY).toString()
          : value!,
        interaction.guild!.id
      );

      if (setting === 'webhook')
        xbls.utils.postWebhookMessage(
          value,
          xbls.utils
            .defaultEmbed(client, xbls.Colors.BLUE)
            .setDescription(
              `Hey, ${
                interaction.user
              } has updated the database for automatic status updates for this channel. For more support join our ${hyperlink(
                'discord',
                config.MAIN_GUILD_INVITE_URL
              )} you can also ${hyperlink(
                'invite me',
                config.BOT_INVITE_URL
              )} to your own server!`
            )
            .toJSON()
        );

      return interaction.editReply({
        embeds: [
          xbls.utils
            .defaultEmbed(client, xbls.Colors.GREEN)
            .setDescription(`Successfully updated ${setting}`)
            .setFooter({ text: res.info }),
        ],
      });
    }
  },
};
