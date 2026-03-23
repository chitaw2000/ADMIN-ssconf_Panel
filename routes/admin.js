const express = require('express');
const adminApp = express.Router();
const { serverGroups, users, getServerKey } = require('../config/db');
const authenticateAPI = require('../middlewares/auth');

adminApp.post('/add-server', (req, res) => {
    try {
        const { groupName, serverName, serverKey } = req.body;
        if (groupName && serverName && serverKey) {
            if (!serverGroups[groupName]) serverGroups[groupName] = {};
            serverGroups[groupName][serverName] = serverKey;
        }
        res.redirect('/admin');
    } catch (error) { res.status(500).send("Error adding server"); }
});

adminApp.get('/', (req, res) => {
    let groupHtml = '';
    for (const groupName in serverGroups) {
        groupHtml += `<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6"><h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2"><i class="fas fa-server text-indigo-500 mr-2"></i> ${groupName}</h3><div class="space-y-3">`;
        for (const serverName in serverGroups[groupName]) {
            const key = serverGroups[groupName][serverName];
            groupHtml += `<div class="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center"><span class="font-semibold text-gray-700"><i class="fas fa-bolt text-yellow-500 mr-2"></i> ${serverName}</span><code class="text-xs text-pink-600 bg-pink-50 px-3 py-1.5 rounded-md truncate w-64">${key}</code></div>`;
        }
        groupHtml += `</div></div>`;
    }

    let usersHtml = '';
    for (const token in users) {
        const u = users[token];
        const usagePercent = (u.usedGB / u.totalGB) * 100;
        let progressColor = usagePercent > 80 ? 'bg-red-500' : 'bg-green-500';
        usersHtml += `<tr class="border-b hover:bg-gray-50"><td class="p-4"><div class="font-bold text-gray-800">${u.name}</div><div class="text-xs text-gray-400 font-mono">${token}</div></td><td class="p-4"><span class="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">${u.currentServer}</span></td><td class="p-4"><div class="flex justify-between text-xs mb-1"><span class="font-semibold text-gray-600">${u.usedGB} GB</span><span class="text-gray-400">${u.totalGB} GB</span></div><div class="w-full bg-gray-200 rounded-full h-1.5"><div class="${progressColor} h-1.5 rounded-full" style="width: ${usagePercent}%"></div></div></td></tr>`;
    }

    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Admin Dashboard</title><script src="https://cdn.tailwindcss.com"></script><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"></head><body class="bg-gray-100 font-sans antialiased"><nav class="bg-indigo-600 text-white shadow-md"><div class="max-w-7xl mx-auto px-4 py-4"><div class="font-bold text-xl"><i class="fas fa-shield-alt mr-2"></i>VPN ADMIN</div></div></nav><div class="max-w-7xl mx-auto px-4 py-8"><div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"><h2 class="text-lg font-bold text-gray-800 mb-4"><i class="fas fa-plus-circle text-green-500 mr-2"></i> Add New Server Key</h2><form action="/admin/add-server" method="POST" class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"><div><label class="block text-sm font-medium text-gray-700 mb-1">Group Name</label><input type="text" name="groupName" required class="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"></div><div><label class="block text-sm font-medium text-gray-700 mb-1">Node Name</label><input type="text" name="serverName" required class="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"></div><div class="md:col-span-2"><label class="block text-sm font-medium text-gray-700 mb-1">Outline Key</label><div class="flex gap-2"><input type="text" name="serverKey" required class="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"><button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"><i class="fas fa-save mr-1"></i> Add</button></div></div></form></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-8"><div class="lg:col-span-1"><h2 class="text-xl font-bold text-gray-800 mb-4"><i class="fas fa-key text-gray-400 mr-2"></i> Key Management</h2>${groupHtml}</div><div class="lg:col-span-2"><div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><div class="p-6 border-b border-gray-100"><h2 class="text-xl font-bold text-gray-800"><i class="fas fa-users text-gray-400 mr-2"></i> Active Users</h2></div><div class="overflow-x-auto"><table class="w-full text-left border-collapse"><thead><tr class="bg-gray-50 text-gray-500 text-xs uppercase"><th class="p-4">User</th><th class="p-4">Node</th><th class="p-4">Usage</th></tr></thead><tbody>${usersHtml}</tbody></table></div></div></div></div></div></body></html>`);
});

adminApp.post('/api/internal/get-server', authenticateAPI, (req, res) => {
    const user = users[req.body.token];
    if (user) {
        const key = getServerKey(user.currentServer);
        if (key) return res.json({ outline_key: key });
    }
    res.status(404).json({ error: "Not found" });
});

adminApp.post('/api/internal/change-server', authenticateAPI, (req, res) => {
    const { token, newServer } = req.body;
    if (users[token] && getServerKey(newServer)) {
        users[token].currentServer = newServer;
        res.json({ success: true });
    } else {
        res.status(400).json({ error: "Failed" });
    }
});
module.exports = adminApp;
