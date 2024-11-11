// models/Rating.js
const { DataTypes } = require('sequelize'); // Use require instead of import
const sequelize = require('../config/database.js'); // Use require instead of import

const rating = sequelize.define('Rating', {
    username: {
        type: DataTypes.STRING,
        allowNull: false, // Ensure this field is required
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1, // Minimum rating
            max: 5, // Maximum rating (adjust if necessary)
        },
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true, // Optional field for comments
    },
    productName: { // New field added
        type: DataTypes.STRING,
        allowNull: false, // Ensure this field is required
    },
}, {
    // Adding timestamps options
    timestamps: true, // This will create `createdAt` and `updatedAt` fields
    createdAt: 'createdAt', // Optional: You can rename the createdAt field if needed
    updatedAt: 'updatedAt', // Optional: You can rename the updatedAt field if needed
});

module.exports = rating;
