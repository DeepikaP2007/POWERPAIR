export function validateProduct(p){
  if(!p||typeof p.name!=="string"||!p.name.trim())return {error:"Please enter a product name."};
  const numeric=["calories","protein","carbohydrates","sugar","fat","saturatedFat","fiber","sodium"];
  for(const key of numeric){if(p[key]===undefined||p[key]===""||Number.isNaN(Number(p[key]))||Number(p[key])<0)return {error:`Please enter a valid ${key} value.`};}
  return {valid:true};
}
export function scoreProduct(p){
  const n=k=>Number(p[k]||0);
  const protein=Math.min(n("protein")*4,24),fiber=Math.min(n("fiber")*5,25);
  const sugar=Math.max(0,20-n("sugar")*1.25),fat=Math.max(0,18-n("saturatedFat")*4);
  const sodium=Math.max(0,18-n("sodium")/25),calories=Math.max(0,15-Math.max(0,n("calories")-160)/20);
  const ingredients=String(p.ingredients||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  const concern=/glucose syrup|hydrogenated|bha|bht|artificial sweetener|msg/;
  const concernCount=ingredients.filter(x=>concern.test(x)).length;
  const ingredient=concernCount?Math.max(0,15-concernCount*5):15;
  return Math.max(0,Math.min(100,Math.round(protein+fiber+sugar+fat+sodium+calories+ingredient)));
}
export function buildComparison(a,b){
  const sa=scoreProduct(a),sb=scoreProduct(b);
  const winner=sa>=sb?a:b;
  const keys=[["calories","Calories","calories",false],["protein","Protein","protein",true],["carbohydrates","Carbohydrates","carbohydrates",false],["sugar","Sugar","sugar",false],["fat","Total fat","fat",false],["saturatedFat","Saturated fat","saturatedFat",false],["fiber","Fiber","fiber",true],["sodium","Sodium","sodium",false]];
  const rows=keys.map(([label,key,,positive])=>({label,a:Number(a[key]||0),b:Number(b[key]||0),better:a[key]===b[key]?"similar":positive?(Number(a[key])>Number(b[key])?"A":"B"): (Number(a[key])<Number(b[key])?"A":"B")}));
  const summary=[
    `${winner.name} is the stronger overall choice in this comparison.`,
    `${winner.name} provides the better balance of the entered nutrition values.`,
    "Overall, it is the more balanced option for the information provided."
  ];
  return {recommendedProduct:winner.name,overall:{a:sa,b:sb},summary,keyReasons:rows.filter(r=>r.better!=="similar").slice(0,3).map(r=>`${r.better==="A"?a.name:b.name} has the lower or higher preferred value for ${r.label}.`),rows,disclaimer:"This information is for general awareness and is not medical advice."};
}
export function buildIngredientExplanations(list){
  return list.split(",").map(x=>x.trim()).filter(Boolean).map(name=>{
    const key=name.toLowerCase();
    if(key.includes("citric"))return {ingredient:name,whatItMeans:"A sour-tasting food acid.",whyUsed:"Provides tartness and can help preserve freshness.",simpleExplanation:"Commonly used to balance flavor and maintain quality.",possibleConcern:"Usually not a concern in the small amounts used in food."};
    if(key.includes("sugar")||key.includes("glucose syrup"))return {ingredient:name,whatItMeans:"A sweetener.",whyUsed:"Adds sweetness and supports texture.",simpleExplanation:"It contributes to the product's sugar content.",possibleConcern:"Higher amounts can add to overall sugar intake."};
    if(/salt|sodium/.test(key))return {ingredient:name,whatItMeans:"A mineral used for flavor.",whyUsed:"Improves taste and may preserve food.",simpleExplanation:"It contributes to the product's sodium amount.",possibleConcern:"Large amounts increase sodium intake."};
    if(/oat|wholegrain/.test(key))return {ingredient:name,whatItMeans:"A grain ingredient.",whyUsed:"Adds substance, texture and often fiber.",simpleExplanation:"Wholegrain ingredients can contribute to a more filling food.",possibleConcern:"Usually not a concern unless a grain allergy is present."};
    return {ingredient:name,whatItMeans:"A food ingredient.",whyUsed:"May add flavor, texture or stability.",simpleExplanation:"Its role depends on the amount and the full recipe.",possibleConcern:"No specific concern can be identified from the name alone."};
  });
}
