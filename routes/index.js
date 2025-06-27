var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require('passport');
const multer = require('multer'); // Import multer directly
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  res.render('login', { error: req.flash('error') });
});

// router.get('/feed', function(req, res, next) {
//   res.render('feed');
// });

// Existing upload route for posts
router.post('/upload', isLoggedIn, require("./multer").single("file"), async function(req, res, next) {
  if (!req.file) {
    return res.status(400).send("No files were given");
  }
  const user = await userModel.findOne({ username: req.session.passport.user });
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});




//for feed page=>all user's feed
// router.get('/feed',async function(req, res, next) {
//   //my person whole is loggedin
//   const user=await userModel.findOne({username:req.session.passport.user})
//   const posts=await postModel.find()
//   .populate("user")

//   res.render("feed",{user,posts})

// });
router.get('/feed', async function(req, res, next) {
  try {
    // Fetch all posts and populate user data
    const posts = await postModel.find().populate("user");
    
    // Check if user is logged in
    let user = null;
    if (req.isAuthenticated()) {
      user = await userModel.findOne({ username: req.session.passport.user });
    }
    
    // Render feed with posts and user (if logged in)
    res.render("feed", { user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});




// Storage configuration for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadAvatar = multer({ storage: storage }); // New upload instance for avatar

// Avatar upload route
router.post('/upload-avatar', isLoggedIn, uploadAvatar.single('dp'), async function(req, res, next) {
  console.log("Upload avatar received:", req.file);
  if (req.file) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const dpPath = `/images/uploads/${req.file.filename}`;
    await userModel.findByIdAndUpdate(user._id, { dp: dpPath });
    res.redirect('/profile'); // Redirect to refresh with the new avatar
  } else {
    res.status(400).send('No file uploaded');
  }
});

// Profile route
router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
  console.log(user);
  res.render("profile", { user });
});

router.post('/register', function(req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });
  userModel.register(userData, req.body.password).then(function() {
    passport.authenticate("local")(req, res, function() {
      res.redirect("/profile");
    });
  });
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res) {});

router.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

//download feature...
router.get('/download/:filename', function(req, res) {
  const filePath = path.join(__dirname, '../public/images/uploads', req.params.filename);
  res.download(filePath, function(err) {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("File not found or download error");
    }
  });
});







module.exports = router;





