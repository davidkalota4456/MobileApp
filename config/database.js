//// config/database.js
//const { Sequelize } = require('sequelize');
//require('dotenv').config();
//
//const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//    host: process.env.DB_HOST,
//    dialect: 'mysql',
//    port: process.env.DB_PORT,
//});
//
//module.exports = sequelize;







//// THIS IS THE FUCKING {PRODUCTION}
const { Sequelize } = require('sequelize');
require('dotenv').config();  // Load environment variables

// Using production environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME_PRODUCTION,
  process.env.DB_USER_PRODUCTION,
  process.env.DB_PASSWORD_PRODUCTION,
  {
    host: process.env.DB_HOST_PRODUCTION,
    dialect: 'mysql',
    port: process.env.DB_PORT_PRODUCTION,
    dialectOptions: {
      connectTimeout: 10000, // Set connection timeout in milliseconds (10 seconds)
    },
  }
);

module.exports = sequelize;
