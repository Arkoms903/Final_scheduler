const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());


// Proxy endpoint: receive data from frontend, forward to python solver, return results
app.post('/api/run-solver', async (req, res) => {
try {
const pythonUrl = 'http://127.0.0.1:8000/generate_timetable';
const r = await fetch(pythonUrl, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(req.body)
});
const data = await r.json();
res.json(data);
} catch (err) {
console.error(err);
res.status(500).json({ error: 'failed to reach python solver' });
}
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Node backend listening on ${PORT}`));