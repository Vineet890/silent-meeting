const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); // 1. This loads our secret .env file!

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 2. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { family: 4 })
  .then(() => {
    console.log("Successfully connected to MongoDB Cloud!");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

app.get('/api/status', (req, res) => {
    res.json({ message: "The Silent Meeting Engine is running perfectly!" });
});

app.listen(PORT, () => {
    console.log(`Server is running live on http://localhost:${PORT}`);
});