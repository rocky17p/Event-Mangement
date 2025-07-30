const express = require('express');
const {
    createEvent,
    getEventDetails,
    registerForEvent,
    cancelRegistration,
    listUpcomingEvents,
    getEventStats
} = require('../controller/eventController');

const router = express.Router();

router.post('/', createEvent);
router.get('/:id', getEventDetails);
router.post('/register', registerForEvent);
router.post('/cancel', cancelRegistration);
router.get('/', listUpcomingEvents);
router.get('/:id/stats', getEventStats);

module.exports = router;
