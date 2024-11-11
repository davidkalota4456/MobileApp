const express = require('express');
const Product = require('../models/Product'); // Adjust the path if necessary
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const multer = require('multer');


const Discount = require('../models/Discount.js');

router.post('/', async (req, res) => {
    const { name, description, useCase, price, stock, pictures } = req.body;

    if (!name || !price || stock === undefined) {
        return res.status(400).json({ message: 'Name, price, and stock are required' });
    }

    try {
        const newProduct = await Product.create({
            name,
            description,
            useCase,
            price,
            stock,
            pictures: pictures || null, // Optional pictures
        });
        res.status(201).json({ message: 'Product created successfully', newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/all', async (req, res) => {
    try {
      // Fetch all products from the database
      const products = await Product.findAll(); // Adjust for MongoDB or another DB
  
      // Return the products in JSON format
      res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'An error occurred while fetching products' });
    }
  });

router.get('/names', async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await Product.findAll({attributes: ['name']}); // Adjust for MongoDB or another DB

    // Return the products in JSON format
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products' });
  }
});






// GET route to fetch all products
router.get('/', async (req, res) => {
    const useCase = req.query.useCase;

    try {
        const products = await Product.findAll({
            where: { useCase: useCase },
        });

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for the specified use case.' });
        }

        const productsWithImages = await Promise.all(products.map(async (product) => {
            const imageDir = path.join(__dirname, '..', 'public', 'images', product.name.trim());
            

            if (!fs.existsSync(imageDir)) {
                console.warn(`Image directory not found for product: ${product.name}`);
                return { ...product.dataValues, pictures: [] };
            }

            const imageFiles = fs.readdirSync(imageDir);
            

            const images = await Promise.all(imageFiles.map(async (file) => {
                const filePath = path.join(imageDir, file);
                if (!fs.existsSync(filePath)) {
                    console.warn(`File not found: ${filePath}`);
                    return null;
                }

                const imageData = fs.readFileSync(filePath);
                const base64Image = imageData.toString('base64');
                

                return `data:image/jpeg;base64,${base64Image}`;
            }));

            const filteredImages = images.filter(image => image !== null);

            return {
                ...product.dataValues,
                pictures: filteredImages,
            };
        }));
        res.json(productsWithImages);

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


const updatePricev = (product, newPrice, discount) => {
    // Check if the productName in the object matches the provided productName
    if (product.name === discount.productName) {
        // Update the product price
        product.price = newPrice;

        // Calculate remaining time for the discount (timer)
        const discountCreatedAt = new Date(discount.createdAt); // Get the discount creation time
        const now = new Date(); // Get the current time
        const timePassed = (now - discountCreatedAt) / (1000 * 60 * 60); // Convert time passed to hours

        let remainingTime = discount.validUntilHoursOrDays - timePassed; // Calculate remaining time
        remainingTime = remainingTime > 0 ? remainingTime : null; // If time has passed, set to 0

        product.timer = remainingTime; // Update the product's timer field with the remaining time
    }
    return product; // Return the updated product object
};


const getDiscountsForProducts = async (products) => {
    const productNames = products.map(product => product.name); // Collect product names
    
    // Fetch active discounts for these products
    const discounts = await Discount.findAll({
        where: {
            productName: {
                [Op.in]: productNames // Check for discounts on the products found
            },
        },
    });

    // Process discounts for the products
    for (let discount of discounts) {
        // Find the product associated with the discount
        const product = products.find(p => p.name === discount.productName);
        if (product) {
            // Calculate the new price based on the discount percentage
            const newPrice = product.price - (discount.percentage * product.price);
            updatePricev(product, newPrice, product.name); // Update the price
        }
    }

    return products; // Return the products array with updated prices
};

router.get('/onePage', async (req, res) => {
    try {
        const { productPurpes } = req.body; 
        if (!productPurpes) {
            return res.status(400).json({ message: 'productPurpes is required' });
        }

        // Fetch products based on the use case and check stock
        const products = await Product.findAll({
            where: {
                useCase: productPurpes, // Use the where clause correctly
                stock: {
                    [Op.gt]: 0 // Check that stock is greater than 0
                }
            }
        });

        // Check if products were found
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found in inventory for this use case' });
        }
        // Adding Timer Key So Ill Can pass the frontend the timer also  
        products = products.map(product => {
            product.timer = null;
            return product;
        });

        
        const productsWithDiscounts = await getDiscountsForProducts(products);

        // Return the products with updated prices
        res.status(200).json(productsWithDiscounts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error' });
    }
});





// GET route to fetch a specific product by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT route to update a product by ID
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, useCase, price, stock, pictures } = req.body;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update the product details
        await product.update({
            name: name || product.name,
            description: description || product.description,
            useCase: useCase || product.useCase,
            price: price || product.price,
            stock: stock !== undefined ? stock : product.stock,
            pictures: pictures || product.pictures,
        });

        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE route to delete a product by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.destroy();
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
