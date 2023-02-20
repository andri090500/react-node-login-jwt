const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "login_begin",
});

db.connect((err) => {
  if (err) return console.log(err);
  console.log("database is connected");
});

module.exports = db;
