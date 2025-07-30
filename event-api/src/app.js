const express = require('express');
require('dotenv').config();

const usersRouter = require('./routes/users');
const eventsRouter = require('./routes/events');

const app = express();
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/events', eventsRouter);

app.listen(process.env.PORT, () => {
    console.log(` Server running on port ${process.env.PORT}`);
});
