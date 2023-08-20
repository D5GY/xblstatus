import { EmbedBuilder, SlashCommandBuilder, Client, Collection } from 'discord.js';
import { REST } from '@discordjs/rest';
import { PermissionFlagsBits, Routes } from 'discord-api-types/v10';
import { Config } from './config';
import { readdirSync } from 'fs';
import xbls from '../Client';
import { customEmojis, defaultEmojis } from './enums';
import fetch from 'node-fetch';

export class Util {
	public static client: Client;
	public static XBLS_URL = 'https://xblstatus.com/' as const;

	public static defaultEmbed(client: xbls, color: number) {
		return new EmbedBuilder()
			.setColor(color)
			.setAuthor({ name: 'xblstatus.com', url: this.XBLS_URL, iconURL: client.user!.displayAvatarURL()! });
	}
	public static titleMessage = (secsAgo: number) => `Last Update: ${secsAgo} ${secsAgo === 1 ? 'second' : 'seconds'} ago`;

	public static deployCommands = async () => {
		const globalCommands = [
			new SlashCommandBuilder()
				.setName('xblstatus')
				.setDescription('Get the status of LIVE for the Xbox 360.')
				.toJSON(),
			new SlashCommandBuilder()
				.setName('settings')
				.setDescription('xblStatus server settings.')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.setDMPermission(false)
				.addSubcommand(option => option
					.setName('get')
					.setDescription('Display your guild settings.')
				)
				.addSubcommand(option => option
					.setName('edit')
					.setDescription('Edit your guild settings.')
					.addStringOption(input => input
						.setName('setting')
						.setDescription('Select the setting you want to edit.')
						.addChoices(
							{ name: 'xblStatus change webhook', value: 'webhook' },
							{ name: 'xblStatus change emoji type', value: 'emoji' }
						)
						.setRequired(true)
					)
					.addStringOption(input => input
						.setName('value')
						.setDescription('Set the value of your selected setting.')
						.setRequired(true)
					)
				)
				.toJSON()
		];
		const guildCommands = [
			new SlashCommandBuilder()
				.setName('eval')
				.setDescription('execute code')
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addStringOption(input => input
					.setName('code')
					.setDescription('The code you want to execute')
					.setRequired(true)
				)
				.addBooleanOption(input => input
					.setName('async')
					.setDescription('asynchronously execute code')
					.setRequired(false)
				)
				.toJSON()
		];
		const token = Config.DEV_MODE ? Config.DEV_TOKEN : Config.PRODUCTION_TOKEN;
		const rest = new REST({ version: '10' }).setToken(token);
		await rest.put(Routes.applicationCommands(Buffer.from(token.split('.')[0], 'base64').toString()), {
			body: globalCommands
		});
		await rest.put(Routes.applicationGuildCommands(Buffer.from(token.split('.')[0], 'base64').toString(), Config.MAIN_GUILD), {
			body: guildCommands
		});
		console.log('Interaction Global & Guild Commands Set');
	};

	public static loadInteractions = async (commandCollection: Collection<string, any>, buttonCollection: Collection<string, any>) => {
		const interactionDir = `${__dirname}/../Interactions`;
		const interactionTypes = readdirSync(interactionDir);
		for (const interactionType of interactionTypes) {
			if (interactionType == 'Commands') {
				const cmdFiles = readdirSync(`${interactionDir}/${interactionType}`);
				for (const cmdFile of cmdFiles) {
					const cmd = await require(`${interactionDir}/${interactionType}/${cmdFile}`);
					commandCollection.set(cmd.name, cmd);
				}
			} else if (interactionType == 'Buttons') {
				const btnFiles = readdirSync(`${interactionDir}/${interactionType}`);
				for (const btnFile of btnFiles) {
					const btn = await require(`${interactionDir}/${interactionType}/${btnFile}`);
					buttonCollection.set(btn.name, btn);
				}
			}
		}
	};

	public static getEmoji = (color: string, type: string = 'default') => {
		if (type === 'default') return this.getDefaultEmoji(color);
		else if (type === 'custom') return this.getCustomEmoji(color);
		else return this.getDefaultEmoji(color);
	};
	private static getDefaultEmoji = (color: string) => {
		if (color == '#0c0') return defaultEmojis.GREEN;
		else if (color == '#cc0' || color == '#c80') return defaultEmojis.YELLOW;
		else if (color == '#c50') return defaultEmojis.ORANGE;
		else if (color == '#c00') return defaultEmojis.RED;
		else if (color == '#ccc') return defaultEmojis.WHITE;
		else return defaultEmojis.BLACK;
	};
	private static getCustomEmoji = (color: string) => {
		if (color == '#0c0') return customEmojis.GREEN;
		else if (color == '#c80') return customEmojis.GOLD;
		else if (color == '#cc0') return customEmojis.YELLOW;
		else if (color == '#c50') return customEmojis.ORANGE;
		else if (color == '#c00') return customEmojis.RED;
		else if (color == '#ccc') return customEmojis.GRAY;
		else return customEmojis.BLACK;
	};

	public static postStatusWebhookChange = (url: string, json = {}) => {
		fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				embeds: [json]
			})
		}).catch((error) => {
			throw error;
		});
	};
}
