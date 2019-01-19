var jwt = require("jsonwebtoken");
var moment = require("moment");
var ObjectId = require("mongodb").ObjectId;

var errorMessages = require("./errorMessages");

var generatePayload = function(guestIssuerId, userId, displayName) {
  return new Promise(function(resolve, reject) {
    try {
      userId = new ObjectId(userId);
      if (guestIssuerId && userId && displayName) {
        resolve({
          sub: userId,
          name: displayName,
          iss: guestIssuerId,
        });
      }
      throw new Error(errorMessages.guestIssuerId);
    }
    catch(err) {
      if (err.message === errorMessages.guestIssuerId) {
        reject(errorMessages.guestIssuerId);
      }
      else {
        reject(errorMessages.userId);
      }
    }
  });
};


var generateJsonWebToken = function(guestIssuerId, guestSharedSecret, userId, displayName) {
  var errorMessages = {
    guestSharedSecret: "[Error - Generate JWT] Please ensure you set WEBEXGUESTSHAREDSECRET in your environment variables"
  };
  return new Promise(function(resolve, reject) {
    return generatePayload(guestIssuerId, userId, displayName)
      .then(function(payload) {
        resolve(jwt.sign(
          payload,
          Buffer.from(guestSharedSecret, 'base64'),
          { expiresIn: '6h' }
        ));
      })
      .catch(function(err) {
        if (err.name === "TypeError") {
          reject(moment().toISOString() + " - " + errorMessages.guestSharedSecret)
        }
        else {
          reject(moment().toISOString() + " - " + err);
        }
      });
  });
};

module.exports = {
  generateJsonWebToken: generateJsonWebToken
};
