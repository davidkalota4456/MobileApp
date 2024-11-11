// models/CartItem.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import


const CartItem = sequelize.define('CartItem', {
    cartOwner: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    cartId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    productPrice: {
        type: DataTypes.FLOAT,  // Use FLOAT for price values
        allowNull: false,  // Ensure product price is always required
    },
    discountedPrice: {
        type: DataTypes.FLOAT,  // Use FLOAT for discounted price
        allowNull: true,  // Allow null for discounted price
        defaultValue: null,  // Default to null if no discount is applied
    },
});

module.exports =CartItem;
