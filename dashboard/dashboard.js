const express = require('express')
const dashboard = express.Router()
const db = require('../middelware/db')
dashboard.use(express.json()); 



// ............................................................................. insert ...........................................................................

dashboard.post('/insert/charger', async (req, res) => {
    console.log("reqbody:", req.body);

    const { chargerid, lat, long, state, status } = req.body;

    if (!chargerid || !lat || !long || !state || !status) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query(
            'INSERT INTO chargerstatus(chargerid, lat, long, state, status) VALUES ($1, $2, $3, $4, $5)',
            [chargerid, lat, long, state, status]
        );

        return res.json({ message: "Insertion successful" });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Error inserting data" });
    }
});

module.exports = dashboard