import { Connection, createConnection } from 'mysql2';
import { Config } from './config';

export class Database {
	public _database: Connection;

	public constructor() {
		this._database = createConnection({
			host: Config.DATABASE.HOST,
			user: Config.DATABASE.USER,
			password: Config.DATABASE.PASSWORD,
			database: Config.DATABASE.DATABASE,
			port: Config.DATABASE.PORT
		});
	}

	public connect() {
		return new Promise((resolve, reject) => this._database.connect(error => {
			if (error) reject(error);
			else resolve(this);
		}));
	}
	public query(sql: string, ...args: unknown[]): Promise<unknown> {
		return new Promise((resolve, reject) => this._database.query(sql, args, (error, results) => {
			if (error) reject(error);
			else resolve(results);
		}));
	}
}