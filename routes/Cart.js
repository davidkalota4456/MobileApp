const express = require('express');
require('dotenv').config();
const Cart = require('../models/Cart');
const Discount = require('../models/Discount.js');
const Product = require('../models/Product.js');
const { where } = require('sequelize');
const router = express.Router();
const secretKey = process.env.SECRET_KEY;
const { Op } = require('sequelize'); // Use require for Node.js
const CartItem = require('../models/CartItem');
const UserDiscount = require('../models/UserDiscount.js');
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');


const authenticateUser = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token

    if (!token) {
        console.error('No token provided');
        return res.status(200).json({
            success: false,
            message: 'You need to log in first!',
            errorType: 'authentication',
        });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err && token) {
            console.error('JWT verification error:', err.message);
            return res.status(401).json({ message: 'Unauthorized' });
        }

        console.log('Decoded token:', decoded); // Log the decoded token
        req.userName = decoded.username; // Set the username from the decoded token
        console.log('UserName set to:', req.userName); // Log to verify the value
        next(); // Proceed to the next middleware or route handler
    });
};

// Function to extract the summerOrCounter value


// Function to handle timer discounts
const handleTimerDiscountAndNoDiscount = async (productName, productPrice, cart) => {
    console.log('<--------------->im runing also<----------------------->')
    cart.totalAmountSumer += productPrice;
    cart.totalProductsPurchesCounter += 1; // Increment the product count
    await cart.save(); // Save the updated cart

    // Create a new cart item with the timer discount applied
    await CartItem.create({
        cartOwner: cart.userName, // Assuming cart.userName has the user's name
        cartId: cart.id, // Use the cart ID from the cart entry
        productName: productName,
        productPrice: productPrice,
        discountedPrice: null // Assuming no additional discount is applied, set to null
    });
    console.log('IM FUCKING HERE______>>>')

};


const applyDiscount = async (req, cart, productName, productPrice, extractSummerOrCounter2, percentage, typeOffDiscount) => {
    // Retrieve the discount ID for 'All Products'
    const discountRange = await Discount.findOne({
        where: { productName: 'All Products' }
    });
    
    const idOffDiscount = discountRange.id;

    // Determine the count to use for discount eligibility
    const cartCount = typeOffDiscount === 'basedOnCounterOffProduct' ? cart.totalProductsPurchesCounter : cart.totalAmountSumer;

    // Check if the user already has a discount applied for this product
    const existingUserDiscount = await UserDiscount.findOne({
        where: { userName: req.userName, discountId: idOffDiscount }
    });

    if (extractSummerOrCounter2 <= cartCount && existingUserDiscount) {
        // User has already received a discount, do not apply again
        console.log('User has already received the discount for this product, skipping.');
        console.log('11111111111111111111111111');

        // Normal addition without discount
        cart.totalAmountSumer += productPrice;
        cart.totalProductsPurchesCounter += 1;
        await cart.save();

        await CartItem.create({
            cartOwner: req.userName,
            cartId: cart.id,
            productName: productName,
            productPrice: productPrice,
            discountedPrice: null // No discount applied
        });
    } else if (cartCount >= extractSummerOrCounter2 && !existingUserDiscount) {
        // Apply the discount for the first time
        console.log('SECOND CONDITION IS MET >>>>');
        console.log('222222222222222');
        const discountPriceCalculation = productPrice - (productPrice * percentage);
        console.log('Discounted Price Calculation:', discountPriceCalculation);
        
        // Add product to cart with discount
        cart.totalAmountSumer += discountPriceCalculation;
        cart.totalProductsPurchesCounter += 1;
        await cart.save();

        await CartItem.create({
            cartOwner: req.userName,
            cartId: cart.id,
            productName: productName,
            productPrice: productPrice,
            discountedPrice: discountPriceCalculation 
        });

        // Apply discount for the first time
        await UserDiscount.create({
            userName: req.userName,
            discountId: idOffDiscount,
        });
    } else {
        // User doesn't qualify for a discount; add product at full price
        console.log('3333333333333');
        cart.totalAmountSumer += productPrice;
        cart.totalProductsPurchesCounter += 1;
        await cart.save();

        await CartItem.create({
            cartOwner: req.userName,
            cartId: cart.id,
            productName: productName,
            productPrice: productPrice,
            discountedPrice: null // No discount applied
        });
    }
};




