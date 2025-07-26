import { ChatInputCommandInteraction } from 'discord.js';
import xbls from '../../Client';
import { SQLTitleIdData } from '../../Utils/types';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
	name: 'xbtitle',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		xbls.database.query('INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
			interaction.guild ? interaction.guild.id : null,
			interaction.user.id,
			Date.now(),
			CommandIDs.XBLTITLE
		).catch(error => { throw error; });
		const title = interaction.options.getString('search', true).trim();
		let type = 'name';
		if (xbls.utils.isTitleID(title)) type = 'id';

		const regex = /^[A-Za-z0-9\s\\$&():./\\]+$/;
		if (!regex.test(title)) return await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.YELLOW)
					.setDescription('Invalid search, You included an illegal character.')
			]
		});

		const data = await xbls.database.query(`SELECT * FROM games WHERE ${type === 'name' ? type : 'id'} LIKE '%${title}%'`) as [SQLTitleIdData];

		if (!data.length) return await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.RED)
					.setTitle(`Unable to find the ${type}: ${title}`)
			]
		});

		if (data.length > 20) return await interaction.editReply({
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