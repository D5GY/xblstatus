import { Connection, createConnection } from 'mysql2';
import { Config } from './config';

export class Database extends null {
	private static _database: Connection;
	private static _keepAlive: NodeJS.Timeout | null = null;

	public static get connected() {
		return this._database.authorized;
	}

	public static connect() {
		return new Promise<void>((promise, reject) => {
			const db = this._database = createConnection({
				host: Config.DATABASE.HOST,
				user: Config.DATABASE.USER,
				password: Config.DATABASE.PASSWORD,
				database: Config.DATABASE.DATABASE,
				port: Config.DATABASE.PORT
			});
			db.connect(error => {
				if (error) return reject(error);
				console.log('DATABASE: Connected');
				this._keepAlive = setInterval(() => {
					if (!this.connected) {
						clearInterval(this._keepAlive!);
						this._keepAlive = null;
						return;
					}
					this.query('SELECT 1 + 1').catch(error => {
						console.error(error);
					});
				});
			});
		});
	}
	public static query(sql: string, ...args: unknown[]) {
		if (!this.connected) return Promise.reject(new Error('Database not connected'));
		return new Promise((resolve, reject) => {
			try {
				this._database.query(sql, args, (error, results) => {
					if (error)
						return reject(error);
					resolve(results);
				});
			} catch (error) {
				reject(error);
			}
		});
	}
}