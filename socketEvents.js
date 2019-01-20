var moment = require("moment");

var remoteParticipants = require("./remoteParticipants");

var subscribe = function(socket, webex) {
  socket.on("disconnect", function() {
    console.log(moment().toISOString() + " - [SocketIO] username: " + socket.request.user.username + " disconnected - session ID: " + socket.request.sessionID);
  });

  socket.on("createCollabSession", function(guestId) {
    while (true) {
      var remoteParticipant = remoteParticipants[Math.floor(Math.random() * remoteParticipants.length)];
      if (remoteParticipant.available) {
        break;
      }
    }
    socket.emit("cryptobankRepAssigned", {cryptobankRep: remoteParticipant});
    webex.botClient.createRoom({
      guestId: guestId,
      cryptobankRep: remoteParticipant,
      roomTitle: "[Online Chat] username: " + socket.request.user.username + " - session ID: " + socket.request.sessionID,
    })
    .then(function(room) {
      console.log(moment().toISOString() + " - " + "[Webex Teams] Successfully created Webex Teams room id: " + room.id);
      console.log(moment().toISOString() + " - " + "[Webex Teams] Room participants - guest: " + socket.request.user.username + ", rep: " + remoteParticipant.email);
      socket.emit("roomAssigned", {roomId: room.id, botId: room.creatorId});
    })
    .catch(function(err) {
      console.log(moment().toISOString() + " - " + "[Webex Teams] Error: " + err);
      socket.emit("collabErr", {err: {type: "room", description: err}});
    });
  });

  socket.on("guestInitiateCall", function(destination) {
    console.log(moment().toISOString() + " - [SocketIO] username: " + socket.request.user.username + " has initiated a call with rep: " + destination + " - session ID: " + socket.request.sessionID);
  });

  socket.on("guestDisconnectCall", function(destination) {
    console.log(moment().toISOString() + " - [SocketIO] Disconnected call: username: " + socket.request.user.username + " with rep: " + destination + " - session ID: " + socket.request.sessionID);
  });

  socket.on("guestSendChat", function(roomId) {
    console.log(moment().toISOString() + " - [SocketIO] username: " + socket.request.user.username + " has sent a chat message to room id: " + roomId + " - session ID: " + socket.request.sessionID);
  });

  socket.on("guestWebexRegistered", function() {
    console.log(moment().toISOString() + " - [SocketIO] username: " + socket.request.user.username + " has registered with Webex - session ID: " + socket.request.sessionID);
  });

};

module.exports = {
  subscribe: subscribe
};
