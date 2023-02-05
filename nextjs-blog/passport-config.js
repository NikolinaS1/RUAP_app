const { authenticate } = require("passport");
const passport = require("passport");

const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByEmail) {
  const authenticateUser = async (email, password, done) => {
    const user = await getUserByEmail(email);

    if (user == null) {
      return done(null, false, { message: "No user with that email" });
    }
    try {
      if (await bcrypt.compare(password, user.password)) {
        console.log("OK login")
        return done(null, user);
      } else {
        console.log("err logging in", user.password)
        return done(null, false, { message: "Password incorrect" });
      }
    } catch (e) {
      return done(e);
    }
  };
  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  passport.serializeUser((user, done) => {
    done(null, user.email);
  });
  passport.deserializeUser(async (email, done) => {
    let user = await getUserByEmail(email);
    return done(null, user);
  });
}

module.exports = initialize;
