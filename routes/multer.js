// const multer=require("multer");
// const {v4:uuidv4}=require("uuid");
// const path=require("path")//inbuild package in node
// //finding extension of a file is very easy
// //console.log(path.extname("hello.pdf"));


// //available in multer docs. so don't have to mug up
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/images/uploads')
//   },
//   filename: function (req, file, cb) {
   
//     const uniquename=uuidv4();

//     cb(null, uniquename+path.extname(file.originalname));
//   }
// })

// module.exports= multer({ storage: storage })

//SWITCHING TO CLOUDINARY............
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Authenticate with your Cloudinary account
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// 2. Tell Multer to send files to the Cloud instead of the local hard drive
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'looknew_uploads', // This creates a neat folder in your Cloudinary dashboard
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

// 3. Export the configured multer instance
const upload = multer({ storage: storage });
module.exports = upload;
