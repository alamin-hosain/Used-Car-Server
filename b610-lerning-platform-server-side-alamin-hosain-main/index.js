const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors())

const Port = process.env.Port || 5000;
const courses = require('./data/courses.json');
const categories = require('./data/categories.json')

app.get('/', (req, res) => {
    res.send('Api Server is Running')
})

app.get('/courses', (req, res) => {
    res.send(courses);
})

app.get('/courses/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const singleCourse = courses.find(course => course.id === id);
    console.log(singleCourse);
    res.send(singleCourse);
})

app.get('/categories', (req, res) => {
    res.send(categories);
})

app.get('/category/:id', (req, res) => {
    const id = req.params.id;
    if (id === '00') {
        res.send(courses);
    }
    else {
        const singleCategoryCourses = courses.filter(course => course.category_id === id);

        res.send(singleCategoryCourses)
    }
})



app.listen(Port, () => {
    console.log('Server is up and Running')
})