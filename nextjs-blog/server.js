if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var http = require("http");

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./passport-config");
const passport = require("passport");
const methodOverride = require("method-override");
const path = require("path");
const ejs = require("ejs");
const collection = require("./src/mongodb");
const { getMaxListeners } = require("process");
const { request } = require("http");
const { response, json } = require("express");

const getUserByEmail = async function (email) {
  return await collection.findOne({ email: email });
};

const getUserById = async function (id) {
  return await collection.findOne({ id: id });
};

initializePassport(
  passport,
  getUserByEmail,
  getUserById
  // function () {}
  // (email) => users.find((user) => user.email == email),
  // (id) => users.find((user) => user.id == id)
);

//const users = [];

app.set("view-engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use("/styles", express.static(__dirname + "/styles"));
app.use(express.static("public"));

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.get("/predictor", checkAuthenticated, (req, res) => {
  res.render("predictor.ejs", { name: req.user.name });
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const data = collection({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    await collection.insertMany(data);
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.post("/predictor", (req, res) => {
  const request = req.body;

  const dataState = {
    Gender: request.gender || "value",
    Age: request.Age || "value",
    Height: request.Height || "value",
    Weight: request.Weight || "value",
    family_history_with_overweight:
      request.family_history_with_overweight || "value",
    FAVC: request.FAVC || "value",
    FCVC: request.FCVC || "0",
    NCP: request.NCP || "0",
    CAEC: request.CAEC || "value",
    SMOKE: request.SMOKE || "value",
    CH2O: request.CH2O || "0",
    SCC: request.SCC || "value",
    FAF: request.FAF || "0",
    TUE: request.TUE || "0",
    CALC: request.CALC || "value",
    MTRANS: request.MTRANS || "value",
    NObeyesdad: "value",
  };
  console.log(dataState);

  //API
  const fetch = require("node-fetch");
  global.fetch = fetch;
  global.Headers = fetch.Headers;

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", "Bearer " + process.env.API_KEY);

  var NoJSONraw = {
    Inputs: {
      input1: {
        ColumnNames: [
          "Gender",
          "Age",
          "Height",
          "Weight",
          "family_history_with_overweight",
          "FAVC",
          "FCVC",
          "NCP",
          "CAEC",
          "SMOKE",
          "CH2O",
          "SCC",
          "FAF",
          "TUE",
          "CALC",
          "MTRANS",
          "NObeyesdad",
        ],
        Values: [
          [
            dataState.Gender,
            dataState.Age,
            dataState.Height,
            dataState.Weight,
            dataState.family_history_with_overweight,
            dataState.FAVC,
            dataState.FCVC,
            dataState.NCP,
            dataState.CAEC,
            dataState.SMOKE,
            dataState.CH2O,
            dataState.SCC,
            dataState.FAF,
            dataState.TUE,
            dataState.CALC,
            dataState.MTRANS,
            dataState.NObeyesdad,
          ],
        ],
      },
    },
    GlobalParameters: {},
  };
  var raw = JSON.stringify(NoJSONraw);
  console.log(raw);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch(
    "https://ussouthcentral.services.azureml.net/workspaces/8bde0f43448a4c0a9399fc10298e259f/services/ecaf4910997046428eac705b610d6858/execute?api-version=2.0&details=true",
    requestOptions
  )
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      //data = JSON.stringify(result);
      // res.send(data);
      var sp = result.split(",");
      sp[60] = sp[60].split('"');
      var temp = sp[60][1].split("_");
      console.log(temp);
      var oblvl = "";
      for (let i = 0; i < temp.length; i++) {
        oblvl += temp[i] + " ";
      }
      //console.log(sp[60][1]);
      res.write(
        "<!DOCTYPE html>" +
          "<html>" +
          "   <head>" +
          '       <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">' +
          '       <meta charset="utf-8" />' +
          "       <title>Obesity predictor</title>" +
          '       <meta name="viewport" content="width=device-width, initial-scale=1" />' +
          '       <link rel="icon" href="./OP.png" />' +
          "   </head>" +
          "   <body>" +
          '       <nav class="navbar navbar-expand-sm bg-primary navbar-dark">' +
          '           <div class="container-fluid">' +
          '               <img class="logo" src="logo.png" width="190px"></img>' +
          '               <ul class="navbar-nav">' +
          '                   <li class="nav-item"><a class="nav-link active" href="/">Home</a></li>' +
          '                   <li class="nav-item"><a class ="nav-link" href="/predictor">Predictor</a></li>' +
          '                   <li class="nav-item">' +
          '                       <form action="/logout?_method=DELETE" method="POST" class="logout">' +
          '                           <button class="btn btn-primary" type="submit">Log Out</button>' +
          "                       </form>" +
          "                   </li>" +
          "               </ul>" +
          "           </div>" +
          "       </nav>" +
          '       <div class="res">' +
          `           <h2 id="result" class="text-center mb-4 mt-4 text-secondary">Your obesity level is: ${oblvl}</h2>` +
          "       </div>" +
          '      <div class="mt-5 table-responsive">' +
          '         <table class="table-bordered mx-auto w-auto">' +
          "         <thead>" +
          '             <tr class="text-secondary text-center" height="50">' +
          '                 <th width="140">Underweight</th>' +
          '                 <th width="140">Normal weight</th>' +
          '                 <th width="140">Overweight1</th>' +
          '                 <th width="140">Overweight2</th>' +
          '                 <th width="140">Obesity1</th>' +
          '                 <th width="140">Obesity2</th>' +
          '                 <th width="140">Obesity3</th>' +
          "             </tr>" +
          "         </thead>" +
          "         <tbody>" +
          '             <tr class="text-secondary text-center" height="50">' +
          "                 <td>11%</td>" +
          "                 <td></td>" +
          "                 <td></td>" +
          "                 <td></td>" +
          "                 <td></td>" +
          "                 <td></td>" +
          "                 <td></td>" +
          "             </tr>" +
          "         </tbody>" +
          "       </table>" +
          "     </div>" +
          "   </body>" +
          "</html>"
      );
      res.end();
    })
    .catch((error) => console.log("error", error));
  //res.redirect("/predictor");
  //res.render('predictor', {title: 'POST test'});
});

app.delete("/logout", function (req, res, next) {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000, function () {
  console.log("App is running on Port 3000");
});
