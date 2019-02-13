var cryptoMappings = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  LTC: "Litecoin",
  XRP: "Ripple"
};

module.exports = function(io) {
  var socket = require("socket.io-client")('https://streamer.cryptocompare.com/');
  socket.on("connect", function() {
    var pricePairs = [];
    var subscriptions = ['2~Bitstamp~BTC~USD', '2~Bitstamp~ETH~USD', '2~Bitstamp~XRP~USD', '2~Bitstamp~LTC~USD'];
    socket.emit("SubAdd", {subs: subscriptions});
    socket.on("m", function(message) {
      var priceInfo = message.split("~");
      if (priceInfo[0] === "2" && priceInfo.length > 16) {
        var cryptoTicker = priceInfo[2];
        var cryptoPrice = priceInfo[3] + " " + priceInfo[5];
        pricePairs = pricePairs.filter(function(pricePair) {
          return pricePair.cryptoTicker !== cryptoTicker;
        });
        pricePairs.push({
          cryptoName: cryptoMappings[cryptoTicker],
          cryptoTicker: cryptoTicker,
          cryptoPrice: cryptoPrice
        });
        pricePairs = pricePairs.sort(function(a, b) {
          if (a.cryptoName > b.cryptoName) {
            return 1;
          }
          if (a.cryptoName < b.cryptoName) {
            return -1;
          }
          return 0;
        });
        io.emit("cryptoPriceFeed", pricePairs);
      }
    });
  });
};
