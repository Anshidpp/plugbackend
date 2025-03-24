// auth.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const db=require('./db')
const { client, COGNITO_ISSUER } = require('./cognito');

// const getSigningKey = promisify(client.getSigningKey.bind(client));

async function getSigningKey(kid) {
    return new Promise((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
            if (err) {
                console.error("Error retrieving signing key:", err);
                return reject(err);
            }
            resolve(key.getPublicKey());
        });
    });
}
// Middleware for JWT validation
async function validateJwt(req, res, next) {
    try {
        // console.log(Authorization Header: `${req.headers.authorization}`);

        const token = req.headers.authorization;
        if (!token || !token.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid authorization header format" });
        }

        const bearerToken = token.split(" ")[1];

        // Decode JWT header to extract kid
        const decodedHeader = jwt.decode(bearerToken, { complete: true });
        if (!decodedHeader || !decodedHeader.header.kid) {
            return res.status(401).json({ message: "Invalid JWT structure" });
        }

        // Fetch the public key
        const publicKey = await getSigningKey(decodedHeader.header.kid);
        if (!publicKey) {
            return res.status(401).json({ message: "Public key not found for JWT verification" });
        }

        // Verify JWT using the retrieved public key
        // const decoded = jwt.verify(bearerToken, publicKey, {
        //     issuer: COGNITO_ISSUER,
        //     algorithms: ["RS256"]
        // });
        const decoded = jwt.decode(bearerToken, { complete: true });
        // console.log("Decoded Token:", decoded);
       
        if (!decoded || !decoded.payload) {
            return res.status(403).json({ message: "Invalid JWT structure" });
        }
        
        // Extract only the payload
        const jwtPayload = decoded.payload;
        

        req.user = jwtPayload;

        // Check if the user exists in the database
        const client = await db.connect();
        try {
            const query = "SELECT * FROM users WHERE jwtsub = $1";
            const result = await client.query(query, [jwtPayload.sub]);

            if (result.rows.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = result.rows[0];

            req.user = {
                ...req.user,
                role: user.userrole,
                jwtsub: user.jwtsub,
                id: user.id,
                username: user.username,
            };

            // console.log("User authenticated:", req.user);
            next();
        } catch (dbError) {
            console.error("Database query error:", dbError);
            return res.status(500).json({ message: "Database error", error: dbError.message });
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(401).json({ message: "Invalid or expired token", error: err.message });
    }
}
// Middleware for role-based access control
function authorizeRoles(...allowedRoles) {
   
    return (req, res, next) => {
        // console.log(authorizerole ${req.user.role})
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access forbidden: insufficient role' });
        }
        next();
    };
}


module.exports = { validateJwt, authorizeRoles };