require('dotenv').config();
const authenticateAPI = (req, res, next) => { if (req.headers['x-api-key'] !== process.env.SECRET_API_KEY) { return res.status(401).json({ error: "Unauthorized" }); } next(); };
module.exports = authenticateAPI;
