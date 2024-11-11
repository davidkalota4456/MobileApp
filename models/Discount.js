// models/Discount.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import

const Discount = sequelize.define('Discount', {
    productName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    percentage: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    validUntilHoursOrDays: { // Fixed the spelling
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    productPurpose: { // Fixed the spelling
        type: DataTypes.STRING,
        allowNull: true,
    },
    typeDiscount: {
        type: DataTypes.ENUM('basedOnCounterOffProduct', 'sumOfProducts'), // Corrected the enum values
        allowNull: true,
    },
    summerOrCounter: {
        type: DataTypes.INTEGER, // Ensure this is the correct type
        allowNull: true,
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Automatically sets the start time to current time
    },

}, {
    // Adding timestamps options
    timestamps: true, // This will create `createdAt` and `updatedAt` fields
    createdAt: 'createdAt', // Optional: You can rename the createdAt field if needed
    updatedAt: 'updatedAt' // Optional: You can rename the updatedAt field if needed
});

module.exports = Discount;
