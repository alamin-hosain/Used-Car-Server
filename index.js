const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());


// Server running adn Check Api
app.get('/', (req, res) => {
    res.send('Server up and Running')
})

app.get(port, () => {
    console.log('Server running on port: ', port);
})