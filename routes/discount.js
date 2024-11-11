// routes/discounts.js
const express = require('express');
const Discount  = require('../models/Discount'); // Adjust path as necessary
const { Op } = require('sequelize');
const Product = require('../models/Product');

const router = express.Router();


router.post('/timer', async (req, res) => {
    try {
        const {
            productName,
            percentage,
            validUntilHoursOrDays, // This will hold either hours or days
            productPourpes,
            typeDiscount,
            durationType, // 'HOURS' or 'DAYS'
        } = req.body;

        // Validate that durationType is providedss
        if (!durationType) {
            console.log('you dident sends DAY OT HOURS in here <><><><>')
            return res.status(400).json({ message: 'durationType is required.' });
        }
        

        let hoursUntilDiscountEnds;
        const decimalPercentage = percentage / 100;
        // Check the duration type
        if (durationType === 'days') {
            hoursUntilDiscountEnds = validUntilHoursOrDays * 24; // Convert days to hours
        } else if (durationType === 'hours') {
            hoursUntilDiscountEnds = validUntilHoursOrDays; // Keep hours as is
        } else {
            return res.status(400).json({ message: 'Invalid durationType. Please specify "DAYS" or "HOURS".' });
        }

        // Create the discount in the database
        const discount = await Discount.create({
            productName,
            percentage: decimalPercentage,
            validUntilHoursOrDays: hoursUntilDiscountEnds, // Store the calculated hours
            productPourpes,
            typeDiscount,
            startTime: new Date(),
        });

        // Return the created discount
        res.status(201).json(discount);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating discount', error });
    }
});

