// models/User.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import

const User = sequelize.define('User', {
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    faceImage: {  // New field for storing the user's face image
        type: DataTypes.STRING,  // You can use STRING to store the URL or path to the image
        allowNull: true,         // Allow this field to be null
    },
});

module.exports = User; // Use module.exports instead of export default
