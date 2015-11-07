'use strict';

var RacBot = require('../lib/racbot');

var token = 'xoxb-13987087606-IhQracN8Dqok9Sh3N9hJHpM8'; //process.env.BOT_API_KEY;
// var dbpath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var racbot = new RacBot({
	token: token
	//dbPath: dbPath,
	//name: name
	//console.log('initializing....');
	
});

console.log('running the bot.....');
racbot.run();
