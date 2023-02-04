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
const connect = require("./src/mongodb.js");
const collection = require("./models/User");
const predictorCollection = require("./models/Predictor");
const { getMaxListeners } = require("process");
const { request } = require("http");
const { response, json } = require("express");
//const collectionPredictor = require("./src/mongodb");

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

  //console.log(collectionPredictor.findOne({FACVyes: FACVyes})+1);
  /*const id = "63dea4e5396d37c85572e698"
  if (dataState.FAVC == "yes")
  {
    collectionPredictor.updateOne({_id:id}, {set:{FACVyes:collectionPredictor.findOne({ FAVCyes: FAVCyes })+1}});
  }
  else if (dataState.FAVC == "no")
  {

  }*/

  //console.log(dataState);
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
  //console.log(raw);

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
      //console.log(result);
      //var FCVCyes=0, FCVCno=0;
      var sp = result.split(",");
      //console.log(sp);
      sp[60] = sp[60].split('"');
      var temp = sp[60][1].split("_");
      //console.log(temp);
      var oblvl = "";
      for (let i = 0; i < temp.length; i++) {
        oblvl += temp[i] + " ";
      }
      for (let j = 53; j <= 59; j++) {
        sp[j] = sp[j].split('"');
      }
      var probUnder = (Number(sp[53][1]) * 100).toFixed(2);
      var probNormal = (Number(sp[54][1]) * 100).toFixed(2);
      var probOb1 = (Number(sp[55][1]) * 100).toFixed(2);
      var probOb2 = (Number(sp[56][1]) * 100).toFixed(2);
      var probOb3 = (Number(sp[57][1]) * 100).toFixed(2);
      var probOver1 = (Number(sp[58][1]) * 100).toFixed(2);
      var probOver2 = (Number(sp[59][1]) * 100).toFixed(2);
      //console.log(Number(sp[53][1])*100);
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
          '         <caption style="text-align:center; caption-side:top;">Scored Probabilities for Classes</caption>' +
          "         <thead>" +
          '             <tr class="text-secondary text-center" height="50">' +
          '                 <th width="140">Insufficient weight</th>' +
          '                 <th width="140">Normal weight</th>' +
          '                 <th width="140">Overweight 1</th>' +
          '                 <th width="140">Overweight 2</th>' +
          '                 <th width="140">Obesity 1</th>' +
          '                 <th width="140">Obesity 2</th>' +
          '                 <th width="140">Obesity 3</th>' +
          "             </tr>" +
          "         </thead>" +
          "         <tbody>" +
          '             <tr class="text-secondary text-center" height="50">' +
          `                 <td> ${probUnder}%</td>` +
          `                 <td>${probNormal}%</td>` +
          `                 <td>${probOver1}%</td>` +
          `                 <td>${probOver2}%</td>` +
          `                 <td>${probOb1}%</td>` +
          `                 <td>${probOb2}%</td>` +
          `                 <td>${probOb3}%</td>` +
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
