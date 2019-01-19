var moment = require("moment");
var passportSocketIo = require("passport.socketio");

var verifyInput = require("./verifyInput");
var remoteParticipants = require("./remoteParticipants");

var buildResponse = function(result, action, item) {
  if (result.hasOwnProperty("status")) {
    return {
      log: moment().toISOString() + " - [Node Express] " + result.document,
      status: result.status,
      json: result.document
    };
  }
  if (!result.document) {
    return {
      log: moment().toISOString() + " - [Node Express] " + item + " " + action + " failed. Not found",
      status: 404,
      json: {document: {}}
    };
  }
  return {
    log: moment().toISOString() + " - [Node Express] " + item + " " + action + " success",
    status: 200,
    json: {document: result.document}
  };
};

var buildError = function(err) {
  return {
    log: moment().toISOString() + " - [Node Express] Internal Server Error: " + err.err,
    status: 500,
    json: {err: "Internal Server Error"}
  };
};

module.exports = function(app, database, passport, ciscoSparkActions, io) {

  app.route("/onboard/:initialToken")
    .get(function(req, res) {
      var input = verifyInput.onboard(req.params);
      if (input) {
        database.findUser(input)
          .then(function(result) {
            return buildResponse(result, "users", "Get onboard");
          })
          .then(function(response) {
            console.log(response.log);
            res.status(response.status);
            res.json(response.json);
            return;
          })
          .catch(function(err) {
            throw buildError(err);
          })
          .catch(function(reponse) {
            console.log(response.log);
            res.status(response.status);
            res.json(response.json);
            return;
          });
          return;
      }
      console.log(moment().toISOString() + " - [Node Express] Bad request");
      res.status(400);
      res.json({err: "Bad request"});
      return;
    });

  app.route("/resetPassword")
    .post(function(req, res) {
      var input = verifyInput.resetPassword(req.body);
      if (input) {
        return database.setUserPassword(
          {
            initialToken: input.initialToken,
            username: input.username
          },
          {
            initialToken: null,
            password: input.password
          }
        )
          .then(function(result) {
            return buildResponse(result, '"' + input.username + '"', "Reset password for user");
          })
          .then(function(response) {
            console.log(response.log);
            res.status(response.status);
            res.json(response.json);
            return;
          })
          .catch(function(err) {
            throw buildError(err);
          })
          .catch(function(reponse) {
            console.log(response.log);
            res.status(response.status);
            res.json(response.json);
            return;
          });
          return;
      }
      console.log(moment().toISOString() + " - [Node Express] Bad request");
      res.status(400);
      res.json({err: "Bad request"});
      return;
    });

  app.route("/login")
    .get(function(req, res) {
      if (req.isAuthenticated()) {
        console.log(moment().toISOString() + " - [Node Express] User: " + req.user.username + " is authenticated");
        ciscoSparkActions.initializeCiscosparkClient(req.user._id, req.user.firstName + " " + req.user.lastName)
          .then(function(jwt) {
            console.log(moment().toISOString() + " - " + "[Webex Teams] Generated Webex Teams guest token - userId: " + req.user._id);
            res.status(200);
            res.json({
              document: {webexTeamsToken: jwt, authenticated: true, user: req.user}
            })
            return;
          })
          .catch(function(err) {
            console.log(moment().toISOString() + " - " + "[Webex Teams] Failed to generate Webex Teams guest token - userId: " + req.user._id);
            console.log(moment().toISOString() + " - " + err);
            res.status(200);
            res.json({
              document: {webexTeamsToken: null, authenticated: true, user: req.user}
            })
            res.json({webexTeamsToken: null, authenticated: true, user: req.user});
            return;
          });
        return;
      }
      console.log(moment().toISOString() + " - [Node Express] Not Authenticated");
      res.status(401);
      res.send("Unauthorized");
      return;
    })
    .post(passport.authenticate("local"), function(req, res) {
      console.log(moment().toISOString() + " - [Node Express] User: " + req.user.username + " is authenticated");
      ciscoSparkActions.initializeCiscosparkClient(req.user._id, req.user.firstName + " " + req.user.lastName)
        .then(function(jwt) {
          console.log(moment().toISOString() + " - " + "[Webex Teams] Generated Webex Teams guest token - userId: " + req.user._id);
          res.status(200);
          res.json({
            document: {webexTeamsToken: jwt, authenticated: true, user: req.user}
          });
          return;
        })
        .catch(function(err) {
          console.log(moment().toISOString() + " - " + "[Webex Teams] Failed to generate Webex Teams guest token - userId: " + req.user._id);
          console.log(moment().toISOString() + " - " + err);
          res.status(200);
          res.json({
            document: {webexTeamsToken: null, authenticated: true, user: req.user}
          });
          return;
        });
      return;
    });

  app.route("/logout")
    .get(function(req, res) {
      if (req.user) {
        var sessionId = req.session.id;
        passportSocketIo.filterSocketsByUser(io, function(user) {
          return String(user._id) === String(req.user._id);
        }).forEach(function(socket){
          if (sessionId === socket.request.sessionID) {
            socket.disconnect();
          }
        });
        console.log(moment().toISOString() + " - [Node Express] User: " + req.user.username + " is logged out");
        req.logout();
      }
      res.status(200);
      res.json({authenticated: false});
      return;
    });

  app.route("/remoteParticipant")
    .get(function(req, res) {
      if (!req.isAuthenticated()) {
        var remoteParticipant = remoteParticipants[Math.floor(Math.random() * remoteParticipants.length)];
        if (remoteParticipant.available) {
          var result = {
            err: null,
            document: remoteParticipant
          };
          var response = buildResponse(result, "Remote participant: " + result.document.displayName + " - ", "Get");
        }
        else {
          var result = {
            err: null,
            document: null
          };
          var response = buildResponse(result, "Remote participant", "Get");
        }
        console.log(response.log);
        res.status(response.status);
        res.json(response.json);
        return;
      }
      console.log(moment().toISOString() + " - [Node Express] Not Authenticated");
      res.status(401);
      res.send("Unauthorized");
      return;
    });

  app.route("*")
    .get(function(req, res) {
      console.log(moment().toISOString() + " - [Node Express] Webpage not found!");
      res.status(404);
      res.json({document: {}});
      return;
    })
    .post(function(req, res) {
      console.log(moment().toISOString() + " - [Node Express] Webpage not found!");
      res.status(404);
      res.json({document: {}});
      return;
    });
};
