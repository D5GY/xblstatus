import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction } from 'discord.js';
import xbls from '../../Client';
import { SQLsettingsData } from '../../Utils/types';

const LAST_STATUS_BUTTON = new ActionRowBuilder<ButtonBuilder>().addComponents(
	[
		new ButtonBuilder()
			.setCustomId('last_status')
			.setLabel('Retrive last Live status')
			.setEmoji('1054479963761410108')
			.setStyle(ButtonStyle.Secondary)
	]
);

module.exports = {
	name: 'xblstatus',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		const secsAgo: number = (Math.floor(Math.round(Date.now() / 1000 - xbls.lastSocketUpdate / 1000)));

		if (xbls.statusSocketErrored) {
			await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.YELLOW)
						.setDescription('XBLStatus WebSocket Errored, this has been logged and will be looked into!')
				],
				components: [LAST_STATUS_BUTTON]
			});
			return;
		}

		if (secsAgo > 300) {
			await interaction.editReply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.YELLOW)
						.setDescription('Sorry, unable to gather accurate data from xblstatus.com')
				],
				components: [LAST_STATUS_BUTTON]
			});
			return;
		}

		let type: string = 'default';
		if (interaction.guild) {
			const data = await xbls.database.query('SELECT emoji FROM settings WHERE guildID = ?', interaction.guildId) as [SQLsettingsData];
			if (!data.length) type = 'default';
			else type = data[0].emoji;
		}

		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle(xbls.utils.titleMessage(secsAgo))
					.setDescription(xbls.currentStatus.map(data => `${xbls.utils.getEmoji(data.color, type)}  ${data.name} - ${data.description}`).join('\n'))
			]
		});
	}
};