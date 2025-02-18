import multer from "multer";
import path from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  // the function that saves the file
  destination: function (req, file, cb) {
    // where we are storing the file
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    // what is the filename going to be
    cb(null, `${Date.now()}-${file.originalname}`); // this will save files like: date-filename.extension
  },
});

const upload = multer({ storage: storage }); // the middleware function that handles uploading

export default upload;
