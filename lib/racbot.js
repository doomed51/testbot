'use strict';

var util = require('util')
var path = require('path')
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var RacBot = function Constructor(settings) {
    console.log('initializing construction...');
	this.settings = settings;
    this.settings.name = this.settings.name || 'racbot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), '.\data', 'racbot.db');

    this.user = null;
    this.db = null;
	console.log('successfully constructed');
};

// inherits methods and properties from the Bot constructor
util.inherits(RacBot, Bot);

module.exports = RacBot;

// connect to slack and actually instantiate the bot 
RacBot.prototype.run = function() {
	
	console.log('run command hit...');
	RacBot.super_.call(this, this.settings);
	
	console.log('sending on start message....');
	this.on('start', this._onStart); 	// defined below
	
	console.log('initiating message listener...');
	this.on('message', this._onMessage);// defined below, after _onStart 
	
};

// What does the bot do when its initialized 
RacBot.prototype._onStart = function(){
	console.log('loading bot user');
	this._loadBotUser();	//load the user on slack that the bot is representing
	console.log('connection to DB ');
	this._connectDb();		//connect to the database
	console.log('first run check...');
	this._firstRunCheck();	//do things the first time a bot is added to a channel
};

//_onStart > impersonate the user
RacBot.prototype._loadBotUser = function(){
	var self = this;
	this.user = this.users.filter(function(user){
		return user.name === self.name;
	})[0];
};

//_onStart > connect to db
RacBot.prototype._connectDb = function () {
	if (!fs.existsSync(this.dbPath)){
		console.error('Database path '+'"'+ this.dbPath + '" does not exist or not readable.');
		process.exit(1);
	}
	this.db = new SQLite.Database(this.dbPath);
};

//_onStart > first run messaging 
RacBot.prototype._firstRunCheck = function() {
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function(err, record) {
		if (err) {
			return console.error('DATABASE ERROR:', err);
		}
		
		var currentTime = (new Date()).toJSON();
		//in case this is the first time the bot has been run.....
		if (!record){
			self._welcomeMessage();
			return self.db.run('INSERT INTO info(name,val) VALUES ("lastrun", ?)', currentTime);
		}
		
		//update the db table with the new last run time....
		self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
	});
};

// Supporting function --- used in firstRunCheck 
RacBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' + this.name + '` to invoke me!',
        {as_user: true});
};

// MESSAGE EVENT WATCHER...........................................
RacBot.prototype._onMessage = function (message){
	if (this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromRacbot(message) &&
		this._isMentioningRacbot(message)
	){
		this._replyWithJoke(message);
	}
};

RacBot.prototype._isChatMessage = function(message) {
		return message.type === 'message' && Boolean(message.text);
};

RacBot.prototype._isChannelConversation = function(message) {
		return typeof message.channel === 'string' &&
			message.channel[0] === 'C';
};

RacBot.prototype._isFromRacbot = function(message) {
		return message.user === this.user.id;
};

RacBot.prototype._isMentioningRacbot = function (message) {
	return message.text.toLowerCase().indexOf('racbot') > -1 || message.text.toLowerCase().indexOf(this.name) > -1;
};

//Joke reply
RacBot.prototype._replyWithJoke = function (originalMessage){
	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM () LIMIT 1', function(err, record){
		if (err) {
			return console.error('DATABASE ERROR BITCH:', err);
		}
		
		var channel = self._getChannelById(originalMessage.channel);
		self.postMessageToChannel(channel.name, record.joke, {as_user:true});
		self.db.run('UPDATE jokes SET used = used + 1 WHERE id =?', record.id);
	});
};

RacBot.prototype._getChannelById = function (channelId){
	return this.channels.filter(function(item){
		return item.id === channelId
	})[0];
};