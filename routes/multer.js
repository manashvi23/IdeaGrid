const multer=require("multer");
const {v4:uuidv4}=require("uuid");
const path=require("path")//inbuild package in node
//finding extension of a file is very easy
//console.log(path.extname("hello.pdf"));


//available in multer docs. so don't have to mug up
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
   
    const uniquename=uuidv4();

    cb(null, uniquename+path.extname(file.originalname));
  }
})

module.exports= multer({ storage: storage })
