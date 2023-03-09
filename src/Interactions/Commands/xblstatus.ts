import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';
import { xbls } from '../../Client';

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
	async execute(interaction: CommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		const secsAgo: number = (Math.floor(Math.round(Date.now() / 1000 - client.lastSocketUpdate / 1000)));

		if (client.statusSocketErrored) {
			await interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.YELLOW)
						.setDescription('XBLStatus WebSocket Erroed, this has been logged in will be looked into!')
				],
				components: [LAST_STATUS_BUTTON]
			});
			return;
		}

		if (secsAgo > 300) {
			await interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.YELLOW)
						.setDescription('Sorry, unable to gather accurate data from xblstatus.com')
				],
				components: [LAST_STATUS_BUTTON]
			});
			return;
		}

		await interaction.editReply({
			embeds: [
				client.utils.defaultEmbed(client, client.Colors.BLUE)
					.setTitle(client.utils.titleMessage(secsAgo))
					.setDescription(client.currentStatus.map(data => `${client.utils.getEmoji(data.color)}  ${data.name} - ${data.description}`).join('\n'))
			]
		});
	}
};