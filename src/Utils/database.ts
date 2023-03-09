import { Connection, createConnection } from 'mysql2';
import { Config } from './config';

export class Database extends null {
	private static _database: Connection;
	private static _keepAlive: NodeJS.Timeout | null = null;
	private static _isConnected: boolean = false;

	public static connect() {
		if (this._isConnected) return;
		return new Promise<void>((promise, reject) => {
			this._database = createConnection({
				host: Config.DATABASE.HOST,
				user: Config.DATABASE.USER,
				password: Config.DATABASE.PASSWORD,
				database: Config.DATABASE.DATABASE,
				port: Config.DATABASE.PORT
			});
			if (!this._isConnected) this._database.connect(error => {
				if (error) return reject(error);
				this._isConnected = true;
				console.log('DATABASE: Connected');
				this._keepAlive = setInterval(() => {
					if (!this._isConnected) {
						clearInterval(this._keepAlive!);
						this._keepAlive = null;
						this.connect();
						return;
					}
					console.log('DATABASE: 30mins keep alive query');
					this.query('SELECT 1 + 1').catch(error => {
						console.error(error);
					});
				}, 1.8e+6);
				console.log('DATABASE: 30mins keep alive started');
			});
		});
	}
	public static query(sql: string, ...args: unknown[]) {
		if (!this._isConnected) return Promise.reject(new Error('Database not connected'));
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