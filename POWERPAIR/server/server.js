import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/products.js";
import ocrRoutes from "./routes/ocr.js";

const app=express();
app.use(cors());
app.use(express.json({limit:"1mb"}));
app.use("/api/products",productRoutes);
app.use("/api/ocr",ocrRoutes);
app.get("/api/health",(req,res)=>res.json({status:"ok",service:"Ingrevia API",timestamp:new Date().toISOString()}));
app.use((error,req,res,next)=>{
  if(error?.code==="LIMIT_FILE_SIZE")return res.status(400).json({error:"Image must be 5 MB or smaller."});
  console.error(error);
  res.status(error.status||500).json({error:error.message||"Unexpected server error"});
});
const port=process.env.PORT||5000;
app.listen(port,()=>console.log(`Ingrevia API listening on http://localhost:${port}`));
