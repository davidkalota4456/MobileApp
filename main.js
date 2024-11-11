const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database.js');
const userRoutes =   require('./routes/userRoutes'); // Import your routes
const productsRoutes = require('./routes/Product');
const discountRouter = require('./routes/discount'); 
const cartRoutes =   require('./routes/Cart'); // Import your routes
const clientsMsgRoutes =   require('./routes/LiveMessage'); 
const ratingRoutes =   require('./routes/rating'); 

const app = express();


app.use(cors());
app.use(express.json());

// USE THIS ONLY WHEN YOU WANT OPERITION ON DB 

//sequelize.sync().then(() => {
//    console.log('Database & tables created!');
//});

//sequelize.sync({ force: false, alter: true })  // 'alter' will sync the models, but won't drop data
//    .then(() => {
//        console.log('Database synced!');
//    })
//    .catch((err) => {
//        console.error('Error syncing database: ', err);
//    });


// Use routes
app.use('/userRoutes', userRoutes); // Prefix your routes
app.use('/Product', productsRoutes);
app.use('/Cart', cartRoutes);
app.use('/LiveMessage', clientsMsgRoutes);
app.use('/discount', discountRouter);
app.use('/rating', ratingRoutes);

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
