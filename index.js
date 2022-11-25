const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middle ware
dotenv.config()
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gcdspqh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

console.log(uri)
async function run() {
    try {

        const usedProductsCollection = client.db('UsedCar').collection('products');


        // getting all the used products
        app.get('/used-cars', async (req, res) => {
            const usedcars = {};
            const result = await usedProductsCollection.find(usedcars).toArray();
            res.send(result)
        })


        // getting all category products
        app.get('/category/:id', async (req, res) => {
            const id = parseFloat(req.params.id);
            const query = { categoryId: id };
            const result = await usedProductsCollection.find(query).toArray();
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