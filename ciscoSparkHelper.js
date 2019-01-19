var ciscospark = require("ciscospark");

var jsonWebToken = require("./jsonWebToken");

var initializeCiscosparkClient = function(guestIssuerId, guestSharedSecret) {
  return function(userId, displayName) {
    return jsonWebToken.generateJsonWebToken(guestIssuerId, guestSharedSecret, userId, displayName)
      .then(function(jwt) {
        return jwt;
      })
      .catch(function(err) {
        throw err;
      });
  }
};

var createRoom = function(teams) {
  return function(params) {
    return teams.rooms.create({title: params.roomTitle})
      .then(function(room) {
        return Promise.all([
          teams.memberships.create({
            roomId: room.id,
            personEmail: params.cryptobankRep.email
          }),
          teams.memberships.create({
            roomId: room.id,
            personId: params.guestId
          })])
          .then(function() {
            return room;
          });
      })
      .then(function(room) {
        return teams.messages.create({
          markdown: `**Thanks for your patience! ** ${params.cryptobankRep.displayName} will be assisting you shortly.`,
          roomId: room.id
        })
        .then(function() {
          return room;
        });
      })
      .catch(function(err) {
        throw err;
      });
  };
};

var botClient = function(accessToken) {
  var teams = ciscospark.init({
    credentials: {
      access_token: accessToken
    }
  });
  return {
    createRoom: createRoom(teams)
  }
}

module.exports = function(guestIssuerId, guestSharedSecret, accessToken) {
  return {
    initializeCiscosparkClient: initializeCiscosparkClient(guestIssuerId, guestSharedSecret),
    botClient: botClient(accessToken)
  };
};
