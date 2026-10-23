// integrating ai
require('dotenv').config(); 
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// integrating ai

var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const commentModel = require("./comments"); ///for adding comments.....import the new model
const passport = require('passport');
const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index');
// });

router.get('/login', function(req, res, next) {
  res.render('login', { error: req.flash('error') });
});

// The AI Moderation Middleware
async function checkToxicity(req, res, next) {
  try {
    const caption = req.body.filecaption;
    
    // If there's no caption, just let it pass
    if (!caption || caption.trim() === '') {
      return next(); 
    }

    const prompt = `Analyze the following text for toxicity, hate speech, severe profanity, or spam. Reply with EXACTLY the word "REJECT" if it is toxic/unsafe, or "SAFE" if it is okay. Do not return any other words. Text: "${caption}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    const verdict = response.text.trim().toUpperCase();

    if (verdict === 'REJECT') {
      // 🚩 AI caught something bad! Flash an error and kick them back
      req.flash('error', 'Post blocked: Violates community guidelines.');
      return res.redirect('/profile'); 
    }

    // ✅ AI says it's safe! Move to the next function
    next(); 

  } catch (error) {
    console.error("AI Moderation Error:", error);
    next(); // If the AI API fails, let the post through so your site doesn't break
  }
}

// ☁️ CLOUDINARY POST UPLOAD ROUTE...later..+dashboard streak calculations
router.post('/upload', isLoggedIn, require("./multer").single("file"), checkToxicity, async function(req, res, next) {
  if (!req.file) {
    return res.status(400).send("No files were given");
  }

  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    // --- STREAK CALCULATOR ENGINE ---
    const now = new Date();
    // Normalize "today" to midnight so we strictly compare calendar days, not hours
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!user.lastPostDate) {
      // Very first post ever! Start the streak.
      user.currentStreak = 1;
    } else {
      // Normalize their last post date to midnight
      const lastPost = new Date(user.lastPostDate.getFullYear(), user.lastPostDate.getMonth(), user.lastPostDate.getDate());
      
      // Calculate the difference in milliseconds, then convert to Days
      const diffTime = Math.abs(today - lastPost);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // They posted yesterday! Streak continues.
        user.currentStreak += 1;
      } else if (diffDays > 1) {
        // They missed a day. Streak resets.
        user.currentStreak = 1;
      }
      // Note: If diffDays === 0, they already posted today. The streak stays exactly the same.
    }

    // Update their last post timestamp to right now
    user.lastPostDate = now;

    // --- CREATE THE POST ---
    const post = await postModel.create({
      image: req.file.path, // 👈 Saves the secure Cloudinary URL
      imageText: req.body.filecaption,
      user: user._id
    });

    // --- SAVE TO DATABASE ---
    user.posts.push(post._id);
    await user.save(); // Updates both the post array and the streak variables concurrently
    
    res.redirect("/profile");

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).send("Server Error");
  }
});

// for feed page => all user's feed
// router.get('/feed', async function(req, res, next) {
//   try {
//     // // Fetch all posts and populate user data
//     // const posts = await postModel.find().populate("user");
//     // 1. Set up Pagination Variables
//     const limit = 10; // Show exactly 10 posts per page
//     const page = parseInt(req.query.page) || 1; // Read '?page=X' from URL. Default to 1.
//     const skip = (page - 1) * limit; // The math to skip old posts

//     // 2. Fetch the specific batch of posts (The Bookshelf method)
//     const posts = await postModel.find()
//       .sort({ _id: -1 }) // Sort newest to oldest
//       .skip(skip)        // Skip the ones from previous pages
//       .limit(limit)      // Grab exactly 10
//       .populate("user")
//       // 👇 ADD THIS TO DEEP POPULATE COMMENTS AND THEIR AUTHORS 👇
//       .populate({
//         path: "comments",
//         populate: { path: "user" }
//       });

//     // 3. Count the total posts so we know how many pages exist
//     const totalPosts = await postModel.countDocuments();
//     const totalPages = Math.ceil(totalPosts / limit);


//     // Check if user is logged in
//     let user = null;
//     if (req.isAuthenticated()) {
//       user = await userModel.findOne({ username: req.session.passport.user });
//     }
    
//     // // Render feed with posts and user (if logged in)
//     // res.render("feed", { user, posts });

//     // 4. Send the posts AND the page data to EJS
//     res.render("feed", { 
//       user, 
//       posts, 
//       currentPage: page, 
//       totalPages: totalPages 
//     });


//   } 
//   catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });
// --- UPDATED SMART FEED ROUTE (Handles Global & Following) ---
router.get('/feed', isLoggedIn, async function(req, res, next) {
  try {
    const limit = 10; 
    const page = parseInt(req.query.page) || 1; 
    const skip = (page - 1) * limit; 
    
    // Check the URL for '?view='. Default to 'global' if it's missing.
    const view = req.query.view || 'global'; 

    const currentUser = await userModel.findOne({ username: req.session.passport.user });
    
    let query = {}; // Start with an empty query (gets everything)

    // If the user clicked the "Following" tab, inject the filter algorithm
    if (view === 'following') {
      const usersToShow = [...currentUser.following, currentUser._id];
      query = { user: { $in: usersToShow } };
    }

    // Pass the dynamic query into the database call
    const posts = await postModel.find(query)
      .sort({ _id: -1 }) 
      .skip(skip)        
      .limit(limit)      
      .populate("user")
      .populate({
        path: "comments",
        populate: { path: "user" }
      });

    // Count only the specific posts requested
    const totalPosts = await postModel.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    res.render("feed", { 
      user: currentUser, 
      posts, 
      currentPage: page, 
      totalPages: totalPages,
      currentView: view // Send this to EJS so we know which button to highlight!
    });

  } 
  catch (err) {
    console.error("Feed Error:", err);
    res.status(500).send("Server error");
  }
});



// ☁️ CLOUDINARY AVATAR UPLOAD ROUTE
router.post('/upload-avatar', isLoggedIn, require("./multer").single('dp'), async function(req, res, next) {
  console.log("Upload avatar received:", req.file);
  if (req.file) {
    const user = await userModel.findOne({ username: req.session.passport.user });
    
    // 👈 Saves the secure Cloudinary URL directly to the user's 'dp' field
    await userModel.findByIdAndUpdate(user._id, { dp: req.file.path }); 
    
    res.redirect('/profile'); 
  } else {
    res.status(400).send('No file uploaded');
  }
});

// // Profile route....before follow/unfollow feature
// router.get('/profile', isLoggedIn, async function(req, res, next) {
//   const user = await userModel.findOne({ username: req.session.passport.user })
//     .populate("posts")
//     .populate({
//       path: "downloads", 
//       populate: { path: "user" } // 👈 Deep populate to fix the missing username bug
//     }); 

//    res.render("profile", { user, error: req.flash('error') });
// });

// --- UPDATED PROFILE ROUTE (Handles Self & Public Profiles) ---
router.get('/profile/:username?', isLoggedIn, async function(req, res, next) {
  try {
    // 1. Get the person currently logged in
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });

    // 2. Determine whose profile we are trying to look at
    let profileToView = loggedInUser; 
    
    // If there is a username in the URL (e.g., /profile/johndoe), fetch that user instead
    if (req.params.username) {
      profileToView = await userModel.findOne({ username: req.params.username });
      
      if (!profileToView) {
        return res.status(404).send("User not found");
      }
    }

    // 3. Send BOTH user objects to the EJS template
    res.render('profile', { 
      user: profileToView,        // The data for the profile being displayed
      loggedInUser: loggedInUser, // The data for the person viewing it
      error: req.flash('error')
    });

  } catch (error) {
    console.error("Profile Route Error:", error);
    res.status(500).send("Error loading profile");
  }
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

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.error("--- PASSPORT AUTHENTICATION ERROR ---");
      console.error(err); 
      return next(err);
    }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, function(err) {
      if (err) {
        console.error("--- SESSION LOGIN ERROR ---");
        console.error(err); 
        return next(err);
      }
      return res.redirect('/profile');
    });
  })(req, res, next);
});

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

// ⚠️ DEACTIVATED: Local downloads do not work with Cloudinary.
// We will update the download button in the EJS templates later.
/*
router.get('/download/:filename', function(req, res) {
  const filePath = path.join(__dirname, '../public/images/uploads', req.params.filename);
  res.download(filePath, function(err) {
    if (err) {
      console.error("Download error:", err);
      res.status(500).send("File not found or download error");
    }
  });
});
*/



// // This route SAVES a post reference to the user's profile
// router.get('/save/:postid', isLoggedIn, async function(req, res) {
//   const user = await userModel.findOne({ username: req.session.passport.user });
//   user.downloads.push(req.params.postid); 
//   await user.save(); 
//   res.redirect('/feed'); 
// });

// This route SAVES a post reference silently via AJAX
// router.get('/save/:postid', isLoggedIn, async function(req, res) {
//   try {
//     const user = await userModel.findOne({ username: req.session.passport.user });
    
//     // Check if the user already saved this post to prevent duplicates
//     if (user.downloads.includes(req.params.postid)) {
//       return res.json({ success: true, message: "Already saved" });
//     }

//     // Add to downloads and save
//     user.downloads.push(req.params.postid); 
//     await user.save(); 
    
//     // 👇 Send a silent JSON success message instead of a redirect!
//     res.json({ success: true }); 

//   } catch (error) {
//     console.error("Error saving post:", error);
//     res.status(500).json({ success: false, error: "Server error" });
//   }
// });
// Route to Save / Unsave a post silently via AJAX
router.get('/save/:postid', isLoggedIn, async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    
    // Check if the user already saved this post
    const savedIndex = user.downloads.indexOf(req.params.postid);

    let isSaved = false;
    if (savedIndex === -1) {
      // Not saved yet -> Add to array (Save)
      user.downloads.push(req.params.postid); 
      isSaved = true;
    } else {
      // Already saved -> Remove from array (Unsave)
      user.downloads.splice(savedIndex, 1);
      isSaved = false;
    }

    await user.save(); 
    res.json({ success: true, isSaved: isSaved }); 

  } catch (error) {
    console.error("Error toggling save:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});




// The AI Polishing Endpoint
router.post('/api/polish', async (req, res) => {
  try {
    const rawText = req.body.draft;
    const userMood = req.body.mood || 'casual'; 
    
    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({ error: "No text provided" });
    }

    let promptInstructions = "";

    if (userMood === 'professional') {
      promptInstructions = "Rewrite this text to sound highly professional and polished, suitable for a developer portfolio or LinkedIn. Use clean grammar and elevated vocabulary. Do not use emojis.";
    } 
    else if (userMood === 'witty') {
      promptInstructions = "Rewrite this text to be witty, clever, and slightly humorous for a social media feed. Keep it punchy and engaging.";
    } 
    else if (userMood === 'genz') {
      promptInstructions = "Rewrite this text to sound exactly like a chronically online Gen Z user. Use modern internet slang (like 'no cap', 'fr', 'slay', or 'bet'), keep it mostly lowercase, and use chaotic emojis like 💀, 😭, or 💅. Do not be overly formal.";
    }
    else {
      promptInstructions = "Fix the grammar and spelling of the following text. Make it sound natural, friendly, and casual for a standard social feed. Keep the original meaning.";
    }

    const finalPrompt = `${promptInstructions} Return ONLY the polished text, nothing else. Text: "${rawText}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: finalPrompt
    });

    res.json({ polishedText: response.text.trim() });

  } catch (error) {
    console.error("AI Polish Error:", error);
    res.status(500).json({ error: "Failed to polish text" });
  }
});


