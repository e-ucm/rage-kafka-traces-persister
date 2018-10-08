var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('./config');
var monk = require('monk');
var db = monk(config.mongodb.uri);
var request = require('request');
var fs = require('fs');

db.collection('clients');

var app = express();
app.config = config;

// Initialize kafka and topic
var queue = require('./lib/wrappers/kafka')();
console.info(app.config.kafka);

queue.Init(app.config.kafka, function(error){
    if(error){
        console.log("Error on kafka Init: " + error);
        return;
    }
    if (!fs.existsSync(config.kafka.rawTracesFolder)){
        fs.mkdirSync(config.kafka.rawTracesFolder);
    }
    
    queue.CreateConsumer(app.config.kafka.topicName, function(message){
        var value = JSON.parse(message.value);
        // Save data into a file
        var file = config.kafka.rawTracesFolder + '/' + value.statement.actor.name + "_" + value.activityId;
        fs.appendFile(file, message.value + '\n', (err) => {
            if (err) {
                console.error(err);
            }
            console.log('statements from actor ' + value.statement.actor.name + ' and activity' + value.activityId + 'to', file);
        });
    })
});

app.queue = queue;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser());
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index');
});

// Make our db accessible to our router
app.use(function(req,res,next){
   req.db = db;
   next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  var info = {
        message: err.message,
        error: true
    };

    console.log(err);
    //info.stack = err.stack;

  res.status(err.status || 500).send(info);
});

module.exports = app;
