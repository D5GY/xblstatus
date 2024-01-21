import { ChatInputCommandInteraction, hyperlink } from 'discord.js';
import xbls from '../../Client';

module.exports = {
	name: 'credits',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: false });


		await interaction.editReply({
			embeds: [
				xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
					.setTitle('Credits')
					.setDescription(`Main contributors: Cipher (${hyperlink('cipher.services', 'https://cipher.services')})\n\nOther contributors: Tazhys - xblerror`)
			]
		});
	}
};