// GET route to retrieve product names with an active timer discount
router.get('/time', async (req, res) => {
    try {
        // Retrieve discounts with active timer discounts
        const discounts = await Discount.findAll({
            attributes: ['productName', 'validUntilHoursOrDays', 'percentage', 'startTime'],
            where: {
                validUntilHoursOrDays: { [Op.gt]: 0 }
            }
        });

        // Create an array to hold the discount objects with prices
        const discountsData = await Promise.all(discounts.map(async (discount) => {
            // Find the product price for each discount's productName
            const product = await Product.findOne({
                attributes: ['price'],
                where: { name: discount.productName }
            });

            // If product exists, calculate new price and time remaining
            if (product) {
                const originalPrice = product.price;
                const discountAmount = originalPrice * discount.percentage;
                const newPrice = originalPrice - discountAmount;
                const discountDuration = discount.validUntilHoursOrDays * 3600000; // Convert hours to milliseconds
                const discountEndTime = new Date(discount.startTime).getTime() + discountDuration; // Calculate end time

                const currentTime = new Date().getTime();
                const timeRemaining = Math.max(0, discountEndTime - currentTime); 

                console.log('this is the new price for the discount<-------->', newPrice);

                return {
                    productName: discount.productName,
                    timeRemaining: timeRemaining,
                    newPrice: parseFloat(newPrice.toFixed(2)), // Rounds to 2 decimal places
                };
            }
            return null; // If product not found
        }));

        // Filter out null results (products not found)
        const activeDiscounts = discountsData.filter(discount => discount !== null && discount.timeRemaining > 0);
        console.log('Active discounts:', activeDiscounts);



        console.log(activeDiscounts);
        res.status(200).json(activeDiscounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving products with timer discounts', error });
    }
});


router.get('/deleteTime/:productName', async (req, res) => {
    try {
      const { productName } = req.params;
      const discount = await Discount.findOne({
        where: { productName },
      });
  
      if (!discount) {
        return res.status(404).json({ message: 'Discount not found' });
      }
  
      const startTime = new Date(discount.startTime).getTime();
      const currentTime = Date.now();
      const discountDuration = discount.validUntilHoursOrDays * 3600 * 1000; // Convert hours to milliseconds
  
      // Calculate remaining time in milliseconds
      const timeRemaining = startTime + discountDuration - currentTime;
  
      if (timeRemaining <= 0) {
        // Delete the discount if it has expired
        await Discount.destroy({
          where: { productName },
        });
        return res.status(200).json({ productName, timeRemaining: 0 });
      }
  
      // Respond with the time remaining if the discount is still active
      res.status(200).json({
        productName,
        timeRemaining, // Time remaining in milliseconds
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving discount timer', error });
    }
  });
  




const getAllProductsDiscount = async () => {
    return await Discount.findOne({
        where: { productName: 'All Products' }
    });
    
};


router.post('/oneSection', async (req, res) => {
    try {
        
        const {
            percentage,
            validUntilHoursOrDays,
            productPourpes,
            typeDiscount,
            summerOrCounter,
        } = req.body;
        console.log('IM THE FUCKING PORPESEEEEEE <>', productPourpes);

        // Convert percentage to decimal
        const decimalPercentage = percentage / 100;

        // Check if a discount already exists for "All Products"
        const existingAllProductsDiscount = await getAllProductsDiscount();

        if (existingAllProductsDiscount) {
            return res.status(400).json({ message: 'A discount for All Products already exists' });
        }

        // Check if a discount exists for the given product purpose
        const existingSectionDiscount = await Discount.findOne({
            where: { productPurpose : productPourpes }
        });

        if (existingSectionDiscount) {
            return res.status(400).json({ message: `A discount for ${productPourpes} already exists` });
        }

        // Create the discount
        const discountCreation = await Discount.create({
            productName: 'Discount Base On Pages',
            percentage: decimalPercentage, // Use decimal format
            validUntilHoursOrDays,
            productPurpose: productPourpes,
            typeDiscount,
            summerOrCounter,
        });
        
        res.status(201).json(discountCreation);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating discount', error });
    }
});




// Get all discounts
router.post('/apply-to-all', async (req, res) => {
    try {
        const {
            percentage,
            validUntilHoursOrDays,
            productPourpes,
            typeDiscount,
            summerOrCounter,
        } = req.body;

        // Validate typeDiscount
        const validTypeDiscounts = ['basedOnCounterOffProduct', 'sumOfProducts'];
        if (!validTypeDiscounts.includes(typeDiscount)) {
            return res.status(400).json({ message: 'Invalid typeDiscount provided' });
        }

        // Check if a discount for 'All Products' already exists
        const existingDiscount = await Discount.findOne({
            where: { productName: 'All Products' },
        });

        if (existingDiscount) {
            return res.status(400).json({ message: 'A discount for All Products already exists' });
        }

        // Convert percentage to decimal
        const percentageConvert = percentage / 100;

        // Create the discount
        const discount = await Discount.create({
            productName: 'All Products', // Indicates this discount is for all products
            percentage: percentageConvert,
            validUntilHoursOrDays,
            productPourpes,
            typeDiscount,
            summerOrCounter,
        });

        res.status(201).json(discount);
    } catch (error) {
        console.error('Error creating discount:', error);
        res.status(500).json({ message: 'Error creating discount', error: error.message });
    }
});



router.delete('/remove-all', async (req, res) => {
    try {
        // Find and delete the discount for 'All Products'
        const deletedDiscount = await Discount.destroy({
            where: { productName: 'All Products' }
        });

        // Check if any discount was deleted
        if (!deletedDiscount) {
            return res.status(404).json({ message: 'No discount for All Products found' });
        }

        return res.status(200).json({ message: 'Discount for All Products successfully deleted' });
    } catch (error) {
        console.error(error);
        return res.status(400).json({ message: 'Error deleting discount', error });
    }
});

router.delete('/byProductName', async (req, res) => {
    try {
        const { productName } = req.body; // Get the product name from the request body
        if (!productName) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        // Find and delete the discount associated with the provided product name
        const deleted = await Discount.destroy({
            where: { productName: productName },
        });

        if (deleted) {
            res.status(204).send(); // No content to send back
        } else {
            res.status(404).json({ message: 'Discount not found for the provided product name' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting discount', error });
    }
});

router.get('/', async (req, res) => {
    try {
        // Fetch the discount specifically for 'All Products'
        const discount = await Discount.findAll();

        // Check if the discount was found
        if (discount) {
            res.status(200).json(discount);
        } else {
            res.status(200).json({ message: 'You Got No Discounts Set' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving discount', error });
    }
});




router.get('/all', async (req, res) => {
    try {
        // Fetch the discount specifically for 'All Products'
        const discount = await Discount.findOne({
            where: { productName: 'All Products' }
        });

        // Check if the discount was found
        if (discount) {
            res.status(200).json(discount);
        } else {
            res.status(404).json({ message: 'Discount for All Products not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving discount', error });
    }
});


// Update a discount by ID
router.put('/:id', async (req, res) => {
    try {
        const [updated] = await Discount.update(req.body, {
            where: { id: req.params.id },
        });
        if (updated) {
            const updatedDiscount = await Discount.findByPk(req.params.id);
            res.status(200).json(updatedDiscount);
        } else {
            res.status(404).json({ message: 'Discount not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error updating discount', error });
    }
});

// Delete a discount by ID
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Discount.destroy({
            where: { id: req.params.id },
        });
        if (deleted) {
            res.status(204).send(); // No content to send back
        } else {
            res.status(404).json({ message: 'Discount not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting discount', error });
    }
});

module.exports = router;
