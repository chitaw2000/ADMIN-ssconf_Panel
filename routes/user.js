const express = require('express');
const axios = require('axios');
const userApp = express.Router();
const redisClient = require('../config/redis');
const { users, serverGroups } = require('../config/db');
require('dotenv').config();

userApp.get('/panel/:token', (req, res) => {
    const token = req.params.token;
    const user = users[token];
    if(!user) return res.status(404).send("User not found!");

    let dropdownOptions = '';
    for (const groupName in serverGroups) {
        dropdownOptions += `<optgroup label="${groupName}">`;
        for (const serverName in serverGroups[groupName]) {
            const isSelected = user.currentServer === serverName ? 'selected' : '';
            dropdownOptions += `<option value="${serverName}" ${isSelected}>${serverName}</option>`;
        }
        dropdownOptions += `</optgroup>`;
    }
    res.send(`<body style="font-family: Arial, sans-serif; background: #eef2f3; display: flex; justify-content: center; padding: 40px;"><div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px;"><h2 style="margin-top:0; color:#333;">👤 My VPN</h2><p>Welcome, <b>${user.name}</b></p><div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:20px;"><p style="margin:0 0 10px 0;"><strong>Usage:</strong> ${user.usedGB} GB / ${user.totalGB} GB</p><p style="margin:0;"><strong>Current Server:</strong> <span style="color:#007bff; font-weight:bold;">${user.currentServer}</span></p></div><form action="/panel/change-server" method="POST"><input type="hidden" name="token" value="${token}"><label style="font-size:14px; color:#666;">Change Location:</label><select name="newServer" style="width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 20px; border:1px solid #ccc; border-radius:6px; font-size:16px;">${dropdownOptions}</select><button type="submit" style="width: 100%; padding: 14px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor:pointer;">Update Server</button></form><div style="margin-top:20px; font-size:12px; color:gray; word-break: break-all; text-align:center;">ssconf://${req.get('host')}/${token}.json</div></div></body>`);
});

userApp.post('/panel/change-server', async (req, res) => {
    const { token, newServer } = req.body;
    try {
        await axios.post(`http://localhost:${process.env.ADMIN_PORT}/api/internal/change-server`, { token, newServer }, { headers: { 'x-api-key': process.env.SECRET_API_KEY } });
        await redisClient.del(token);
        res.redirect('/panel/' + token);
    } catch (error) { res.status(500).send("Error"); }
});

userApp.get('/:token.json', async (req, res) => {
    const token = req.params.token;
    try {
        const cachedKey = await redisClient.get(token);
        if (cachedKey) return res.json({ server: cachedKey });
        const response = await axios.post(`http://localhost:${process.env.ADMIN_PORT}/api/internal/get-server`, { token }, { headers: { 'x-api-key': process.env.SECRET_API_KEY } });
        if (response.data && response.data.outline_key) {
            await redisClient.setEx(token, 300, response.data.outline_key);
            return res.json({ server: response.data.outline_key });
        }
    } catch (error) { return res.status(500).json({ error: "Configuration Error" }); }
});
module.exports = userApp;
