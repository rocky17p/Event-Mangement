const { pool } = require('../db');
const createEvent = async (req, res) => {
    const { title, event_date, location, capacity } = req.body;

    if (!title || !event_date || !location || !capacity) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (capacity <= 0 || capacity > 1000) {
        return res.status(400).json({ error: 'Capacity must be between 1 and 1000' });
    }
    if (new Date(event_date) < new Date()) {
        return res.status(400).json({ error: 'Event date must be in the future' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO events (title, event_date, location, capacity)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [title, event_date, location, capacity]
        );
        res.status(201).json({ event_id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getEventDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
        if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

        const registrations = await pool.query(
            `SELECT u.id, u.name, u.email
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             WHERE r.event_id = $1`,
            [id]
        );

        res.json({
            ...event.rows[0],
            registered_users: registrations.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const registerForEvent = async (req, res) => {
    const { user_id, event_id } = req.body;

    try {
        const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [event_id]);
        if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

        const eventData = event.rows[0];
        if (new Date(eventData.event_date) < new Date()) {
            return res.status(400).json({ error: 'Cannot register for past events' });
        }

        const exists = await pool.query(
            `SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2`,
            [user_id, event_id]
        );
        if (exists.rows.length > 0) {
            return res.status(400).json({ error: 'User already registered for this event' });
        }

        const count = await pool.query(
            `SELECT COUNT(*) FROM registrations WHERE event_id = $1`,
            [event_id]
        );
        if (parseInt(count.rows[0].count) >= eventData.capacity) {
            return res.status(400).json({ error: 'Event is full' });
        }

        await pool.query(
            `INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)`,
            [user_id, event_id]
        );

        res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const cancelRegistration = async (req, res) => {
    const { user_id, event_id } = req.body;

    try {
        const exists = await pool.query(
            `SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2`,
            [user_id, event_id]
        );
        if (exists.rows.length === 0) {
            return res.status(400).json({ error: 'User is not registered for this event' });
        }

        await pool.query(
            `DELETE FROM registrations WHERE user_id = $1 AND event_id = $2`,
            [user_id, event_id]
        );

        res.json({ message: 'Registration cancelled successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const listUpcomingEvents = async (req, res) => {
    try {
        const events = await pool.query(
            `SELECT * FROM events
             WHERE event_date > NOW()
             ORDER BY event_date ASC, location ASC`
        );
        res.json(events.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getEventStats = async (req, res) => {
    const { id } = req.params;

    try {
        const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
        if (event.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

        const count = await pool.query(
            `SELECT COUNT(*) FROM registrations WHERE event_id = $1`,
            [id]
        );

        const totalRegistrations = parseInt(count.rows[0].count);
        const remainingCapacity = event.rows[0].capacity - totalRegistrations;
        const percentageUsed = (totalRegistrations / event.rows[0].capacity) * 100;

        res.json({
            total_registrations: totalRegistrations,
            remaining_capacity: remainingCapacity,
            percentage_used: `${percentageUsed.toFixed(2)}%`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createEvent,
    getEventDetails,
    registerForEvent,
    cancelRegistration,
    listUpcomingEvents,
    getEventStats
};
