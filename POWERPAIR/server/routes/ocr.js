import express from "express";
import multer from "multer";
import {recognize} from "tesseract.js";
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(req,file,next)=>["image/jpeg","image/png"].includes(file.mimetype)?next():next(Object.assign(new Error("Please upload a JPG, JPEG or PNG image."),{status:400}))});

router.post("/",upload.single("image"),async(req,res)=>{
  if(!req.file)return res.status(400).json({error:"Choose an image first."});
  try{
    const result=await recognize(req.file.buffer,"eng",{logger:m=>{}});
    const text=result.data.text?.trim();
    if(!text)return res.status(422).json({error:"No readable text was found. Try a brighter, clearer photo.",confidence:0,text:""});
    res.json({text,confidence:Math.round(result.data.confidence||0),warning:result.data.confidence<70?"Low OCR confidence. Please verify every extracted value.":null});
  }catch(error){res.status(500).json({error:"OCR could not process this image. Try another photo."});}
});
export default router;
