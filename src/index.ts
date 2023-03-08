import { xbls } from './Client';
import { Events } from 'discord.js';
import { InteractionType } from 'discord-api-types/v10';
import { connectWS } from './Utils/WS Client';
const client = new xbls();
client.start();

client.on(Events.ClientReady, async () => {
	console.log(`${client.user!.tag} is online`);
	await client.utils.deployCommands();
	await client.utils.loadInteractions(client.commands);
	connectWS(client);
	await client.database.connect();
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

client.on('error', (error) => {
	console.error(error);
});
client.on('warn', (message) => {
	console.log(message);
});
process.on('uncaughtException', (error) => {
	console.error(error);
});
process.on('warning', (error) => {
	console.error(error);
});