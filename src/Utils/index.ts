import { EmbedBuilder, SlashCommandBuilder, Client, Collection } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Config } from './config';
import { readdirSync } from 'fs';
import { xbls } from '../Client';
import { defaultEmojis } from './enums';
import fetch from 'node-fetch';

export class Util extends null {
	public static client: Client;
	public static XBLS_URL = 'https://xblstatus.com/' as const;

	public static defaultEmbed(client: xbls, color: number) {
		return new EmbedBuilder()
			.setColor(color)
			.setAuthor({ name: 'xblstatus.com', url: this.XBLS_URL, iconURL: client.user!.displayAvatarURL()! });
	}
	public static titleMessage = (secsAgo: number) => `Last Update: ${secsAgo} ${secsAgo === 1 ? 'second' : 'seconds'} ago`;

	public static deployCommands = async () => {
		const commands = [
			new SlashCommandBuilder()
				.setName('xblstatus')
				.setDescription('Get the status of LIVE for the Xbox 360.')
				.toJSON()
		];
		const token = Config.DEV_MODE ? Config.DEV_TOKEN : Config.PRODUCTION_TOKEN;
		const rest = new REST({ version: '10' }).setToken(token);
		await rest.put(Routes.applicationCommands(Buffer.from(token.split('.')[0], 'base64').toString()), {
			body: commands
		});
		console.log('Interaction Commands Set');
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
		console.log('Loaded Interactions');
	};

	public static getEmoji = (color: string) => {
		if (color == '#0c0') return defaultEmojis.GREEN;
		else if (color == '#c80') return defaultEmojis.ORANGE;
		else if (color == '#cc0') return defaultEmojis.YELLOW;
		else if (color == '#c50') return defaultEmojis.ORANGE;
		else if (color == '#c00') return defaultEmojis.RED;
		else if (color == '#ccc') return defaultEmojis.WHITE;
		else return defaultEmojis.BLACK;
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
