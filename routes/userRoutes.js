const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User')
const Admin = require('../models/Admin'); // Import the Admin model
const jwt = require('jsonwebtoken');
require('dotenv').config();
const Cart = require('../models/Cart');
const secretKey = process.env.SECRET_KEY;

const router = express.Router();




router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({ 
            attributes: ['fullName', 'email'] // Select only the necessary fields
        });

        if (users.length === 0) {
            return res.status(200).json({ message: 'No users found', users: [] });
        }

        // Map the fullName to username to match the UserProfile interface
        const mappedUsers = users.map(user => ({
            username: user.fullName, // Rename fullName to username
            email: user.email,
        }));

        res.status(200).json(mappedUsers); // Send the mapped users as JSON response
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});







// Register a new user
router.post('/register', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ fullName, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper function to get or create an empty cart
const getOrCreateCart = async (userName) => {
    try {
        // Try to find an existing cart for the user
        let cart = await Cart.findOne({ 
            where: { 
                userName, 
                status: 'ACTIVE' // Only look for active carts
            } 
        });

        // If no cart exists, create a new one
        if (!cart) {
            cart = await Cart.create({
                userName: userName,
                totalAmountSumer: 0,
                totalProductsPurchesCounter: 0,
            });
        }

        return cart;
    } catch (error) {
        console.error('Error getting or creating cart:', error);
        throw new Error('Could not get or create cart');
    }
};



// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Use username instead of email

    if (!email || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ where: { email : email } }); 
        if (!user) {
            return res.status(400).json({ message: 'Username does not exist. Please register first.' });
        }


        if (user) {         
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid username or password' });
            }

            // Generate JWT token with only the username for users
            const token = jwt.sign({ username: user.fullName }, secretKey, { expiresIn: '1h' }); 
            // CREATE USER A CART AFTER HE LOGIN MY APP 
            const cart = await getOrCreateCart(user.fullName);
            console.log('<<i created a token and cart for this user>>')

            return res.status(200).json({ token }); // Return the token for user
        }

        // If user not found, check if admin exists
        const admin = await Admin.findOne({ where: { username } }); // Check for admin username
        if (!admin) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Validate admin password
        const isAdminPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isAdminPasswordValid) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Here, you can handle session creation or other login logic for admin
        return res.status(200).json({ message: 'Admin login successful', admin }); // Optionally return admin info
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router; // Export the router
