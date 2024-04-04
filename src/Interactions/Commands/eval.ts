import { ChatInputCommandInteraction, codeBlock } from 'discord.js';
import xbls from '../../Client';
import * as util from 'util';
import config from '../../config';
import { CommandIDs } from '../../Utils/enums';

module.exports = {
	name: 'eval',
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async execute(interaction: ChatInputCommandInteraction) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const client = xbls;
		if (!config.DEV_IDs.includes(interaction.user.id)) {
			return interaction.reply({
				content: 'You do not have permission to use this command.'
			});
		}
		await interaction.deferReply({ ephemeral: false });
		xbls.database.query('INSERT INTO executed_commands (guild, user, timestamp, command) VALUES (?, ?, ?, ?)',
			interaction.guild ? interaction.guild.id : null,
			interaction.user.id,
			Date.now(),
			CommandIDs.EVAL
		).catch(error => { throw error; });
		try {
			const code = interaction.options.getString('code', true);
			const async = interaction.options.getBoolean('async', false);

			const result = util.inspect(await eval(async ? `(async()=>{${code}})();` : code))
				.replaceAll(config.DEV_TOKEN, 'DEV-TOKEN').replaceAll(config.PRODUCTION_TOKEN, 'TOKEN');

			if (result.length > 1500) {
				const json = await fetch('https://hastebin.skyra.pw/documents', {
					body: result,
					headers: {
						'Content-Type': 'application/json'
					}, method: 'POST'
				}).then(res => res.json());
				return interaction.editReply({
					content: `Output posted to https://hastebin.skyra.pw/${json.key}`
				});
			}

			return interaction.editReply({
				content: codeBlock('js', result)
			});

		} catch (error) {
			return interaction.editReply({
				content: `ERROR: ${codeBlock('js', util.inspect(error))}`
			});
		}

	}
};