/* eslint-disable no-console */
const mongoose = require("mongoose");

const config = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
};

const {
  MONGO_URL = "mongodb://127.0.0.1:27017/querys?retryWrites=true&w=majority",
} = process.env;

mongoose.connect(MONGO_URL, config);
mongoose.set("debug", false);
mongoose.Promise = global.Promise;
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
// eslint-disable-next-line
db.on("connected", () => {
  console.log("MongoDB connection open");
  console.log(URL);
});
db.on("error", console.error.bind(console, "MongoDB connection error:"));
