const express = require('express');
const Rating = require('../models/rating'); // Ensure Rating model has productId, username, rating, and note fields
const router = express.Router();
const Product = require('../models/Product');
const rating = require('../models/rating');

// POST: Create or update a rating
router.post('/', async (req, res) => {
  const { productId, rating, username, note } = req.body; // Get productId, rating, username, and note from the request body

  try {
      // Validate input
      if (!productId || rating === undefined) {
          return res.status(400).json({ message: 'Invalid input: productId and rating are required' });
      }

      // Find the product
      const product = await Product.findOne({ where: { id: productId } });
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }
      
      const productName = product.name;

      // Create a new rating entry
      const productRating = await Rating.create({ productName, username, rating, note });
      
      return res.status(201).json(productRating); // Return the created rating entry
  } catch (error) {
      console.error("Error creating product rating:", error);
      return res.status(500).json({ message: 'Server error' });
  }
});


// GET /rating - Fetch all ratings by productId from the request header
router.get('/', async (req, res) => {
  const productId = req.headers['x-product-id'];

  if (!productId) {
      return res.status(400).json({ message: 'Product ID is required in the header' });
  }
  const product = await Product.findOne({ where: { id: productId } });
      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }
      
      const productName = product.name;

  try {
      // Fetch all ratings for the specified product ID
      const ratings = await Rating.findAll({
          where: { productName },
          attributes: ['username', 'rating', 'note'], // Only fetch relevant fields
      });
      

      // Check if ratings were found
      if (ratings.length === 0) {
          return res.status(200).json(ratings);
      }

      // Return the list of ratings
      return res.status(200).json(ratings);
  } catch (error) {
      console.error("Error fetching ratings:", error);
      return res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;

