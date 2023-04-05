import { ChatInputCommandInteraction } from 'discord.js';
import { xbls } from '../../Client';
import { AES, enc } from 'crypto-js';
module.exports = {
	name: 'settings',
	async execute(interaction: ChatInputCommandInteraction, client: xbls) {
		await interaction.deferReply({ ephemeral: true });
		const subCommand = interaction.options.getSubcommand(true);

		if (subCommand === 'get') {
			const data: any = await client.database.query('SELECT * FROM settings WHERE guildID = ?', interaction.guild?.id);
			if (!data.length) {
				return await interaction.editReply({
					embeds: [
						client.utils.defaultEmbed(client, client.Colors.RED)
							.setDescription('Settings are not setup within this guild, please use the `/settings edit` command')
					]
				});
			}
			return await interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.BLUE)
						.setFields([
							{ name: 'Status Webhook URL', value: AES.decrypt(data[0].webhookURL, client.config.CIPHER_KEY).toString(enc.Utf8) },
							{ name: 'Emoji Type', value: data[0].emoji }
						])
				]
			});
		} else if (subCommand === 'edit') {
			const setting = interaction.options.getString('setting');
			const value = interaction.options.getString('value');

			if (setting === 'webhook' && !value!.includes('/api/webhooks')) return await interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('Invalid value, your webhook should look something like: `https://discord.com/api/webhooks/ID/a-zA-Z0-9`')
				]
			});
			if (setting === 'emoji' && !['custom', 'default'].includes(value!)) return await interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('Invalid value, your edit emoji value can either be `custom` or `default`')
				]
			});

			const isGuildInDatabase: any = await client.database.query('SELECT * FROM settings WHERE guildID = ?', interaction.guild!.id);
			if (!isGuildInDatabase.length) {
				await client.database.query(`INSERT INTO settings (guildID, ${setting === 'webhook' ? 'webhookURL' : 'emoji'}) VALUES (?, ?)`,
					interaction.guild!.id,
					setting === 'webhook' ? AES.encrypt(value!, client.config.CIPHER_KEY).toString() : value!);
				return interaction.editReply({
					embeds: [
						client.utils.defaultEmbed(client, client.Colors.GREEN)
							.setDescription(`Successfully updated ${setting}`)
					]
				});
			}
			await client.database.query(`UPDATE settings SET ${setting === 'webhook' ? 'webhookURL' : 'emoji'} = ? WHERE guildID = ?`, 
				setting === 'webhook' ? AES.encrypt(value!, client.config.CIPHER_KEY).toString() : value!,
				interaction.guild!.id);
			return interaction.editReply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.GREEN)
						.setDescription(`Successfully updated ${setting}`)
				]
			});
		}
	}
};