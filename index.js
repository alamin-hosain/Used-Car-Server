const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// middle ware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gcdspqh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// verification jwt
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {

        const usedProductsCollection = client.db('UsedCar').collection('products');
        const usersCollection = client.db('UsedCar').collection('users');
        const bookingCollection = client.db('UsedCar').collection('booking');
        const advertisedProductsCollection = client.db('UsedCar').collection('advertisedProducts');
        const paymentCollection = client.db('UsedCar').collection('payments');

        // getting all the used products
        app.get('/used-cars', async (req, res) => {
            const usedcars = {};
            const result = await usedProductsCollection.find(usedcars).toArray();
            const paidProduct = await paymentCollection.find({}).toArray();
            console.log(paidProduct);
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
            const filter = { email: email };
            const result = await usedProductsCollection.find(filter).toArray();
            res.send(result)
        })

        // Delete single products
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usedProductsCollection.deleteOne(query);
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
            const result = await usersCollection.updateOne(filter, updateDoc, options);

            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
                return res.send({ token, result })
            }

            res.status(403).send({ token: '' })
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


        // get all Admin
        app.get('/alladmin', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // // get all buyers
        app.get('/allbuyers', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodeEmail = req.decoded.email;
            if (email !== decodeEmail) {
                return res.status(403).send({ message: 'Forbidden Accesss' })
            }
            const query = { role: 'Buyer' };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // Deleting a Seller 
        app.delete('/allsellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        // Deleting a Buyer 
        app.delete('/allbuyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })

        // Updating a seller 
        app.put('/allsellers', async (req, res) => {
            const email = req.query.email;
            const userStatus = req.body;

            const filter = { email: email };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    status: userStatus.status,
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

        // deleting a single book
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result)
        })

        // getting all the booking by user
        app.get('/booking', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        // get booking by id
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        })

        // advertisement products add
        app.post('/advertisement', async (req, res) => {
            const product = req.body;
            const result = await advertisedProductsCollection.insertOne(product);
            res.send(result)
        })

        // get all the advertise products
        app.get('/advertisement', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const result = await advertisedProductsCollection.find(query).toArray();
            res.send(result)
        })


        app.get('/advertise', async (req, res) => {
            const query = {};
            const result = await advertisedProductsCollection.find(query).toArray();
            res.send(result)
        })
        // delete advertsie product
        app.delete('/advertisement/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }
            const result = await advertisedProductsCollection.deleteOne(query);
            res.send(result)
        })

        // payment integration
        app.post('/payment', async (req, res) => {
            const booking = req.body;
            const price = booking.resalePrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // Payment collection adding to the database
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const id = payment.bookingId;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const result = await paymentCollection.insertOne(payment);
            const updatedResult = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result)
        })
    }




    finally {

    }
}
run().catch(e => console.log(e))








// Server running adn Check Api
app.get('/', async (req, res) => { res.send('Used Car Server Running') })
app.listen(port, () => console.log('Server running on port', port))