const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true
    });
    console.info("Mongo connected");
  } catch (err) {
    console.err(err.message);
    // Exit
    process.exit(1);
  }
};
module.exports = connectDB;
