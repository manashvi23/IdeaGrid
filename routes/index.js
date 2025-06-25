var express = require('express');
var router = express.Router();
const userModel=require("./users");
const postModel=require("./posts");
const passport = require('passport');
const upload=require("./multer");  //importing multer file
//understand like this(sir)=====>
const localStrategy=require("passport-local");//after writing /register route
passport.use(new localStrategy(userModel.authenticate()));
//user logins with these 2 line====>

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  //console.log(req.flash("error"));  //gives error=>when entering wrong things and redirected to /login,else [] when go by writing url by ourselves
  //so sending this error=>{error:req.flash('error')}
  res.render('login',{error:req.flash('error')});
  //res.render('login');
});
// router.get('/login', function(req, res, next) {
//   console.log("Entering /login GET route");
//   try {
//     const errorMessage = req.flash('error');
//     console.log("Flash error message:", errorMessage);
//     res.render('login', { error: errorMessage });
//     console.log("Successfully rendered login page.");
//   } catch (e) {
//     console.error("Error inside /login GET route:", e);
//     // This will prevent the 500 from happening here and potentially show the error in the console.
//     res.status(500).send("An internal error occurred on the login page. Check server logs.");
//   }
// });

router.get('/feed', function(req, res, next) {
  res.render('feed');
});

//make any route for uplaoding
router.post('/upload',isLoggedIn,upload.single("file"),async function(req, res, next) {
  // console.log('Request file:', req.file); // Debug log
  // console.log('Request body:', req.body); // Debug log
  if(!req.file){  //if no file there =>error managing
    return res.status(404).send("no files were given")
  }
  //res.send("file uploaded successfully");
  //jo file upload hui hai use save karo as a post and uskapostid user ko and post ko userid do

  //saving as loggedin user's post
  //first find our user
  const user=await userModel.findOne({username:req.session.passport.user})
  //passing loggedin user's detail while making post
  const post=await postModel.create({
    image:req.file.filename,
    imageText:req.body.filecaption,
    user:user._id
  });

  user.posts.push(post._id);
  await user.save();
  //res.send("done");
  res.redirect("/profile");  //go back to /profile page

});



//profile route
router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user=await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts") //working on showing posts on profile page
  console.log(user); // can see also user's details....
  
  

  res.render("profile",{user}); //send=>render so profile page will be going to show

//by gemini to confirm it's working fine...................................
  //  console.log("req.session.passport.user:", req.session.passport.user); // Add this line
  //   const user = await userModel.findOne({
  //   username: req.session.passport.user
  // });
  // console.log("Found user:", user); // Add this line

  // if (!user) {
  //   // If user is not found, handle it gracefully instead of crashing
  //   console.error("User not found for profile page, username:", req.session.passport.user);
  //   return res.redirect('/login'); // Or render an error page, or show a message
  // }

  // res.render("profile",{user});
//by gemini to confirm it's working fine...................................

});


router.post('/register',function(req,res){
  // const userData=new userModel({ 
  //   username:req.body.username,
  //     email:req.body.email,
  //     fullName:req.body.fullName,
  // })===>>>reduced form==>>
  const { username, email, fullname } = req.body;
  const userData = new userModel(({ username, email, fullname}));

  userModel.register(userData,req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile");
    })
  })
})


//just because i wrote it < % (instead of <%) i suffered hours from errors and not opening /login route=>in login.ejs

router.post('/login',passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login",
  failureFlash:true  //by this when error comes=>we are making ready of the functionality of getting flash message=>creates the flash message
  //step1=>installed connect-flash,s2=>added this above line,s3=>added lines in app.js,s4=>added lines in /login router code part


}),function(req,res){ 
});

router.get("/logout",function(req,res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });

});

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

// router.get('/alluserposts',async function(req, res, next) {
//   let user=await userModel.findOne({_id:"68506c3fac4d57d5f6e6adf0"}).populate('posts')
//   res.send(user);  //1 problem=>it gives just ids what we'll do with this only=>want real time data =>.population()

// });


// //after creating two user.js and posts.js models =>now creating route to create route where user will be created
// router.get('/createuser',async function(req, res, next) {

//   let createduser=await userModel.create({
//     username: "romi",
//     email: "romi@gmail.com",
//     password: "hehehe",
//     posts: [],
//     fullName: "Manashvi Sewal"
//   });

//   res.send(createduser);

// });

// //similarly like create route=>for creating posts also
// router.get('/createpost',async function(req, res, next) {
//   let createdpost=await postModel.create({
//     postText:"kaise ho sare",
//     user:"68506c3fac4d57d5f6e6adf0",  //while making post we can pass userId....just we saved this user id data to post model
//   });

//   let user=await userModel.findOne({_id:"68506c3fac4d57d5f6e6adf0"})
//   user.posts.push(createdpost._id)//still have to save manually
//   await user.save();
//   res.send("done");


//   //res.send(createpost);

// });




module.exports = router;
