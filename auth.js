var LocalStrategy = require("passport-local").Strategy;
var ObjectId = require("mongodb").ObjectId;
var moment = require("moment");

module.exports = function(database, passport) {
  passport.use(new LocalStrategy(function(username, password, done) {
    database.authenticateUser(username, password)
      .then(function(result) {
        if (result.document) {
          return done(null, result.document);
        }
        else {
          return done(null, false);
        }
      })
      .catch(function(err) {
        return done(err.err);
      });
  }));

  passport.serializeUser(function(user, done) {
    console.log(moment().toISOString() + " - [Node Express] Success serializing User: " + user.username);
    return done(null, user._id);
  });

  passport.deserializeUser(function(userId, done) {
    database.findUser({_id: new ObjectId(userId)}, true)
      .then(function(result) {
        if (result.document) {
          console.log(moment().toISOString() + " - [Node Express] Success deserializing User: " + result.document.username);
          return done(null, result.document);
        }
        else {
          console.log(moment().toISOString() + " - [Node Express] Falied deserializing User: " + userId);
          return done(null, false);
        }
      })
      .catch(function(err) {
        console.log(moment().toISOString() + " - [Node Express] Falied deserializing User: " + userId);
        return done(err.err);
      });
  });
};
