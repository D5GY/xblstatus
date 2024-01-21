import { ChatInputCommandInteraction, hyperlink } from 'discord.js';
import xbls from '../../Client';
import { readFileSync } from 'fs';
import config from '../../config';

module.exports = {
	name: 'xblerror',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });
		let code = interaction.options.getString('code', true).trim();
		if (code.startsWith('0x')) code = code.split('0x')[1];

		const Jsondata = JSON.parse(readFileSync(`${__dirname}/../../../status_codes.json`, 'utf8'));
		const data = await Jsondata[code];

		if (!data) return await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.RED)
					.setTitle(`Unknown Live Error Code: ${code}`)
					.setDescription(`I was unable to find the error code, If you belive this is incorrect and we are missing the error you can join our ${hyperlink('support discord', config.MAIN_GUILD_INVITE_URL)}.`)
			]
		});

		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle(`Xbox Live Error Code: ${code}`)
					.setDescription(`__Error Description:__\n${data}`)
			]
		});
	}
};