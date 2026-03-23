let serverGroups = { "⭐ VIP Asia Servers": { "SG-VIP-1": "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzU0cx@139.1.1.1:5678/?outline=1" }, "🟢 Standard Free": { "US-Free-1": "ss://Y2hhY2hhMjAtaWV0Zi1wb2x5MTMwNTpwYXNzVVMx@141.3.3.3:5678/?outline=1" } };
let users = { "nyeSkpYVgoPSe3suIRtys8Lhl09xDohZ": { name: "Khant Z", currentServer: "SG-VIP-1", usedGB: 12.5, totalGB: 50 } };
function getServerKey(serverName) { for (const group in serverGroups) { if (serverGroups[group][serverName]) return serverGroups[group][serverName]; } return null; }
module.exports = { serverGroups, users, getServerKey };
