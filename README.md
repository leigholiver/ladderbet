# Ladderbet


### Usage
Go to the [Ladderbet site](http://ec2-35-177-209-223.eu-west-2.compute.amazonaws.com/)

Click `Connect with Twitch`

Copy the `SC2Switcher Webhook URL` into the Webhook tab of [SC2Switcher](https://github.com/leigholiver/OBS-SC2Switcher)

Make sure that 'Webhook enabled' is ticked in SC2Switcher

Create a new Browser Source in OBS and copy the `OBS display url ` into the URL field



### Build
Clone this repo

`npm install`

[Create a twitch app for your application](https://glass.twitch.tv/console/apps)

Copy `config.js.dist` to `config.js` and fill in with the required information

`npm start`

Ladderbet should then be available at http://localhost:8080/
