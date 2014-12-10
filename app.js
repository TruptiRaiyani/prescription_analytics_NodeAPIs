var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// new code --- for mongodb
var mongo = require('mongodb');

var monk = require('monk');

var cors = require('cors');

var db = monk('localhost:27017/prescriptionanalytics');

var routes = require('./routes/index');
var users = require('./routes/users');
var nodemailer = require("nodemailer");
var app = express();

 var smtpTransport = nodemailer.createTransport("SMTP",{
service: "Gmail",
auth: {
user: "raiyani.trupti@gmail.com",
pass: "sid@123#"
}
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req,res,next){
    req.db = db;
       // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', "*");

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
//app.disable('etag');
app.use('/', routes);
app.use('/users', users);
app.use(cors());
/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.get('/ForgotPassword/:emailID',function(req,res){
    console.log("called");
var mailOptions={
to : req.params.emailID,
subject : "he there",
text : "test email"
}
console.log(mailOptions);
smtpTransport.sendMail(mailOptions, function(error, response){
if(error){
console.log(error);
res.send("error");
}else{
console.log("Message sent: " + response.message);
res.send("sent");
}
});
});

module.exports = app;
