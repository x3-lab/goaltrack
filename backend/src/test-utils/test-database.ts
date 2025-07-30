const { MongoClient } = require('mongodb');

let connection;
let db;

const connectToDatabase = async () => {
    if (!connection) {
        connection = await MongoClient.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = connection.db(process.env.DB_NAME);
    }
    return db;
};

const closeDatabase = async () => {
    if (connection) {
        await connection.close();
        connection = null;
        db = null;
    }
};

module.exports = {
    connectToDatabase,
    closeDatabase,
};