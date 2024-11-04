// saving files on our server so we can send it to cloudinary ...
// we do file handling in express using multer

import multer from "multer";

const storage = multer.diskStorage({
  // This fn determines the folder where the uploaded files will be stored.
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  // This fn determines the name that the uploaded file will have on the server.
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
});

// export const upload = multer({
//   storage: storage, // Use the storage configuration defined above
// });
