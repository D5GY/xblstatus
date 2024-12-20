import { Connection, createPool, Pool } from 'mysql2';
import config from '../config';

export class Database {
	public _database: Pool;

	public constructor() {
		this._database = createPool({
			host: config.DEV_MODE ? config.DATABASE.DEV_HOST : config.DATABASE.HOST,
			user: config.DATABASE.USER,
			password: config.DATABASE.PASSWORD,
			database: config.DATABASE.DATABASE
		});
	}
	
	public query(sql: string, ...args: unknown[]): Promise<unknown> {
		return new Promise((resolve, reject) => this._database.query(sql, args, (error, results) => {
			if (error) reject(error);
			else resolve(results);
		}));
	}
}