var config = {
    connectionLimit : 10,
    host            : process.env.MYSQL_HOST || '127.0.0.1',
    user            : process.env.MYSQL_USER || 'root',
    password        : process.env.MYSQL_PASSWORD || '!@#123QWEasdzxc',
    database        : process.env.DB_NAME || 'advocacy'
};

module.exports = config;
