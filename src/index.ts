import xbls from './Client';
import { Events, WebhookClient, userMention } from 'discord.js';
import { InteractionType } from 'discord-api-types/v10';
import { connectWS } from './Utils/WS Client';
import { SQLsettingsData } from './Utils/types';
const client = new xbls();
client.start();
client.on(Events.ClientReady, async () => {
	console.log(`${client.user!.tag} is online`);
	await xbls.utils.deployCommands().catch(error => console.error(error));
	await xbls.utils.loadInteractions(xbls.commands, xbls.buttons).catch(error => console.error(error)).then(() => console.log('Loaded Interactions'));
	connectWS(client);
	await xbls.database.connect().catch((error: Error) => console.error(error)).then(() => console.log('Connected To Database'));
});

const INTERACTION_USAGE_WEBHOOK = new WebhookClient({ url: xbls.config.WEBHOOKS.INTERACTION_USAGE });
client.on(Events.InteractionCreate, async interaction => {
	INTERACTION_USAGE_WEBHOOK.send({
		embeds: [
			xbls.utils.defaultEmbed(client, xbls.Colors.BLUE)
				.addFields(
					{ name: 'Type', value: interaction.type == 2 ? 'Command' : 'Button', inline: true },
					{ name: 'Name', value: interaction.type === InteractionType.ApplicationCommand ? interaction.commandName : 'Last status', inline: true },
					{ name: 'Executer', value: `ID: ${interaction.user.id}\nTag: ${interaction.user.tag}\nMention: ${userMention(interaction.user.id)}` },
					{ name: 'Guild', value: interaction.guild ? `ID: ${interaction.guild.id}\nName: ${interaction.guild.name}` : 'Usaed in DM\'s' }
				)
		]
	});
	if (interaction.type === InteractionType.ApplicationCommand) {
		const interactionExecuted = await xbls.commands.get(interaction.commandName) as any;
		if (!interactionExecuted) {
			await interaction.reply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
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
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into')
				]
			});
		}
	} else if (interaction.isButton()) {
		const button: any = xbls.buttons.get(interaction.customId);
		if (!button) {
			await interaction.reply({
				embeds: [
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
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
					xbls.utils.defaultEmbed(client, xbls.Colors.RED)
						.setDescription('An unknown error occurred, this has been logged and will be looked into')
				]
			});
		}
	}
});

const GUILD_JOIN_WEBHOOK = new WebhookClient({ url: xbls.config.WEBHOOKS.GUILD_JOIN });
client.on(Events.GuildCreate, async guild => {
	const guildOwner = await guild.fetchOwner();
	GUILD_JOIN_WEBHOOK.send({
		embeds: [{
			color: xbls.Colors.BLUE,
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
const GUILD_LEAVE_WEBHOOK = new WebhookClient({ url: xbls.config.WEBHOOKS.GUILD_LEAVE });
client.on(Events.GuildDelete, async guild => {
	const guildOwner = await guild.fetchOwner();
	GUILD_LEAVE_WEBHOOK.send({
		embeds: [{
			color: xbls.Colors.BLUE,
			description: 'Guild Left',
			fields: [
				{ name: 'Guild Name / ID', value: `${guild.name}\n${guild.id}`, inline: true },
				{ name: 'Guild Owner / ID', value: `${guildOwner.user}\n${guildOwner.user.tag}\n${guild.ownerId}`, inline: true }
			],
			thumbnail: { url: guild.iconURL() ?? client.user!.avatarURL()! },
			footer: { text: `Guild Count: ${client.guilds.cache.size} | Guild Mem Count: ${guild.memberCount}` }
		}]
	});
	const isGuildInDatabase = await xbls.database.query('SELECT * FROM settings WHERE guildID = ?', guild.id) as [SQLsettingsData];
	if (!isGuildInDatabase.length) return;
	else xbls.database.query('DELETE FROM settings WHERE guildID = ?', guild.id);
});

client.on('error', (error) => {
	console.error(error);
	xbls.error.send({
		content: '<@1004109994888798218>',
		embeds: [
			xbls.utils.defaultEmbed(client, xbls.Colors.RED)
				.setTitle('uncaughtException')
				.setFields(
					{ name: 'Error Name', value: error.name, inline: true },
					{ name: 'Error Message', value: error.message, inline: true },
					{ name: 'Error Stack', value: error.stack ?? 'No stack message' }
				)
		]
	}).catch(error => {
		throw error;
	});
});
client.on('warn', (message) => {
	console.log(message);
	xbls.error.send({
		content: '<@1004109994888798218>',
		embeds: [
			xbls.utils.defaultEmbed(client, xbls.Colors.RED)
				.setTitle('Client Warning')
				.setFields(
					{ name: 'Warn Message', value: message },
				)
		]
	}).catch(error => {
		throw error;
	});
});
process.on('uncaughtException', (error) => {
	console.error(error);
	xbls.error.send({
		content: '<@1004109994888798218>',
		embeds: [
			xbls.utils.defaultEmbed(client, xbls.Colors.RED)
				.setTitle('uncaughtException')
				.setFields(
					{ name: 'Error Name', value: error.name, inline: true },
					{ name: 'Error Message', value: error.message, inline: true },
					{ name: 'Error Stack', value: error.stack ?? 'No stack message' }
				)
		]
	}).catch(error => {
		throw error;
	});
});
process.on('warning', (error) => {
	console.error(error);
	xbls.error.send({
		content: '<@1004109994888798218>',
		embeds: [
			xbls.utils.defaultEmbed(client, xbls.Colors.YELLOW)
				.setTitle('Process Warning')
				.setFields(
					{ name: 'Error Name', value: error.name, inline: true },
					{ name: 'Error Message', value: error.message, inline: true },
					{ name: 'Error Stack', value: error.stack ?? 'No stack message' }
				)
		]
	}).catch(error => {
		throw error;
	});
});