const express = require("express");
const cors = require("cors");
const db = require("./database.js");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const jwt = require("jsonwebtoken");

const app = express();
const saltRounds = 10;
const PORT = 3001;

app.use(express.json()); // buat ambil data dari client dan di parse ke json
app.use(
  // buat izin spesifik
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
// buat cookie
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    key: "userId",
    secret: "subscribe",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

// register
app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // encrypte password
  bcrypt.hash(password, saltRounds, (error, hash) => {
    if (error) return console.log(error);
    let sql = `INSERT INTO user(username,password) VALUES('${username}','${hash}')`;
    db.query(sql, (err, result) => {
      if (err) return console.log("data failed to inserting");
      console.log("data successful inserting");
      const response = JSON.parse(JSON.stringify(result));
      res.send(response);
    });
  });
});

// jwt
const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    res.send("we need a token, please give it to us next time");
  } else {
    jwt.verify(token, "jwtSecret", (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "you failed to autentication" });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};
app.get("/isUserAuth", verifyJWT, (req, res) => {
  res.send("you are authenticated congrats");
});

// login
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  let sql = `SELECT * FROM user WHERE username = '${username}'`;
  db.query(sql, (err, result) => {
    if (err) {
      res.send({ err: err });
    }
    // cek username
    if (result.length > 0) {
      // cek password
      bcrypt.compare(password, result[0].password, (error, response) => {
        if (response) {
          //console.log(result);
          const id = result[0].id;
          const token = jwt.sign({ id }, "jwtSecret", {
            expiresIn: 300,
          });
          req.session.user = result;
          // res.send({ auth: true, token: token, result: result });
          res.json({ auth: true, token: token, result: result });
        } else {
          res.json({ auth: false, message: "password is wrong" });
        }
      });
    } else {
      res.json({ auth: false, message: "user doesn't exist" });
    }
  });
});

app.listen(PORT, () => console.log("Server is Running at port 3001"));
