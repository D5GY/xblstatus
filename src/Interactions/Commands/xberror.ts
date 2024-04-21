import { ChatInputCommandInteraction, hyperlink } from 'discord.js';
import xbls from '../../Client';
import config from '../../config';
import { SQLErrorCodes } from '../../Utils/types';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
	name: 'xblerror',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		xbls.database.query('INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
			interaction.guild ? interaction.guild.id : null,
			interaction.user.id,
			Date.now(),
			CommandIDs.XBLERROR
		).catch(error => {throw error;});
		let code = interaction.options.getString('code', true).trim();
		if (code.startsWith('0x')) code = code.split('0x')[1];

		const [data] = await xbls.database.query('SELECT * FROM codes WHERE code = ?', code) as [SQLErrorCodes];

		if (!data) {
			xbls.utils.postWebhookMessage(config.WEBHOOKS.UNKNOWN_XBLERROR_CODE, {
				color: xbls.Colors.YELLOW,
				description: `Unknown Code: **${code}**\n\nGuild: ${interaction.guild?.name} : ${interaction.guild?.id}\nExecuted by: ${interaction.user} : ${interaction.user.id}`
			});
			return await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
						.setTitle(`Unknown Error Code: ${code}`)
						.setDescription(`I was unable to find the error code, If you believe this is incorrect and we are missing the error you can join our ${hyperlink('support discord', config.MAIN_GUILD_INVITE_URL)}.`)
				]
			});
		}

		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle(`Xbox Error Code: ${code}`)
					.setDescription(`__Error Name:__\n${data.error}${typeof data.fix === 'string' ? `\n\n__Possible solution:__\n${data.fix}` : ''}`)
			]
		});
	}
};