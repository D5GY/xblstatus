import { ButtonInteraction } from 'discord.js';
import { xbls } from '../../Client';

module.exports = {
	name: 'last_status',

	async execute(interaction: ButtonInteraction, client: xbls) {
		await interaction.deferUpdate();
		const secsAgo: number = (Math.floor(Math.round(Date.now() / 1000 - client.lastSocketUpdate / 1000)));
		const component = interaction.message.components[0].toJSON();
		component.components[0].disabled = true;
		await interaction.editReply({
			embeds: [
				client.utils.defaultEmbed(client, client.Colors.BLUE)
					.setTitle(client.utils.titleMessage(secsAgo))
					.setDescription(client.currentStatus.map(data => `${client.utils.getEmoji(data.color)}  ${data.name} - ${data.description}`).join('\n'))
			],
			components: [component]
		});
	}
};