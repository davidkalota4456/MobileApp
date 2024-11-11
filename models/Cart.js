// models/Cart.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import


const Cart = sequelize.define('Cart', {
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    totalAmountSumer: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    totalProductsPurchesCounter: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ACTIVE', // Default status is 'ACTIVE'
        validate: {
            isIn: [['ACTIVE', 'NOT ACTIVE']], // Ensures only 'ACTIVE' or 'NOT ACTIVE' are valid
        },
    }    
});

module.exports = Cart;
