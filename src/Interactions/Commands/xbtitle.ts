import { ChatInputCommandInteraction } from 'discord.js';
import xbls from '../../Client';
import { SQLTitleIdData } from '../../Utils/types';

module.exports = {
	name: 'xbtitle',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		const title = interaction.options.getString('search', true).trim();
		let type = interaction.options.getString('type', false);
		if (!type) type = 'id';

		const data = await xbls.database.query(`SELECT * FROM games WHERE ${type === 'id' ? type : 'name'} LIKE '%${title}%'`) as [SQLTitleIdData];

		console.log(data);

		if (!data.length) return await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.RED)
					.setTitle(`Unable to find the ${type}: ${title}`)
			]
		});

		if (data.length > 10) return await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.YELLOW)
					.setDescription('There are too many results for this search, Try your search again with more specific keywords.')
			]
		});

		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle(`Xbox 360 Title Lookup: ${title}`)
					.setDescription(`${data.map(x => `__Title ID/Name:__ **${x.id}** - **${x.name}**`).join('\n')}`)
			]
		});
	}
};