const getProductPurposeByName = async (productName) => {
    try {
        const product = await Product.findOne({
            where : {name: productName}
        })
        // Find the discount with the specified product name
        const discount = await Discount.findOne({
            where: { productPurpose : product.useCase }
        });

        // Check if the discount exists and return the productPurpose
        return discount ? discount.productPurpose : null;
    } catch (error) {
        console.error('Error fetching product purpose:', error);
        throw new Error('Unable to fetch product purpose');
    }
};


const sectionsHandlesDiscounts = async (req, productName, productPrice, cart) => {
    try {
        // Retrieve all discounts where productName is null and productPurpose is not null
        const allTypeOffDiscounts = await Discount.findAll({
            where: { productName: 'Discount Base On Pages', productPurpose: { [Op.ne]: null } }
        });
        console.log(allTypeOffDiscounts.length);

        const productPurpose = await getProductPurposeByName(productName);

        // Filter discounts that match the product purpose
        const discountMatch = allTypeOffDiscounts.filter(discount => discount.productPurpose === productPurpose);
        console.log(discountMatch.length);

        // Case 1: No matching discounts and no discounts available
        if (discountMatch.length === 0 && allTypeOffDiscounts.length === 0) {
            return null; // No discounts available at all
        }

        // Case 2: No matching discounts but discounts available
        if (discountMatch.length === 0 && allTypeOffDiscounts.length) {
            cart.totalAmountSumer += productPrice;
            cart.totalProductsPurchesCounter += 1;
            await cart.save();

            await CartItem.create({
                cartOwner: req.userName,
                cartId: cart.id,
                productName: productName,
                productPrice: productPrice,
                discountedPrice: null 
            });
        }

        // Since we have a match, continue processing
        const discount = discountMatch[0]; // Use the first matching discount
        const discountLimitation = discount.summerOrCounter;
        const percentage = discount.percentage;
        const cartCount = discount.typeDiscount === 'basedOnCounterOffProduct' ? cart.totalProductsPurchesCounter : cart.totalAmountSumer;

        const existingUserDiscount = await UserDiscount.findOne({
            where: { userName: req.userName }
        });

        // Case 3: User has an existing discount but hasn't reached the limitation
        if (!existingUserDiscount && cartCount < discountLimitation || 
            existingUserDiscount && cartCount >= discountLimitation) {
            cart.totalAmountSumer += productPrice;
            cart.totalProductsPurchesCounter += 1;
            await cart.save();

            await CartItem.create({
                cartOwner: req.userName,
                cartId: cart.id,
                productName: productName,
                productPrice: productPrice,
                discountedPrice: null 
            });
        }

        // Case 4: Apply discount if conditions are met
        if (!existingUserDiscount && cartCount >= discountLimitation) {
            const discountPriceCalculation = productPrice - (productPrice * percentage);
            console.log('Discounted Price Calculation:', discountPriceCalculation);

            // Update cart totals with discounted price
            cart.totalAmountSumer += discountPriceCalculation;
            cart.totalProductsPurchesCounter += 1;
            await cart.save();

            await CartItem.create({
                cartOwner: req.userName,
                cartId: cart.id,
                productName: productName,
                productPrice: productPrice,
                discountedPrice: discountPriceCalculation 
            });

            // Apply discount for the first time
            await UserDiscount.create({
                userName: req.userName,
                discountId: discount.id, // Reference the current discount's ID
            });
        }

        // Return success with discount details
        return { success: true, discountedPrice: cart.totalAmountSumer };

    } catch (error) {
        console.error('Error in sectionsHandlesDiscounts:', error);
        return { success: false, message: 'An error occurred while handling discounts.' };
    }
};




