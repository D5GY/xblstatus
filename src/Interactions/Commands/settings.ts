import { ChatInputCommandInteraction } from 'discord.js';
import xbls from '../../Client';
import { AES, enc } from 'crypto-js';
import { SQLsettingsData } from '../../Utils/types';
module.exports = {
	name: 'settings',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: true });
		const subCommand = interaction.options.getSubcommand(true) as 'get' | 'edit';

		if (subCommand === 'get') {
			const data = await xbls.database.query('SELECT * FROM settings WHERE guildID = ?', interaction.guild?.id) as [SQLsettingsData];
			if (!data.length) {
				return await interaction.editReply({
					embeds: [
						xbls.utils.defaultEmbed(client, xbls.Colors.RED)
							.setDescription('Settings are not setup within this guild, please use the `/settings edit` command')
					]
				});
			}
			return await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
						.setFields([
							{ name: 'Status Webhook URL', value: AES.decrypt(data[0].webhookURL, xbls.config.CIPHER_KEY).toString(enc.Utf8) },
							{ name: 'Emoji Type', value: data[0].emoji }
						])
				]
			});
		} else if (subCommand === 'edit') {
			const setting = interaction.options.getString('setting', true);
			const value = interaction.options.getString('value', true);

			if (setting === 'webhook' && xbls.config.DISCORD_WEBHOOK_REGEX.test(value)) return await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
						.setDescription('Invalid value, your webhook should look something like: `https://(canary.)discord.com/api/webhooks/0-9/a-zA-Z0-9`\nIf you think this is an error please contact `Jinx.#0001`')
				]
			});
			if (setting === 'emoji' && !['custom', 'default'].includes(value)) return await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
						.setDescription('Invalid value, your edit emoji value can either be `custom` or `default`')
				]
			});

			const isGuildInDatabase = await xbls.database.query('SELECT * FROM settings WHERE guildID = ?', interaction.guild!.id) as [SQLsettingsData];
			if (!isGuildInDatabase.length) {
				const res: any = await xbls.database.query(`INSERT INTO settings (guildID, ${setting === 'webhook' ? 'webhookURL' : 'emoji'}) VALUES (?, ?)`,
					interaction.guild!.id,
					setting === 'webhook' ? AES.encrypt(value!, xbls.config.CIPHER_KEY).toString() : value!);
				return interaction.editReply({
					embeds: [
						xbls.utils.defaultEmbed(client, xbls.Colors.GREEN)
							.setDescription(`Successfully updated ${setting}`)
							.setFooter({ text: res.info })
					]
				});
			}
			const res: any = await xbls.database.query(`UPDATE settings SET ${setting === 'webhook' ? 'webhookURL' : 'emoji'} = ? WHERE guildID = ?`, 
				setting === 'webhook' ? AES.encrypt(value!, xbls.config.CIPHER_KEY).toString() : value!,
				interaction.guild!.id);
			return interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.GREEN)
						.setDescription(`Successfully updated ${setting}`)
						.setFooter({ text: res.info })
				]
			});
		}
	}
};