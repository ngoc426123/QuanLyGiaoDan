import Database from 'better-sqlite3-multiple-ciphers'

const database = new Database(process.argv[2])
database.pragma('journal_mode = WAL')
database.exec('CREATE TABLE IF NOT EXISTS durability_records (id INTEGER PRIMARY KEY, value TEXT)')
database.exec('BEGIN IMMEDIATE')
database.prepare('INSERT INTO durability_records (value) VALUES (?)').run('uncommitted')
process.send?.('write-started')

setInterval(() => {}, 1_000)
