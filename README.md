# CryptoBank Backend
CryptoBank is a fictional banking app intended to showcase [Cisco Webex Teams](https://www.webex.com/team-collaboration.html) cloud collaboration features with integrated client chat, voice and video. This is the backend application that will serve the multiple client frontends. For the web frontend, please check [here](https://github.com/ismailakkila/cryptobank-web).

The app is designed to integrate with Project Onboard. Project Onboard is an experimental web application that allows you to create, view, modify and delete user information via an administration portal. You can check it out [here](https://github.com/ismailakkila/projectonboard).

[Demo](https://cryptobank-web.herokuapp.com)

## Prerequisites
You will need to setup [Project Onboard](https://github.com/ismailakkila/projectonboard). The backend will connect to the same Mongo DB Instance to authenticate client sessions and fetch various information.

You will also need to have a Cisco Webex developer account to leverage [Cisco Webex Teams](https://developer.webex.com) APIs. With this account, a [bot account](https://developer.webex.com/docs/bots) access token is required to create Webex rooms and memberships for the collaboration sessions.
Moreover, the application will require the ability to issue [guest sessions](https://developer.webex.com/docs/guest-issuer) for the client collaboration interactions. You can generate the guest issuer ID and shared secret for this purpose.

Create a .env file in the root folder with the following parameters:
```
PORT=<Your Web Server Port>
DATABASEURI=<Your Mongo DB instance>
DATABASENAME=<Your Mongo DB database name>
SHARED_SECRET=<Shared Secret for Node Express Session>
WEBEXGUESTISSUERID=<Your Webex Guest Issuer ID>
WEBEXGUESTSHAREDSECRET=<Your Webex Shared Secret>
WEBEXBOTACCESSTOKEN=<Your Webex Bot Access Token>
FRONTENDURL=<The URL That is Used By Your Frontend App>
```

## Installation
Install the application
```
npm install
```
Start the application
```
npm start
```

## Built With
* [Express Node.js](https://expressjs.com)
* [Socket.IO](https://socket.io)
* [Cisco Webex](https://developer.webex.com)
