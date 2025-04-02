const express = require('express')
const app = express.Router()
const db = require('../middelware/db')
require('dotenv').config();
app.use(express.json()); 
const {validateJwt,authorizeRoles} = require('../middelware/auth')

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const toRad = angle => (angle * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ..................................... find chargers .............................................................

app.get('/api/chargers', async (req, res) => {
    // console.log("/api/chargers",req.body);
    try {
        const { lat, long, radius } = req.query;

        if (!lat || !long || !radius) {
            return res.status(400).json({ error: 'lat, long, and radius are required' });
        }

        // Fetch all chargers from the database
        const result = await db.query("SELECT * FROM chargerstatus");

        // Filter chargers based on distance calculation
        const filteredChargers = result.rows
            .map(charger => ({
                ...charger,
                distance: haversine(parseFloat(lat), parseFloat(long), charger.lat, charger.long)
            }))
            .filter(charger => charger.distance <= parseFloat(radius)) // Keep only chargers within radius
            .sort((a, b) => a.distance - b.distance); // Sort by nearest first

        res.json(filteredChargers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


// .............................................. add vehicles ..........................................

app.post('/insert/vehicles/:userid',
    validateJwt,
    authorizeRoles('customer','admin','staff','dealer'),
     async (req,res) => {
    const { modelID , brand , registerno , vin } = req.body;
    const { userid }= req.params;
    // const user_id = req.user.id
    if (!modelID || !brand || !registerno || !vin  ) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        await db.query(
            'INSERT INTO vehicles(modelid, brand, registerno, vin, userid) VALUES ($1, $2, $3, $4, $5)',
            [modelID, brand, registerno, vin, userid]
        );

        return res.status(200).json({ message: "Insertion successful" });
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "Error inserting data" });
    }
})


module.exports = app