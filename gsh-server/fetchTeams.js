const http = require('http');

http.get('http://localhost:5000/api/v1/admin/teams', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    let json = JSON.parse(data);
    let items = json.data.items;
    let t18 = items.find(t => t.id === 18);
    console.log("Team 18:", JSON.stringify(t18, null, 2));
  });
}).on('error', console.error);
