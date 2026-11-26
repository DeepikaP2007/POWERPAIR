import {scoreProduct,validateProduct,buildComparison,buildIngredientExplanations} from "../utils/scoring.js";

export function analyzeProduct(req,res){
  const result=validateProduct(req.body);
  if(result.error)return res.status(400).json({error:result.error});
  const p=req.body,score=scoreProduct(p);
  res.json({product:p,score,rating:score>=90?"Excellent":score>=75?"Good":score>=50?"Moderate":"Needs attention",positiveFactors:buildPositive(p),warnings:buildWarnings(p),ingredients:buildIngredientExplanations(p.ingredients||""),disclaimer:"This information is for general awareness and is not medical advice."});
}
export function compareProducts(req,res){
  const {a,b}=req.body||{};
  const va=validateProduct(a||{}),vb=validateProduct(b||{});
  if(va.error||vb.error)return res.status(400).json({error:va.error||vb.error});
  res.json(buildComparison(a,b));
}
export function explainIngredients(req,res){
  const ingredients=req.body?.ingredients;
  if(!ingredients||typeof ingredients!=="string")return res.status(400).json({error:"An ingredient list is required."});
  res.json({items:buildIngredientExplanations(ingredients)});
}
function buildPositive(p){const items=[];if(p.protein>=8)items.push("Protein is relatively high.");if(p.fiber>=5)items.push("Fiber is relatively high.");if(p.sugar<=5)items.push("Sugar is relatively low.");return items.length?items:["No standout positive factor was entered."]}
function buildWarnings(p){const items=[];if(p.sugar>12)items.push("Sugar is high compared with the reference ranges.");if(p.saturatedFat>5)items.push("Saturated fat is relatively high.");if(p.sodium>300)items.push("Sodium is relatively high.");return items.length?items:["No major entered-value warning was identified."]}