// Route to handle Liking/Unliking a post via AJAX
router.get('/like/:postid', isLoggedIn, async function(req, res) {
  try {
    // 1. Find the target post and the current logged-in user
    const post = await postModel.findById(req.params.postid);
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // 2. Check if the user has already liked this post
    const userIndex = post.likes.indexOf(user._id);

    let isLiked = false;
    if (userIndex === -1) {
      // User hasn't liked it yet -> Add user ID to array (Like)
      post.likes.push(user._id);
      isLiked = true;
    } else {
      // User already liked it -> Remove user ID from array (Unlike)
      post.likes.splice(userIndex, 1);
      isLiked = false;
    }

    // 3. Save the updated post document
    await post.save();

    // 4. Return the status and updated count to the frontend
    res.json({ 
      success: true, 
      likesCount: post.likes.length, 
      isLiked: isLiked 
    });

  } catch (error) {
    console.error("Error processing like:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// Route to handle posting a comment via AJAX
router.post('/comment/:postid', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findById(req.params.postid);
    const user = await userModel.findOne({ username: req.session.passport.user });

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // 1. Create the new comment in the database
    const newComment = await commentModel.create({
      commentText: req.body.commentText,
      user: user._id,
      post: post._id
    });

    // 2. Add the comment ID to the post's array and save
    post.comments.push(newComment._id);
    await post.save();

    // 3. Send back the success status AND the data we need to update the UI
    res.json({ 
      success: true, 
      commentText: newComment.commentText,
      username: user.username 
    });

  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Route to completely destroy a post (AJAX)
router.post('/delete/post/:postid', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findById(req.params.postid).populate('user');
    
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    // Security Check: Ensure the logged-in user actually owns this post!
    if (post.user.username !== req.session.passport.user) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Destroy the post in the database
    await postModel.findByIdAndDelete(req.params.postid);
    
    res.json({ success: true });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// --- DASHBOARD ROUTE ---
router.get('/dashboard', isLoggedIn, async function(req, res) {
  try {
    // Fetch the user and fully populate their posts so we can count their stats
    const user = await userModel.findOne({ username: req.session.passport.user }).populate('posts');
    
    if (!user) {
      return res.redirect('/login');
    }

    // Aggregate Data: Calculate total likes received across all posts
    let totalLikesReceived = 0;
    if (user.posts && user.posts.length > 0) {
      user.posts.forEach(post => {
        if (post.likes) {
          totalLikesReceived += post.likes.length;
        }
      });
    }

    // Send all this compiled data to the new dashboard view
    res.render('dashboard', { 
      user: user, 
      totalPosts: user.posts.length,
      totalDownloads: user.downloads.length,
      totalLikes: totalLikesReceived
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

// --- UPDATE PROFILE ROUTE ---
router.post('/profile/update', isLoggedIn, async function(req, res) {
  try {
    // findOneAndUpdate is much faster than findById + save for basic text updates
    await userModel.findOneAndUpdate(
      { username: req.session.passport.user },
      {
        tagline: req.body.tagline,
        description: req.body.description,
        'socials.instagram': req.body.instagram,
        'socials.twitter': req.body.twitter,
        'socials.facebook': req.body.facebook
      }
    );
    
    // Send them right back to the profile page so they see the changes instantly
    res.redirect('/profile');
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).send("Error updating profile");
  }
});

// --- API: PAGINATED PROFILE POSTS ---
router.get('/api/profile/posts', isLoggedIn, async function(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9; // Only fetch 9 posts at a time
    const skip = (page - 1) * limit;
    const type = req.query.type || 'uploads'; // 'uploads' or 'saved'

    //const user = await userModel.findOne({ username: req.session.passport.user });........changed this line to next line
    // Check if a specific username was requested, otherwise default to the logged-in user..follow/unfollow feature
    const targetUsername = req.query.user || req.session.passport.user;
    const user = await userModel.findOne({ username: targetUsername });
    
    let posts = [];

    if (type === 'uploads') {
      // Query the post model directly for maximum speed
      posts = await postModel.find({ user: user._id })
                             .populate('user')
                             .skip(skip)
                             .limit(limit);
    } else if (type === 'saved') {
      // Populate the downloads array using pagination options
      const populatedUser = await userModel.findById(user._id).populate({
        path: 'downloads',
        populate: { path: 'user' }, // Need the original author's name
        options: { skip: skip, limit: limit }
      });
      posts = populatedUser.downloads;
    }

    // Send the data as JSON, and tell the frontend if there are more posts to load
    res.json({ success: true, posts: posts, hasMore: posts.length === limit });

  } catch (error) {
    console.error("API Pagination Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


// --- API: FOLLOW / UNFOLLOW USER ---
router.post('/follow/:userid', isLoggedIn, async function(req, res) {
  try {
    // 1. Locate both users in the database
    const loggedInUser = await userModel.findOne({ username: req.session.passport.user });
    const targetUser = await userModel.findById(req.params.userid);

    if (!targetUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Edge Case: Prevent users from following their own profile
    if (loggedInUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ success: false, error: "You cannot follow yourself" });
    }

    // 2. Check the current state of the relationship
    const isFollowing = loggedInUser.following.includes(targetUser._id);

    if (isFollowing) {
      // --- UNFOLLOW LOGIC ---
      // .pull() is a Mongoose command that safely removes an item from an array
      loggedInUser.following.pull(targetUser._id);
      targetUser.followers.pull(loggedInUser._id);
    } else {
      // --- FOLLOW LOGIC ---
      // .push() adds the item to the array
      loggedInUser.following.push(targetUser._id);
      targetUser.followers.push(loggedInUser._id);
    }

    // 3. Save both updates simultaneously
    await loggedInUser.save();
    await targetUser.save();

    // 4. Return JSON so the frontend can swap the button text without reloading the page
    res.json({ success: true, isFollowing: !isFollowing });

  } catch (error) {
    console.error("Follow API Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// --- API: REAL-TIME USER SEARCH...on /feed page ---
router.get('/api/search/:query', isLoggedIn, async function(req, res) {
  try {
    // 1. Create a Case-Insensitive Regular Expression from the search term
    const regex = new RegExp(req.params.query, 'i');
    
    // 2. Find up to 5 users whose usernames match the regex
    const users = await userModel.find({ username: regex })
      .select('username dp') // We only need their username and profile pic!
      .limit(5);

    // 3. Send the array back to the frontend
    res.json({ success: true, users: users });
    
  } catch (error) {
    console.error("Search API Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});


//first landing page...
router.get('/', (req, res) => {
    // Everyone renders the landing page, but we tell EJS if they are logged in
    res.render('landing', { 
        isLoggedIn: req.isAuthenticated() 
    });
});

// Get Followers or Following List
router.get('/api/network/:id/:type', async (req, res) => {
    try {
        const { id, type } = req.params;
        
        // Security check: only allow 'followers' or 'following' as the type
        if (type !== 'followers' && type !== 'following') {
            return res.status(400).json({ success: false, error: 'Invalid list type' });
        }

        // Find the user and populate the array
        // We only select the specific fields we need to keep the payload light and fast
        // Replace 'userModel' with whatever variable name you use for your User schema!
        const user = await userModel.findById(id).populate(type, 'username dp tagline');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Send the populated array back to the frontend
        res.json({ success: true, list: user[type] });

    } catch (error) {
        console.error("Network API Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});




module.exports = router;