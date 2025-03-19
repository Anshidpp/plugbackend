const express = require('express')
const app = express.Router()
const db = require('../middelware/db')
require('dotenv').config();
app.use(express.json()); 


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



module.exports = app