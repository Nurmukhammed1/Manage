const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(helmet()); // Security Middleware
app.use(morgan('combined')); // Logging Middleware

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:12345@cluster0.r7c35.mongodb.net/manage?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Enable CORS
app.use(cors());

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));


// Routes
app.use('/users', userRoutes); // User routes
app.use('/events', eventRoutes); // Event routes
app.use('/registrations', registrationRoutes); // Registration routes

// Change Stream for New Event Notifications
db.watch([{ $match: { 'ns.coll': 'events' } }]).on('change', change => {
    console.log('New Event Change:', change);
});

app.listen(3000, () => console.log('Server running on port 3000'));