# Ladderbet


### Usage
Go to the [Ladderbet site](https://leigholiver.com/ladderbet/)

Click `Connect with Twitch`

Copy the `SC2Switcher Webhook URL` into the Webhook tab of the [SC2Switcher obs-studio plugin](https://github.com/leigholiver/OBS-SC2Switcher) or [SC2Switcher Standalone](https://github.com/leigholiver/SC2Switcher-Standalone)

Make sure that 'Webhook enabled' is ticked in SC2Switcher and you have entered your username into the Usernames tab

Create a new Browser Source in OBS and copy the `OBS display url ` into the URL field



### Build
Clone this repo

`npm install`

[Create a twitch app for your application](https://glass.twitch.tv/console/apps)

Copy `config.js.dist` to `config.js` and fill in with the required information

`npm start`

Ladderbet should then be available at http://localhost:8080/
