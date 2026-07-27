import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.Cloudinary_Cloud_name,
  api_key: process.env.Cloudinary_API_key,
  api_secret: process.env.Cloudinary_API_secret,
});

export default cloudinary;