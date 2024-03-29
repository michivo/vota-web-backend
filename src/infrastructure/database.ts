import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import config from 'config';
import { DatabaseOptions } from './databaseOptions';

export async function openDb() {
    const dbOptions: DatabaseOptions = config.get('database');

    console.log(`Opening database at ${dbOptions.path}`);

    return open({
        filename: dbOptions.path,
        driver: sqlite3.Database,
    })
}

export async function migrateDb() {
    const db = await openDb();
    await db.migrate();
}