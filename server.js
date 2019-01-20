var express = require("express");
var session = require("express-session");
var passport = require("passport");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var dotenv = require("dotenv");
var moment = require("moment");
var helmet = require("helmet");
var cookieParser = require("cookie-parser");
var passportSocketIo = require("passport.socketio");
var cors = require("cors");

var auth = require("./auth");
var routes = require("./routes");
var database = require("./database");
var ciscoSparkHelper = require("./ciscoSparkHelper");
var cryptoPriceFeed = require("./cryptoPriceFeed");
var remoteParticipants = require("./remoteParticipants");
var socketEvents = require("./socketEvents");

dotenv.config();
var port = process.env.PORT || 3000;
var guestIssuerId = process.env.WEBEXGUESTISSUERID;
var guestSharedSecret = process.env.WEBEXGUESTSHAREDSECRET;
var accessToken = process.env.WEBEXBOTACCESSTOKEN;
var indexPath = __dirname + "/public";
var databaseCollections = ["users"];

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var MongoStore = require("connect-mongo")(session);
var store = new MongoStore({
  url: process.env.DATABASEURI
});
var webex = ciscoSparkHelper(guestIssuerId, guestSharedSecret, accessToken);

mongodb.MongoClient.connect(process.env.DATABASEURI, {useNewUrlParser: true})
  .then(function(client) {
    console.log(moment().toISOString() + " - [MongoDB] Successfully connected to database instance: " + process.env.DATABASEURI);

    var databaseName = process.env.DATABASENAME;
    var db = client.db(databaseName);

    var checkCollections = databaseCollections.map(function(collection) {
      return db.createCollection(collection);
    });

    Promise.all(checkCollections).then(function(result) {
      console.log(moment().toISOString() + " - [MongoDB] Successfully verified database collections");
    },
    function(err) {
      console.log(moment().toISOString() + " - [MongoDB] Failed to verify database collections");
      console.log(moment().toISOString() + " - [MongoDB] Error: " + err);
      return;
    });

    server.listen(port, "0.0.0.0", function(err) {
      if (err) {
        console.log(moment().toISOString() + " - [Node Express] Failed to start server on TCP: " + port);
        console.log(moment().toISOString() + " - [Node Express] Error: " + err);
        return;
      }
      console.log(moment().toISOString() + " - [Node Express] Successfully started server on TCP: " + port);

      app.use(helmet());
      app.options('*', cors());
      app.use(bodyParser.urlencoded({extended: false}));
      app.use(cookieParser());
      app.use(express.static(indexPath));
      app.use(session({
        cookieParser: cookieParser,
        secret: process.env.SHARED_SECRET,
        resave: true,
        saveUninitialized: true,
        store: store,
        maxAge: Date.now() + (30 * 86400 * 1000)
      }));
      app.use(passport.initialize());
      app.use(passport.session());
      app.use(function(req, res, next) {
        console.log(moment().toISOString() + " - [Node Express] " + req.method + " - " + req.path + " - " + req.ip);
        return next();
      });

      io.use(passportSocketIo.authorize({
        cookieParser: cookieParser,
        secret: process.env.SHARED_SECRET,
        success: function(data, accept) {
          console.log(moment().toISOString() + " - [SocketIO] username: " + data.user.username + " connected and authenticated - session ID: " + data.sessionID);
          accept(null, true);
        },
        fail: function(data, message, error, accept) {
          console.log(moment().toISOString() + " - [SocketIO] Socket connection authentication failed: " + message);
          accept(null, false);
        },
        store: store
      }));

      io.on("connection", function(socket) {
        socketEvents.subscribe(socket, webex);
      });

      auth(
        database(db),
        passport
      );

      routes(
        app,
        database(db),
        passport,
        webex,
        io
      );

      cryptoPriceFeed(io);
    });
  })
  .catch(function(err) {
    console.log(moment().toISOString() + " - [MongoDB] Failed to connect to MongoDB Database: " + process.env.DATABASEURI);
    console.log(moment().toISOString() + " - [MongoDB] Error: " + err);
    return;
  });
