var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose'); // 👈 ADD THIS

var indexRouter = require('./routes/index');
const userModel = require('./routes/users'); // Corrected to point to users.js

var app = express();

// 👇 ADD THE CONNECTION LOGIC HERE
mongoose.connect('mongodb://127.0.0.1:27017/LookNew')
  .then(() => {
    console.log("✅ Database connected successfully!");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressSession({
  resave: false,
  saveUninitialized: false,
  secret: 'he he he'
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(userModel.authenticate()));
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

app.use('/', indexRouter);
// app.use('/users', userModel); // Removed, as it's not needed based on index.js routes

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;










// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// // app.use(express.static('public'));//************************************************** 


// const expressSession=require("express-session");//................
// const flash=require("connect-flash");  //taking package...00000


// var indexRouter = require('./routes/index');
// // var usersRouter = require('./routes/users');
// const userModel = require('./routes/userModelPath'); // use correct relative path

// const passport = require('passport');
// const LocalStrategy = require("passport-local");//gemini.............

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// app.use(flash());  //by these 2 lines added in app.js...00000=>setting up to use flash=>activated flash messages
// app.use(expressSession({ //start of project=>from here=>added..... 
//   resave:false,
//   saveUninitialized:false,
//   secret:"he he he"
// }))


// app.use(passport.initialize());
// app.use(passport.session());
// // passport.serializeUser(usersRouter.serializeUser());
// // passport.deserializeUser(usersRouter.deserializeUser());
// passport.serializeUser(userModel.serializeUser());
// passport.deserializeUser(userModel.deserializeUser());




// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;
