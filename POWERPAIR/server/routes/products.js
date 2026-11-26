import express from "express";
import { analyzeProduct,compareProducts,explainIngredients } from "../controllers/products.js";
import {buildComparison} from "../utils/scoring.js";
const router=express.Router();
router.post("/analyze",analyzeProduct);
router.post("/compare",compareProducts);
router.post("/ingredients/explain",explainIngredients);
router.post("/summary",(req,res)=>{
  const {a,b}=req.body||{};
  if(!a||!b)return res.status(400).json({error:"Product A and Product B are required."});
  res.json(buildComparison(a,b));
});
export default router;
