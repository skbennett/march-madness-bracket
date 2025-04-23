// src/backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

const model = require('./model'); // you'll create this next

app.use(cors());
app.use(express.json());

// Prediction endpoint
app.post('/predict', async (req, res) => {
  const { team1, team2 } = req.body;
  try {
    const winner = await model.predictWinner(team1, team2);
    res.json({ winner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
