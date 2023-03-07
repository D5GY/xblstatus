import { CommandInteraction } from 'discord.js';
import { xbls } from '../../Client';
module.exports = {
	name: 'xblstatus',
	async execute(interaction: CommandInteraction, client: xbls) {
		const secsAgo: number = (Math.floor(Math.round(Date.now() / 1000 - client.lastSocketUpdate / 1000)));
		await interaction.deferReply({ ephemeral: false });

		await interaction.editReply({
			embeds: [
				client.utils.defaultEmbed(client, client.Colors.BLUE)
					.setTitle(client.utils.titleMessage(secsAgo))
					.setDescription(client.currentStatus.map(data => `${client.utils.getEmoji(data.color)}  ${data.name} - ${data.description}`).join('\n'))
			]
		});
	}
};