router.post('/add-to-cart', authenticateUser, async (req, res) => {
    try {
        console.log('Request received with userName:', req.userName);

        const { productName, productPrice, productHaveTimerDiscount = false } = req.body;

        // Ensure the user is authenticated and has a username
        if (!req.userName) {
            return res.status(400).json({ message: 'User name is required.' });
        }
        console.log('i am the value off timer discount', productHaveTimerDiscount)

        // Find all applicable discounts for 'All Products'
        let discountRange = null; // Use a different variable name to avoid shadowing
        try {
            discountRange = await Discount.findOne({
                where: { productName: 'All Products' }
            });

        } catch (error) {
            console.error('Error fetching discount:', error);
            return res.status(500).json({ message: 'Error fetching discount' });
        }

        // Find the active cart for the user
        let cart = await Cart.findOne({ where: { userName: req.userName, status: 'ACTIVE' } });

        if (!cart) {
            return res.status(400).json({ message: 'No active cart found for this user.' });
        }

        // Retrieve the cart items for this cart (only the product names)
        let cartItems = await CartItem.findAll({
            where: { cartId: cart.id },
            attributes: ['productName'] // Only productName is returned
        });
        if (!cartItems.length) {
            cartItems = [];
        }
                // Check if discount logic should be applied
        let solution = null;
        if (!discountRange && !productHaveTimerDiscount) {
            solution = await sectionsHandlesDiscounts(req, productName, productPrice, cart);
        }

        // If timer discount or no solution found, apply timer discount or no discount logic
        if (productHaveTimerDiscount && !discountRange || solution === null && !discountRange) {
            await handleTimerDiscountAndNoDiscount(productName, productPrice, cart);
        }
        //let discountId = discountRange.id;
        let discountId = discountRange ? discountRange.id : null;


        // Handle discount logic based on different types
        if (discountRange) {
            console.log(' im the fucking DISCOUNT ID THIS IS MY ____ Discount ID:', discountId); // Log the discount ID for debugging
            
            if (discountId) { // Check if discountId is defined
                const CounterDiscount = discountRange.typeDiscount === 'basedOnCounterOffProduct';
                const SummerDiscount = discountRange.typeDiscount === 'sumOfProducts';

                // Handle counter-based discounts
                if (CounterDiscount) {
                    const extractSummerOrCounter2 = discountRange.summerOrCounter;
                    const percentage = discountRange.percentage;
                    const typeOffDiscount = discountRange.typeDiscount;
                    await applyDiscount(req, cart, productName, productPrice, extractSummerOrCounter2, percentage, typeOffDiscount);
                }

                // Handle sum-based discounts
                if (SummerDiscount) {
                    const extractSummerOrCounter2 = discountRange.summerOrCounter;
                    const percentage = discountRange.percentage;
                    const typeOffDiscount = discountRange.typeDiscount;
                    await applyDiscount(req, cart, productName, productPrice, extractSummerOrCounter2, percentage, typeOffDiscount);
                }
            } else {
                console.warn('Discount ID is undefined, skipping discount application.');
            }
        }

        // Send the updated cart and list of product names back to the client
        res.status(201).json({
            message: 'Product added to cart successfully',
            cart: {
                totalAmountSumer: cart.totalAmountSumer, // Include total sum
                items: cartItems.map(item => item.productName) // Return only the product names
            }
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});






// Example backend route to get cart items
router.get('/checkout', authenticateUser, async (req, res) => {  // Mark the function as async
    const userName = req.userName; // Get the username from the middleware

    try {
        // Use await here as the function is now async
        const findCart = await Cart.findOne({
            where: {
                [Op.and]: [
                    { userName: userName },
                    { status: 'ACTIVE' } 
                ]
            }
        });

        if (!findCart) {
            return res.status(404).json({ message: 'No active cart found for this user.' });
        }
        const cartId = findCart.id

        // Fetch cart items from your database based on the username
        const cartItems = await CartItem.findAll({
            where: { cartId: cartId },
            attributes: ['id', 'cartOwner', 'productName', 'productPrice', 'discountedPrice'] // Only fetch the specified fields
        });

        const data = {
            totalSum: findCart.totalAmountSumer,
            counter: findCart.totalProductsPurchesCounter,
            items: cartItems
        };
        
        res.json(data);
    } catch (error) {
        console.error('Error finding cart:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/checkout', authenticateUser, async (req, res) => {
    const userName = req.userName;
    try {
        // Find the active cart for the user using their fullName (username)
        const findCart = await Cart.findOne({
            where: {
                [Op.and]: [
                    { userName: userName },
                    { status: 'ACTIVE' } 
                ]
            }
        });

        if (!findCart) {
            return res.status(400).json({ message: 'No active cart found for this user.' });
        }

        // Update the cart status to 'NOT ACTIVE' after checkout
        findCart.status = 'NOT ACTIVE';
        await findCart.save();

        const findDiscount = await UserDiscount.findOne({ where: { userName } });
        if (findDiscount) {
            await findDiscount.destroy();
        }
        // Return a success message
        res.status(200).json({
            message: 'Checkout successful. Cart marked as inactive and discount removed.',
        });
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET route to fetch a cart by userId
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const cart = await Cart.findOne({ where: { userId } });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT route to update the cart (e.g., when products are added/removed)
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { totalAmount, totalProductsPurchesCounter } = req.body;

    try {
        const cart = await Cart.findOne({ where: { userId } });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        await cart.update({
            totalAmount: totalAmount || cart.totalAmount,
            totalProductsPurchesCounter: totalProductsPurchesCounter || cart.totalProductsPurchesCounter,
        });

        res.status(200).json({ message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE route to clear a cart by userId (e.g., emptying the cart)


router.delete('/delete/:itemId', authenticateUser, async (req, res) => {
    const userName = req.userName;
    const itemId = req.params.itemId;

    try {
        // Find the cart item by its ID and ensure it belongs to the user
        const cartItem = await CartItem.findOne({ 
            where: { 
                id: itemId,
                cartOwner: userName // Ensure the item belongs to the user's cart
            }
        });

        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found or does not belong to you.' });
        }

        // Find the active cart for the user
        const cart = await Cart.findOne({ where: { userName, status: 'ACTIVE' } });
        if (!cart) {
            return res.status(400).json({ message: 'No active cart found for this user.' });
        }

        // Adjust cart totals based on the item being deleted
        const priceToSubtract = cartItem.discountedPrice !== null ? cartItem.discountedPrice : cartItem.productPrice;
        cart.totalAmountSumer -= priceToSubtract;
        cart.totalProductsPurchesCounter -= 1;

        // Save updated cart totals
        await cart.save();

        // If the deleted item had a discount applied, remove the discount record for this user
        if (cartItem.discountedPrice !== null) {
            await UserDiscount.destroy({
                where: {
                    userName: userName // Assuming `discountId` is stored in `cartItem`
                }
            });
        }

        // Delete the cart item
        await cartItem.destroy();

        // Fetch updated cart items
        const updatedCartItems = await CartItem.findAll({
            where: { cartId: cart.id },
            attributes: ['productName', 'productPrice', 'discountedPrice']
        });

        // Respond with the updated cart data
        res.status(200).json({
            message: 'Cart item deleted successfully',
            cart: {
                totalAmountSumer: cart.totalAmountSumer,
                totalProductsPurchesCounter: cart.totalProductsPurchesCounter,
                items: updatedCartItems.map(item => ({
                    productName: item.productName,
                    productPrice: item.productPrice,
                    discountedPrice: item.discountedPrice
                }))
            }
        });
    } catch (error) {
        console.error('Error deleting cart item:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;
