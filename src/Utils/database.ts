import { Connection, createConnection } from 'mysql';
import { Config } from './config';

export class Database extends null {
	private static _database: Connection;

	constructor() {
		Database._database = createConnection({
			host: Config.DATABASE.HOST,
			user: Config.DATABASE.USER,
			password: Config.DATABASE.PASSWORD,
			database: Config.DATABASE.DATABASE,
			port: Config.DATABASE.PORT
		});
	}

	public static connect(): Promise<unknown> {
		return new Promise((resolve, reject) => Database._database.connect(error => {
			if (error) reject;
			else resolve(this);
		}));
	}
	public static query<T = unknown>(sql: string, ...args: unknown[]): Promise<T[]> {
		return new Promise((resolve, reject) => this._database.query(sql, args, (error, results) => {
			if (error) reject(error);
			else resolve(results);
		}));
	}
}