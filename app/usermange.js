const express = require('express')
const app = express.Router()
const db = require('../middelware/db')
require('dotenv').config();
app.use(express.json()); 
const {validateJwt,authorizeRoles} = require('../middelware/auth')


app.get('/display/user/:userId', //validateJwt, authorizeRoles('customer', 'admin', 'staff', 'dealer'),
     async (req, res) => {
    const {userId} = req.params; // Get user ID from URL
    // const user_id = req.user.id
    // console.log(userId)
    try {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]); // Return user details
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/display/vehicles/:userid', //validateJwt, authorizeRoles('customer', 'admin', 'staff', 'dealer'),
    async (req,res) => {
        const {userid} = req.params;
        // const user_id = req.user.id
        console.log(userid);
        
        try {
            const result = await db.query('SELECT * FROM vehicles WHERE id = $1', [userid]);
    
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
    
            res.json(result.rows[0]); // Return user details
        } catch (error) {
            console.error('Database Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    })

module.exports = app