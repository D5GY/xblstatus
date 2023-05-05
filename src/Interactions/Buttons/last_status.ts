import { ButtonInteraction } from 'discord.js';
import xbls from '../../Client';
import { SQLsettingsData } from '../../Utils/types';

module.exports = {
	name: 'last_status',

	async execute(interaction: ButtonInteraction, client: xbls) {
		await interaction.deferUpdate();
		const secsAgo: number = (Math.floor(Math.round(Date.now() / 1000 - xbls.lastSocketUpdate / 1000)));
		const component = interaction.message.components[0].toJSON();
		component.components[0].disabled = true;

		let type: string = 'default';
		if (interaction.guild) {
			try {
				const data = await xbls.database.query('SELECT emoji FROM settings WHERE guildID = ?', interaction.guildId) as [SQLsettingsData];
				if (!data.length) type = 'default';
				else type = data[0].emoji;
			} catch (error) {
				type = 'default';
				console.error(error);
				xbls.error.send({
					content: '<@1004109994888798218>',
					embeds: [
						xbls.utils.defaultEmbed(client, xbls.Colors.RED)
							.setTitle('last_status button error')
							.setDescription(`Error: ${error}`)
					]
				});
			}
		}

		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle(xbls.utils.titleMessage(secsAgo))
					.setDescription(xbls.currentStatus.map(data => `${xbls.utils.getEmoji(data.color, type)}  ${data.name} - ${data.description}`).join('\n'))
			],
			components: [component]
		});
	}
};