import { xbls } from './Client';
import { Events } from 'discord.js';
import { InteractionType } from 'discord-api-types/v10';
import { connectWS } from './Utils/WS Client';
const client = new xbls();
client.start();

client.on(Events.ClientReady, async () => {
	await client.utils.deployCommands();
	await client.utils.loadInteractions(client.commands);
	connectWS(client);
	console.log(`${client.user!.tag} is online`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.type === InteractionType.ApplicationCommand) {
		const interactionExecuted = await client.commands.get(interaction.commandName) as any;
		if (!interactionExecuted) {
			await interaction.reply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into.')
				]
			});
		}
		try {
			await interactionExecuted.execute(interaction, client);
		} catch (error) {
			interaction.reply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('Something went wronggggg')
				]
			});
		}
	}
});