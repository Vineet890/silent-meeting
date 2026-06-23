require('dotenv').config();
const mongoose = require('mongoose');

const uri = "mongodb://Vineet:vineet123@ac-emzgovk-shard-00-00.dqyiga5.mongodb.net:27017,ac-emzgovk-shard-00-01.dqyiga5.mongodb.net:27017,ac-emzgovk-shard-00-02.dqyiga5.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri, { family: 4 })
  .then(() => {
    console.log("SUCCESS!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAIL:", err);
    process.exit(1);
  });
