const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// middle ware
dotenv.config()
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gcdspqh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        const usedProductsCollection = client.db('UsedCar').collection('products');
        const usersCollection = client.db('UsedCar').collection('users');
        const bookingCollection = client.db('UsedCar').collection('booking');


        // getting all the used products
        app.get('/used-cars', async (req, res) => {
            const usedcars = {};
            const result = await usedProductsCollection.find(usedcars).toArray();
            res.send(result)
        })

        // add used cars or products to database
        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await usedProductsCollection.insertOne(products);
            res.send(result)
        })

        // get products by user
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            console.log(email)
            const filter = { email: email };
            const result = await usedProductsCollection.find(filter).toArray();
            res.send(result)
        })


        // getting all category products
        app.get('/category/:id', async (req, res) => {
            const id = parseFloat(req.params.id);
            const query = { categoryId: id };
            const result = await usedProductsCollection.find(query).toArray();
            res.send(result)
        })

        // Send Token adn Save User
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: user.role,
                    displayName: user.displayName,
                    photoURL: user.photoURL
                }
            };
            console.log(updateDoc);
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token });

        })

        // get all the user
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const users = await usersCollection.find(query).toArray();
            res.send(users)
        })

        // get all sellers
        app.get('/allsellers', async (req, res) => {
            const query = { role: 'Seller' };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // // get all buyers
        app.get('/allbuyers', async (req, res) => {
            const query = { role: 'Buyer' };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // Deleting a Seller 
        app.delete('/allsellers/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        // Updating a seller 
        app.put('/allsellers', async (req, res) => {
            const email = req.query.email;
            const status = req.body;
            console.log(status, email)
            const filter = { email: email };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    status,
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })


        // Adding Booking Collection to the db
        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = {
                carName: booking.carName,
            }
            const alreadyBooked = await bookingCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You already booked this ${booking.carName}`;
                return res.send({ acknowledge: false, message })
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })

        // getting all the booking by user
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })


    }


    finally {

    }
}
run().catch(e => console.log(e))








// Server running adn Check Api
app.get('/', async (req, res) => { res.send('Used Car Server Running') })
app.listen(port, () => console.log('Server running on port', port))