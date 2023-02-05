if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
var http = require("http");

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./passport-config");
const passport = require("passport");
const methodOverride = require("method-override");
const path = require("path");
const ejs = require("ejs");
const connect = require("./src/mongodb.js");
const userModel = require("./models/User");
const predictorModel = require("./models/Predictor");
const { request } = require("http");
const { response, json } = require("express");

const getUserByEmail = async function (email) {
  return await userModel.findOne({ email: email });
};

initializePassport(
  passport,
  getUserByEmail,
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

app.get("/", checkAuthenticated, async (req, res) => {
  let graphValues = {
    'FAVC': {
      'no': 0,
      'yes': 0
    },
    'FCVC': {
      'Never': 0,
      'Sometimes': 0,
      'Always': 0
    },
    'NCP': {
      'Between 1 and 2': 0,
      'Three': 0,
      'More than three': 0
    },
    'CAEC': {
      'no': 0,
      'Sometimes': 0,
      'Frequently': 0,
      'Always': 0
    },
    'SMOKE': {
      'yes': 0,
      'no': 0
    },
    'CH20': {
      'Less than a liter': 0,
      'Between 1 and 2L': 0,
      'More than 2L': 0
    },
    'SCC': {
      'yes': 0,
      'no': 0
    },
    'FAF': {
      'I do not have': 0,
      '1 or 2 days': 0,
      '2 to 3 days': 0,
      '4 or 5 days': 0
    },
    'TUE': {
      '0-2 hours': 0,
      '3-5 hours': 0,
      'more than 5 hours': 0
    },
    'CALC': {
      'I do not drink': 0,
      'Sometimes': 0,
      'Frequently': 0,
      'Always': 0
    },
    'MTRANS': {
      'Automobile': 0,
      'Motorbike': 0,
      'Bike': 0,
      'Public transporation': 0,
      'Walking': 0
    },
    'NObeyesdad': {
      'Insufficient Weight': 0,
      'Normal Weight': 0,
      'Overweight Level I': 0,
      'Overweight Level II': 0,
      'Obesity Type I': 0,
      'Obesity Type II': 0,
      'Obesity Type III': 0,
    },
  };

  let graphValuesMapping = {
    'FCVC': {
      '1': 'Never',
      '2': 'Sometimes',
      3: 'Always',
    },
    'NCP': {
      '1': 'Between 1 and 2',
      '3': 'Three',
      '4': 'More than three',
    },
    'CH20': {
      '1': 'Less than a liter',
      '2': 'Between 1 and 2L',
      '3': 'More than 2L',
    },
    'FAF': {
      '0': 'I do not have',
      '1': '1 or 2 days',
      '2': '2 to 3 days',
      '3': '4 or 5 days'
    },
    'TUE': {
      '0': '0-2 hours',
      '1': '3-5 hours',
      '2': 'more than 5 hours',
    },
    'CALC': {
      'no': 'I do not drink',
    },
    'MTRANS': {
      'Public_Transportation': 'Public transporation',
    },
  };

  for await (const predictor of predictorModel.find()) {
    for (let [key, value] of Object.entries(predictor.toObject())) {
      if (graphValues[key] == undefined) {
        continue
      }
      if (graphValuesMapping[key] && graphValuesMapping[key][value] != undefined) {
        value = graphValuesMapping[key][value]
      }

      if (graphValues[key][value] == undefined) {
        continue;
      }
      graphValues[key][value]++;
    }
  }
  res.render("index.ejs", { name: req.user.name, graphValues });
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
    const data = userModel({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    await data.save()
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.post("/predictor", checkAuthenticated, (req, res) => {
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
    .then(async (result) => {
      var sp = result.split(",");
      sp[60] = sp[60].split('"');
      var temp = sp[60][1].split("_");
      var oblvl = "";
      for (let i = 0; i < temp.length; i++) {
        oblvl += temp[i] + " ";
      }
      oblvl = oblvl.trim()
      for (let j = 53; j <= 59; j++) {
        sp[j] = sp[j].split('"');
      }

      let predictorData = await predictorModel.findOne({ User: req.user });
      if (!predictorData) {
        predictorData = predictorModel({
          User: req.user,
        });
      }
      predictorData.FAF = dataState.FAF;
      predictorData.FAVC = dataState.FAVC;
      predictorData.FCVC = dataState.FCVC;
      predictorData.NCP = dataState.NCP;
      predictorData.CAEC = dataState.CAEC;
      predictorData.SMOKE = dataState.SMOKE;
      predictorData.CH20 = dataState.CH2O;
      predictorData.SCC = dataState.SCC;
      predictorData.FAF = dataState.FAF;
      predictorData.TUE = dataState.TUE;
      predictorData.CALC = dataState.CALC;
      predictorData.MTRANS = dataState.MTRANS;
      predictorData.NObeyesdad = oblvl;

      await predictorData.save();

      res.render("predictor_results.ejs", {
        oblvl: oblvl,
        probUnder: (Number(sp[53][1]) * 100).toFixed(2),
        probNormal: (Number(sp[54][1]) * 100).toFixed(2),
        probOb1: (Number(sp[55][1]) * 100).toFixed(2),
        probOb2: (Number(sp[56][1]) * 100).toFixed(2),
        probOb3: (Number(sp[57][1]) * 100).toFixed(2),
        probOver1: (Number(sp[58][1]) * 100).toFixed(2),
        probOver2: (Number(sp[59][1]) * 100).toFixed(2),
      });
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
