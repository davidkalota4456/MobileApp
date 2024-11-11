// models/UserDiscount.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import

const UserDiscount = sequelize.define('UserDiscount', {
    userName: {
        type: DataTypes.STRING, // ID of the user using the discount
        allowNull: false,
    },
    discountId: {
        type: DataTypes.INTEGER, // ID of the applied discount
        allowNull: false,
    },
}, {
    timestamps: true, // This will add createdAt and updatedAt
});

module.exports = UserDiscount;
