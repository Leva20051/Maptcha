const mySQL = require('mysql2/promise');
require('dotenv').config();

const connectionPool = mySQL.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'replaceWithPassword', // No DB password set yet
    database: process.env.DB_NAME || 'cafe_curator',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Connection test
connectionPool.getConnection().then(connection => {
        console.log('Successfully connected to the Cafe Curator MySQL DB');
        connection.release();
    }).catch(error => {
        console.error('Database connection failed: ', error.message);
    });

    module.exports = connectionPool;