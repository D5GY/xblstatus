import { xbls } from './Client';
import { Events, WebhookClient } from 'discord.js';
import { InteractionType } from 'discord-api-types/v10';
import { connectWS } from './Utils/WS Client';
const client = new xbls();
client.start();

client.on(Events.ClientReady, async () => {
	console.log(`${client.user!.tag} is online`);
	await client.utils.deployCommands().catch(error => console.error(error));
	await client.utils.loadInteractions(client.commands, client.buttons).catch(error => console.error(error));
	connectWS(client);
	await client.database.connect()?.catch(error => console.error(error));
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
		} catch (error: any) {
			if (error.name === 'DiscordAPIError[10062]') return;
			console.error(error);
			interaction.channel?.send({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into')
				]
			});
		}
	} else if (interaction.isButton()) {
		const button: any = client.buttons.get(interaction.customId);
		if (!button) {
			await interaction.reply({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into.')
				]
			});
		}
		try {
			await button.execute(interaction, client);
		} catch (error: any) {
			if (error.name === 'DiscordAPIError[10062]') return;
			console.error(error);
			interaction.channel?.send({
				embeds: [
					client.utils.defaultEmbed(client, client.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into')
				]
			});
		}
	}
});

const GUILD_JOIN_WEBHOOK = new WebhookClient({ url: client.config.WEBHOOKS.GUILD_JOIN });
client.on(Events.GuildCreate, async guild => {
	const guildOwner = await guild.fetchOwner();
	GUILD_JOIN_WEBHOOK.send({
		embeds: [{
			color: client.Colors.BLUE,
			description: 'New Guild Joined',
			fields: [
				{ name: 'Guild Name / ID', value: `${guild.name}\n${guild.id}`, inline: true },
				{ name: 'Guild Owner / ID', value: `${guildOwner.user}\n${guildOwner.user.tag}\n${guild.ownerId}`, inline: true }
			],
			thumbnail: { url: guild.iconURL() ?? client.user!.avatarURL()! },
			footer: { text: `Guild Count: ${client.guilds.cache.size} | Guild Mem Count: ${guild.memberCount}` }
		}]
	});
});
const GUILD_LEAVE_WEBHOOK = new WebhookClient({ url: client.config.WEBHOOKS.GUILD_LEAVE });
client.on(Events.GuildDelete, async guild => {
	const guildOwner = await guild.fetchOwner();
	GUILD_LEAVE_WEBHOOK.send({
		embeds: [{
			color: client.Colors.BLUE,
			description: 'Guild Left',
			fields: [
				{ name: 'Guild Name / ID', value: `${guild.name}\n${guild.id}`, inline: true },
				{ name: 'Guild Owner / ID', value: `${guildOwner.user}\n${guildOwner.user.tag}\n${guild.ownerId}`, inline: true }
			],
			thumbnail: { url: guild.iconURL() ?? client.user!.avatarURL()! },
			footer: { text: `Guild Count: ${client.guilds.cache.size} | Guild Mem Count: ${guild.memberCount}` }
		}]
	});
	const isGuildInDatabase: any = await client.database.query('SELECT * FROM settings WHERE guildID = ?', guild.id);
	if (!isGuildInDatabase.length) return;
	else client.database.query('DELETE FROM settings WHERE guildID = ?', guild.id);
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