const $ = (selector, root=document) => (typeof root === "string" ? document : root).querySelector(selector);
const $$ = (selector, root=document) => [...(typeof root === "string" ? document : root).querySelectorAll(selector)];
const escapeHtml = value => String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

const demo = {
  a: {name:"Wholegrain Apple Oats",brand:"Greens Basket",servingSize:"40 g",calories:180,protein:7,carbohydrates:32,sugar:5,fat:4,saturatedFat:1,fiber:6,sodium:160,ingredients:"Wholegrain oats, apple pieces, chicory fiber, sunflower oil, cinnamon, sea salt"},
  b: {name:"Chocolate Berry Crunch",brand:"Morning Joy",servingSize:"40 g",calories:220,protein:4,carbohydrates:38,sugar:14,fat:7,saturatedFat:3,fiber:2,sodium:260,ingredients:"Wholegrain wheat, sugar, cocoa powder, palm oil, berries, glucose syrup, soy lecithin, salt"}
};

const demoLibrary = [
  {name:"Chocolate Crunch Cereal",brand:"Sweet Morning",servingSize:"40 g",calories:210,protein:4,carbohydrates:40,sugar:15,fat:6,saturatedFat:2.5,fiber:3,sodium:280,ingredients:"Refined wheat, sugar, cocoa, palm oil, soy lecithin"},
  {name:"Peanut Protein Bar",brand:"Trail Fuel",servingSize:"50 g",calories:190,protein:12,carbohydrates:23,sugar:7,fat:8,saturatedFat:2,fiber:5,sodium:180,ingredients:"Peanuts, whey protein, oats, dates, cocoa, sunflower lecithin"},
  {name:"Orange Fruit Juice",brand:"Orchard Press",servingSize:"250 ml",calories:110,protein:1,carbohydrates:26,sugar:23,fat:0,saturatedFat:0,fiber:0,sodium:20,ingredients:"Orange juice, vitamin C"},
  {name:"Wholegrain Breakfast Biscuits",brand:"Simple Mornings",servingSize:"30 g",calories:130,protein:3,carbohydrates:24,sugar:4,fat:3,saturatedFat:1,fiber:4,sodium:145,ingredients:"Wholegrain wheat, oat fiber, sunflower oil, sugar, sea salt"},
  {name:"Fruit and Nut Breakfast Cereal",brand:"Harvest Bowl",servingSize:"45 g",calories:195,protein:6,carbohydrates:35,sugar:9,fat:5,saturatedFat:1,fiber:7,sodium:175,ingredients:"Wholegrain oats, almonds, raisins, chicory fiber, cinnamon"}
];

const approximateNutritionProfiles = [
  {category:"protein bar",pattern:/\bprotein bars?\b/i,servingSize:"50 g",values:{calories:190,protein:12,carbohydrates:23,sugar:7,fat:8,saturatedFat:2,fiber:5,sodium:180}},
  {category:"breakfast cereal",pattern:/\b(?:breakfast )?cereal\b(?!\s+bar\b)|\bgranola\b(?!\s+bar\b)|\boatmeal\b/i,servingSize:"40 g",values:{calories:180,protein:5,carbohydrates:30,sugar:8,fat:4,saturatedFat:1.5,fiber:4,sodium:200}},
  {category:"fruit juice",pattern:/\b(?:fruit )?juices?\b/i,servingSize:"250 ml",values:{calories:110,protein:1,carbohydrates:26,sugar:23,fat:0,saturatedFat:0,fiber:0,sodium:20}},
  {category:"biscuit or cookie",pattern:/\b(?:biscuits?|cookies?)\b/i,servingSize:"30 g",values:{calories:130,protein:3,carbohydrates:24,sugar:4,fat:3,saturatedFat:1,fiber:4,sodium:145}}
];

let foodProducts=[];
let foodProductsLoadError="";
const foodProductsReady=fetch("./data/foodProducts.json")
  .then(response=>{
    if(!response.ok)throw new Error(`Dataset request failed (${response.status}).`);
    return response.json();
  })
  .then(records=>{
    if(!Array.isArray(records)||records.some(record=>
      !record||typeof record.productName!=="string"||typeof record.description!=="string"
    ))throw new Error("Dataset must contain product names and descriptions.");
    foodProducts=records;
    populateDatasetProductOptions();
  })
  .catch(error=>{
    foodProductsLoadError=error instanceof Error?error.message:String(error);
    console.error("Could not load product descriptions:",error);
    populateDatasetProductOptions();
  });

const nutrientFields = [
  ["name","Product name","text"],["brand","Brand","text"],["servingSize","Serving size","text"],
  ["calories","Calories","number"],["protein","Protein (g)","number"],["carbohydrates","Carbohydrates (g)","number"],
  ["sugar","Sugar (g)","number"],["fat","Fat (g)","number"],["saturatedFat","Saturated fat (g)","number"],
  ["fiber","Fiber (g)","number"],["sodium","Sodium (mg)","number"]
];

function productForm(id,title,prefix,data={}) {
  return `<div class="card-title"><h2>${title}</h2><span>${prefix}</span></div><div class="form-grid three">
  ${nutrientFields.map(([key,label,type])=>`<div class="field ${key==='name'||key==='ingredients'? 'full':''}"><label>${label}</label><input data-field="${key}" type="${type}" min="${type==='number'?'0':''}" value="${data[key] ?? ''}" placeholder="${type==='number'?'0':'Enter value'}"></div>`).join("")}
  <div class="field full"><label>Ingredients</label><textarea data-field="ingredients" placeholder="Enter ingredients separated by commas">${data.ingredients||''}</textarea></div></div>`;
}

if($("#product-a-form"))$("#product-a-form").innerHTML = productForm("A","Product A","PRODUCT A");
if($("#product-b-form"))$("#product-b-form").innerHTML = productForm("B","Product B","PRODUCT B");

function getProduct(root) {
  const product={};
  $$("[data-field]",root).forEach(input=>{
    const key=input.dataset.field;
    product[key]=input.type==="number" ? Number(input.value||0) : input.value.trim();
  });
  return product;
}

function validateProduct(product,root) {
  let valid=true;
  $$("[data-field]",root).forEach(input=>{
    const key=input.dataset.field;
    input.classList.remove("field-error");
    if((key==="name"&&!input.value.trim())||(input.type==="number"&&(input.value===""||Number(input.value)<0))) {
      input.classList.add("field-error"); valid=false;
    }
  });
  if(!valid) showToast("Please add a product name and valid nutrition values.");
  return valid;
}

function showToast(message) {
  const toast=$("#toast"); toast.textContent=message;toast.classList.add("visible");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("visible"),4000);
}

function showPage(id,focusSelector=null) {
  if(id==="compare")id="ocr";
  $$(".page").forEach(page=>page.classList.remove("active"));
  const target=$("#"+id)||$("#home");target.classList.add("active");
  $("#nav").classList.remove("open");$("#menu").setAttribute("aria-expanded","false");
  if(focusSelector){
    const focusTarget=$(focusSelector);
    if(focusTarget)requestAnimationFrame(()=>{
      focusTarget.focus({preventScroll:true});
      focusTarget.scrollIntoView({behavior:"smooth",block:"center"});
    });
  }else window.scrollTo({top:0,behavior:"smooth"});
}

function setScanMode(mode) {
  const isSingle=mode==="single";
  $("#ocr").dataset.scanMode=isSingle?"single":"compare";
  $$(".scan-mode-option").forEach(button=>{
    const active=button.dataset.scanMode===(isSingle?"single":"compare");
    button.setAttribute("aria-pressed",String(active));
  });
  $("#ocr .ocr-product-heading span").textContent=isSingle?"Product":"Product 1";
  if(!$("#ocr-file-a").files.length){
    $("#ocr-name-a").textContent=isSingle?"Upload product photo":"Upload Product 1 photo";
  }
  $("#ocr-preview-a").alt=isSingle?"Product label preview":"Product 1 label preview";
  $("#ocr-text-a").placeholder=isSingle?"Extracted product label text appears here":"Extracted Product 1 text appears here";
  $('.extract-one[data-extract="a"]').innerHTML=isSingle?"Extract label text <span>⌗</span>":"Extract Product 1 <span>⌗</span>";
  $("#ocr-notice").textContent=isSingle
    ?"Upload a product photo, enter label text, or select a product from the dataset. A photo is not required for dataset products."
    :"Upload a photo or enter label text for each product, or select dataset products when photos are unavailable. Verify nutrition units and serving sizes against the package.";
}

$$("[data-scan-mode]").forEach(button=>button.addEventListener("click",()=>setScanMode(button.dataset.scanMode)));
$$("[data-page]").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.scanMode)setScanMode(button.dataset.scanMode);
  showPage(button.dataset.page,button.dataset.focus);
}));
$("#menu").addEventListener("click",()=>{$("#nav").classList.toggle("open");$("#menu").setAttribute("aria-expanded",String($("#nav").classList.contains("open")));});

const scoredNutrients = ["protein","fiber","sugar","saturatedFat","sodium","calories"];

function scoreProduct(product, availableNutrients=scoredNutrients) {
  const scoreParts = {
    protein: [value => Math.min(value*4,24),24],
    fiber: [value => Math.min(value*5,25),25],
    sugar: [value => Math.max(0,20-value*1.25),20],
    saturatedFat: [value => Math.max(0,18-value*4),18],
    sodium: [value => Math.max(0,18-value/25),18],
    calories: [value => Math.max(0,15-Math.max(0,value-160)/20),15]
  };
  let earned=0,maxAvailable=0;
  for(const key of availableNutrients){
    if(product[key]===null||product[key]==="")continue;
    const value=Number(product[key]);
    if(!Number.isFinite(value))continue;
    const [score,max]=scoreParts[key];
    earned+=score(value);
    maxAvailable+=max;
  }
  return maxAvailable ? Math.round(earned/maxAvailable*100) : null;
}

function addCategoryEstimates(product) {
  product.estimatedFields=[];
  if(product.datasetProduct)return;
  const profile=approximateNutritionProfiles.find(item=>item.pattern.test(product.name||""));
  if(!profile)return;
  for(const [key,value] of Object.entries(profile.values)){
    if(product[key]===null||product[key]===""){
      product[key]=value;
      product.estimatedFields.push(key);
    }
  }
  if(product.estimatedFields.length){
    product.estimateCategory=profile.category;
    product.estimatedServingSize=profile.servingSize;
  }
}

function rating(score){if(score>=90)return "Excellent";if(score>=75)return "Good";if(score>=50)return "Moderate";return "Needs attention";}

function fillDemo() {
  const sampleLabels=[
    {product:demo.a,slot:"a"},
    {product:demo.b,slot:"b"}
  ];
  sampleLabels.forEach(({product,slot})=>{
    $(`#product-name-${slot}`).value=product.name;
    $(`#ocr-text-${slot}`).value=[
      `Ingredients: ${product.ingredients}`,
      `Serving size: ${product.servingSize}`,
      `Nutrition Facts`,
      `Calories ${product.calories} kcal`,
      `Protein ${product.protein} g`,
      `Total carbohydrates ${product.carbohydrates} g`,
      `Total sugars ${product.sugar} g`,
      `Total fat ${product.fat} g`,
      `Saturated fat ${product.saturatedFat} g`,
      `Dietary fiber ${product.fiber} g`,
      `Sodium ${product.sodium} mg`
    ].join("\n");
    $(`#ocr-text-${slot}`).dataset.fullOcrText="";
    $(`#ocr-text-${slot}`).dataset.ocrConfidence="";
    $(`#ocr-status-${slot}`).textContent="Sample label loaded";
  });
  showPage("ocr");
  showToast("Sample labels loaded. Compare them to see the results.");
}
if($("#load-demo"))$("#load-demo").addEventListener("click",fillDemo);
if($("#demo-products"))$("#demo-products").addEventListener("click",fillDemo);

function nutrientIndicator(key,value) {
  const limits={calories:[180,250],protein:[5,10],carbohydrates:[30,45],sugar:[5,12],fat:[5,10],saturatedFat:[2,5],fiber:[3,6],sodium:[140,300]};
  if(!limits[key])return "—";
  const [low,high]=limits[key];
  if(["protein","fiber"].includes(key))return value>=high?"High":value>=low?"Moderate":"Low";
  return value<=low?"Low":value<=high?"Moderate":"High";
}

function explainIngredient(name) {
  const key=name.toLowerCase();
  if(key.includes("citric"))return["Adds a tart taste and can help preserve freshness.","Ingredient context","The ingredient name alone does not show the amount in a serving."];
  if(key.includes("lecithin"))return["Helps oil and water blend smoothly.","Why used","An emulsifier that improves texture."];
  if(key.includes("cinnamon"))return["A familiar spice that adds aroma and flavor.","Possible concern","Generally used in small amounts."];
  if(key.includes("fiber")||key.includes("inulin"))return["Adds fiber and may improve the feeling of fullness.","Why used","Used to support texture or increase fiber."];
  if(key.includes("sugar")||key.includes("glucose syrup"))return["Adds sweetness and can affect overall sugar intake.","Watch for","Often used to improve taste and shelf life."];
  if(key.includes("palm oil"))return["Provides fat and helps create texture.","Watch for","A saturated-fat source if used in large amounts."];
  if(key.includes("salt")||key.includes("sodium"))return["Adds flavor and supports preservation.","Watch for","Large amounts contribute to dietary sodium."];
  if(key.includes("oat")||key.includes("wholegrain"))return["Provides carbohydrates and often adds fiber.","Why used","Used as a filling whole-food ingredient."];
  return["Adds flavor, texture or stability to the product.","Simple explanation","Its role depends on the full recipe and amount used."];
}

function compareProducts(a,b,comparisonWarnings=[]) {
  const estimatedA=new Set(a.estimatedFields||[]);
  const estimatedB=new Set(b.estimatedFields||[]);
  const sameDataSource=(a.dataSource||"label")===(b.dataSource||"label");
  const sharedScoredNutrients=sameDataSource?scoredNutrients.filter(key=>
    a[key]!==null&&a[key]!==""&&b[key]!==null&&b[key]!==""&&
    !estimatedA.has(key)&&!estimatedB.has(key)&&
    Number.isFinite(Number(a[key]))&&Number.isFinite(Number(b[key]))
  ):[];
  const sa=scoreProduct(a,sharedScoredNutrients),sb=scoreProduct(b,sharedScoredNutrients);
  const winner=sa===null||sb===null||sa===sb?null:sa>sb?a:b;
  const compareKeys=[["calories","Calories","kcal"],["protein","Protein","g"],["carbohydrates","Carbohydrates","g"],["sugar","Sugar","g"],["fat","Total fat","g"],["saturatedFat","Saturated fat","g"],["fiber","Fiber","g"],["sodium","Sodium","mg"]];
  const rows=compareKeys.map(([key,label,unit])=>{
    const av=Number(a[key]),bv=Number(b[key]);
    const availableA=a[key]!==null&&a[key]!==""&&Number.isFinite(av);
    const availableB=b[key]!==null&&b[key]!==""&&Number.isFinite(bv);
    const available=availableA&&availableB;
    const comparable=available&&sameDataSource;
    let better=comparable?"similar":"unavailable";
    if(comparable&&av!==bv) {
      if(key==="protein"||key==="fiber") {
        better=av>bv?"A":"B";
      } else {
        better=av<bv?"A":"B";
      }
    }
    return {key,label,a:availableA?av:null,b:availableB?bv:null,unit,better,available,comparable,availableA,availableB,estimated:estimatedA.has(key)||estimatedB.has(key)};
  });
  const wins=rows.filter(row=>row.comparable&&!row.estimated&&row.better!=="similar");
  const sourceDescription=a.dataSource==="dataset"?"selected dataset":"entered label";
  const reasons=wins.map(row=>
    `${row.better==="A"?a.name:b.name} has the more favorable ${sourceDescription} ${row.label.toLowerCase()} value.`
  );
  renderResults([a,b],[sa,sb],rows,reasons,comparisonWarnings,winner);
  showPage("results");
}

function productConsiderations(product) {
  const considerations=[];
  const addRangeNote=(key,label,threshold,unit,direction,message,suggestion)=>{
    if((product.estimatedFields||[]).includes(key))return;
    if(product[key]===null||product[key]==="")return;
    const value=Number(product[key]);
    if(!Number.isFinite(value))return;
    if(direction==="above"&&value>threshold||direction==="below"&&value<threshold){
      considerations.push({
        label,
        detail:`${value} ${unit} per entered serving is outside this project's ${threshold} ${unit} watch reference. ${message}`,
        suggestion
      });
    }
  };
  if(product.dataSource!=="dataset"){
    addRangeNote("sugar","Sugar",12,"g","above","Higher sugar can add to total sugar intake when eaten often.","If reducing sugar is a priority, compare products using the same serving size and consider the lower-sugar option.");
    addRangeNote("saturatedFat","Saturated fat",5,"g","above","This is a product-comparison prompt, not a medical threshold.","If reducing saturated fat is a priority, compare the amounts per serving.");
    addRangeNote("sodium","Sodium",300,"mg","above","Sodium intake can add up across foods eaten during the day.","If reducing sodium is a priority, compare the amounts per serving.");
    addRangeNote("fiber","Fiber",3,"g","below","This serving contains less fiber than the project's comparison reference.","Consider other foods in your meal that provide fiber.");
  }

  const allergens=[
    ["milk",/\b(?:milk|whey|casein|lactose)\b/i],
    ["egg",/\beggs?\b/i],
    ["peanuts",/\bpeanuts?\b/i],
    ["tree nuts",/\b(?:almonds?|cashews?|walnuts?|pistachios?|hazelnuts?|pecans?|macadamias?)\b/i],
    ["soy",/\bsoy(?:beans?)?\b/i],
    ["wheat or gluten-containing grains",/\b(?:wheat|barley|rye|gluten)\b/i],
    ["sesame",/\bsesame\b/i],
    ["fish",/\bfish\b/i],
    ["shellfish",/\b(?:shrimp|prawns?|crab|lobster|shellfish)\b/i]
  ];
  const ingredientText=`${product.ingredients||""}\n${product.allergens||""}`;
  for(const [name,pattern] of allergens){
    if(pattern.test(ingredientText)){
      considerations.push({
        label:`Possible ${name} ingredient`,
        detail:product.dataSource==="dataset"
          ?"This term appears in the selected dataset record. Confirm the ingredient and allergen statement on the package."
          :"This term appears in the ingredient or allergen text. OCR or copied text may be incomplete; check the package's allergen statement.",
        suggestion:"If you have a diagnosed allergy, follow your clinician's advice and do not rely on this comparison to confirm a product is safe."
      });
    }
  }
  return considerations;
}

function productRiskStatus(product,considerations) {
  if(considerations.length)return {level:"high",label:"Watch items found"};
  if(product.dataSource==="dataset")return {level:"unknown",label:"Verify product label"};
  const requiredNutrition=["sugar","saturatedFat","sodium","fiber"];
  const hasCompleteRiskData=Boolean(product.ingredients)&&requiredNutrition.every(key=>
    product[key]!==null&&product[key]!==""&&Number.isFinite(Number(product[key]))&&!(product.estimatedFields||[]).includes(key)
  );
  return hasCompleteRiskData
    ?{level:"low",label:"No watch items found"}
    :{level:"unknown",label:"More label details needed"};
}

function renderLabelTextSection(products) {
  const cards=products.map((product,index)=>{
    const name=String(product.name||`Product ${index+1}`);
    const labelText=String(product.labelText||"").trim()||"No readable label text was captured.";
    const source=product.dataSource==="dataset"
      ?"Selected dataset record"
      :product.labelConfidence===null||product.labelConfidence===undefined
        ?"Entered label text"
        :`OCR confidence ${escapeHtml(product.labelConfidence)}%`;
    return `<article class="label-text-product"><header class="label-text-product-header"><h3>${escapeHtml(name)}</h3><span>${source}</span></header><pre>${escapeHtml(labelText)}</pre></article>`;
  }).join("");
  const includesDataset=products.some(product=>product.dataSource==="dataset");
  const heading=products.every(product=>product.dataSource==="dataset")
    ?"Selected dataset product details"
    :includesDataset?"Label text and selected dataset details":"Complete label text captured";
  const note=includesDataset
    ?"Dataset details are reference information and may differ from the package. Verify all product details against the label."
    :"This transcript includes text recognized from the label. OCR may miss or misread details; compare it with the original package before relying on it.";
  return `<section class="label-text-card"><h2>${heading}</h2><div class="label-text-products">${cards}</div><p class="results-caveat">${note}</p></section>`;
}

function normalizeProductName(value) {
  return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}

function populateDatasetProductOptions() {
  $$(".dataset-product-select").forEach(select=>{
    const slot=select.dataset.for;
    const placeholder=foodProductsLoadError?"Product dataset unavailable":"Choose a product...";
    const options=foodProducts.map(record=>{
      const category=[record.category,record.subCategory].filter(Boolean).join(" · ");
      return `<option value="${escapeHtml(record.id)}">${escapeHtml(record.productName)}${category?` — ${escapeHtml(category)}`:""}</option>`;
    }).join("");
    select.innerHTML=`<option value="">${placeholder}</option>${options}`;
    select.disabled=Boolean(foodProductsLoadError)||!foodProducts.length||Boolean($(`#ocr-file-${slot}`).files.length);
    $(`#dataset-status-${slot}`).textContent=foodProductsLoadError
      ?`Product dataset unavailable: ${foodProductsLoadError}`
      :select.disabled
        ?"Remove the image to choose a product from the dataset."
        :"No photo? Select a product to load its dataset details.";
  });
}

function formatDatasetProductText(record) {
  const nutrition=record.nutrition||{};
  const nutritionFields=[
    ["Calories","calories","kcal"],
    ["Protein","protein","g"],
    ["Total carbohydrates","carbohydrates","g"],
    ["Total sugars","sugar","g"],
    ["Total fat","totalFat","g"],
    ["Saturated fat","saturatedFat","g"],
    ["Trans fat","transFat","g"],
    ["Dietary fiber","fiber","g"],
    ["Sodium","sodium","mg"]
  ];
  const nutritionLines=nutritionFields
    .filter(([,key])=>nutrition[key]!==null&&nutrition[key]!==undefined&&nutrition[key]!=="")
    .map(([label,key,unit])=>`${label} ${nutrition[key]} ${unit}`);
  return [
    `Product: ${record.productName}`,
    record.brand?`Brand: ${record.brand}`:"",
    `Category: ${[record.category,record.subCategory].filter(Boolean).join(" · ")}`,
    `Ingredients: ${(record.ingredients||[]).join(", ")||"Not provided in dataset"}`,
    record.allergens&&record.allergens.length?`Contains: ${record.allergens.join(", ")}`:"",
    "Nutrition Facts (dataset values; serving basis not specified)",
    ...nutritionLines
  ].filter(Boolean).join("\n");
}

function getSelectedDatasetProduct(slot) {
  const id=$(`#dataset-product-${slot}`).value;
  return id?foodProducts.find(record=>String(record.id)===id)||null:null;
}

function applySelectedDatasetProduct(product,slot) {
  const record=getSelectedDatasetProduct(slot);
  if(!record||$(`#ocr-file-${slot}`).files.length)return product;
  const nutrition=record.nutrition||{};
  const value=key=>nutrition[key]===null||nutrition[key]===undefined||nutrition[key]===""
    ?null
    :Number(nutrition[key]);
  product.name=$(`#product-name-${slot}`).value.trim()||record.productName;
  product.brand=record.brand||"";
  product.servingSize="Not specified (dataset)";
  product.calories=value("calories");
  product.protein=value("protein");
  product.carbohydrates=value("carbohydrates");
  product.sugar=value("sugar");
  product.fat=value("totalFat");
  product.saturatedFat=value("saturatedFat");
  product.fiber=value("fiber");
  product.sodium=value("sodium");
  product.ingredients=(record.ingredients||[]).join(", ");
  product.allergens=(record.allergens||[]).join(", ");
  product.datasetProduct=record;
  product.dataSource="dataset";
  product.labelText=formatDatasetProductText(record);
  product.labelConfidence=null;
  product.estimatedFields=[];
  return product;
}

function attachDatasetProduct(product) {
  const normalizedName=normalizeProductName(product.name);
  const defaultName=/^(product [12]|scanned product)$/.test(normalizedName);
  let match=foodProducts.find(record=>normalizeProductName(record.productName)===normalizedName);
  if(!match&&defaultName){
    const labelText=normalizeProductName(product.labelText);
    match=[...foodProducts]
      .sort((left,right)=>right.productName.length-left.productName.length)
      .find(record=>labelText.includes(normalizeProductName(record.productName)));
    if(match)product.name=match.productName;
  }
  product.datasetProduct=match||null;
}

function renderDatasetDescription(product) {
  if(foodProductsLoadError){
    return `<p class="dataset-reference-message">Product description dataset unavailable: ${escapeHtml(foodProductsLoadError)}</p>`;
  }
  if(!product.datasetProduct){
    return '<p class="dataset-reference-message">No exact product-name match was found in the reference dataset. Ingredient explanations below use the extracted label text only.</p>';
  }
  const referenceNote=product.dataSource==="dataset"
    ?"Selected dataset information; verify it against the package. Nutrition serving basis is not specified."
    :"Reference information from the supplied dataset; it is not independently verified against this package. The extracted label remains the source for scanned details.";
  return `<div class="dataset-description"><p>${escapeHtml(product.datasetProduct.description)}</p><p class="results-caveat">${referenceNote}</p></div>`;
}

function renderProductExplanationSection(products) {
  const cards=products.map((product,index)=>{
    const name=String(product.name||`Product ${index+1}`);
    const ingredientHeading=product.dataSource==="dataset"?"Ingredients from dataset explained":"Ingredients from label explained";
    return `<article class="ingredient-product product-explanation"><h3>${escapeHtml(name)}</h3><h4>Product description</h4>${renderDatasetDescription(product)}<h4>${ingredientHeading}</h4><div class="ingredient-list">${ingredientCards(product)}</div></article>`;
  }).join("");
  const includesDataset=products.some(product=>product.dataSource==="dataset");
  const note=includesDataset
    ?"Ingredient explanations use the selected dataset record for dataset products and extracted label text for scanned products. Verify all details against the package."
    :"Ingredient explanations are based on the extracted label text. Dataset descriptions are reference context, not a replacement for the package label.";
  return `<section class="ingredient-card ingredient-comparison product-explanations-card"><h2>Product details and label explanations</h2><p class="results-caveat">${note}</p><div class="ingredient-products">${cards}</div></section>`;
}

function renderSingleProductResult(product,note="") {
  const name=String(product.name||"Scanned product").trim()||"Scanned product";
  const datasetSourced=product.dataSource==="dataset";
  const nutritionFields=[
    ["calories","Calories","kcal"],
    ["protein","Protein","g"],
    ["carbohydrates","Carbohydrates","g"],
    ["sugar","Sugar","g"],
    ["fat","Total fat","g"],
    ["saturatedFat","Saturated fat","g"],
    ["fiber","Fiber","g"],
    ["sodium","Sodium","mg"]
  ];
  const estimatedFields=new Set(product.estimatedFields||[]);
  const nutritionRows=nutritionFields.map(([key,label,unit])=>{
    const value=product[key];
    if(value===null||value===""||!Number.isFinite(Number(value))){
      return `<tr><td>${label}</td><td><span class="comparison-status unknown">${datasetSourced?"Not provided in dataset":"Not found on label"}</span></td></tr>`;
    }
    if(datasetSourced)return `<tr><td>${label}</td><td><span class="nutrition-value">${escapeHtml(value)} ${unit}</span></td></tr>`;
    const estimated=estimatedFields.has(key);
    const signal=trafficStatus(key,Number(value));
    return `<tr><td>${label}</td><td><span class="nutrition-value">${estimated?"~":""}${escapeHtml(value)} ${unit}</span><span class="nutrition-signal ${signal.level}${estimated?" estimated":""}"><i aria-hidden="true"></i>${estimated?"Estimate · ":""}${signal.label}</span></td></tr>`;
  }).join("");
  const ingredients=String(product.ingredients||"").split(/[,;\n•]+/).map(item=>item.trim()).filter(Boolean);
  const ingredientMarkup=ingredients.length
    ?`<div class="ingredient-list">${ingredients.map(item=>{
      const [description,context,detail]=explainIngredient(item);
      return `<article class="ingredient-item"><strong>${escapeHtml(item)}</strong><p>${escapeHtml(description)} <b>${escapeHtml(context)}:</b> ${escapeHtml(detail)}</p></article>`;
    }).join("")}</div>`
    :'<p class="missing-ingredients">No ingredients were detected in the provided label text. Check the complete package label.</p>';
  const allergenMarkup=product.allergens
    ?`<section class="ingredient-card"><h2>${datasetSourced?"Allergen entries in dataset":"Allergen statement from label"}</h2><p>${escapeHtml(product.allergens)}</p></section>`
    :"";
  const considerations=productConsiderations(product);
  const hasConfirmedNutrition=["calories","protein","carbohydrates","sugar","fat","saturatedFat","fiber","sodium"]
    .some(key=>product[key]!==null&&product[key]!==""&&!estimatedFields.has(key));
  const riskStatus=productRiskStatus(product,considerations);
  const riskMessage=considerations.length
    ?`<ul>${considerations.map(item=>`<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.detail)}<p><b>What to do:</b> ${escapeHtml(item.suggestion)}</p></li>`).join("")}</ul>`
    :datasetSourced
      ?'<p class="missing-ingredients">No allergen terms were identified in this dataset record. Confirm ingredients and allergen statements on the package.</p>'
    :`<p class="missing-ingredients">${estimatedFields.size
      ?"No label-confirmed watch items are available. Estimates do not verify ingredients or allergens; check the package."
      :!product.ingredients&&!hasConfirmedNutrition
        ?"No label-confirmed information was available to assess this product. This does not establish that it is safe or suitable for everyone."
        :"No watch items were identified from the information entered. This does not establish that the product is safe or suitable for everyone."}</p>`;
  const estimateNote=estimatedFields.size
    ?'<p class="results-caveat">Values marked ~ are approximate category references, not verified product-label values. They are not used to assess ingredients or allergens.</p>'
    :"";
  const nutritionNote=datasetSourced
    ?'<p class="results-caveat">The dataset does not specify the nutrition serving basis. These are reference values, not verified per-serving label values; traffic-light and per-serving watch ranges are not applied.</p>'
    :'<p class="results-caveat">Traffic signals are project references, not official health ratings. Verify all values and serving sizes against the package.</p>';
  const ingredientHeading=datasetSourced?"Ingredients in dataset":"Ingredients from label";
  const resultDescription=datasetSourced
    ?"Product information loaded from the supplied dataset. Verify it against the package."
    :"Nutrition and ingredient details extracted from the product label.";
  $("#results-content").innerHTML=`<div class="page-heading"><div><span class="section-kicker">${datasetSourced?"DATASET PRODUCT":"SINGLE PRODUCT SCAN"}</span><h1>${escapeHtml(name)}</h1></div><button class="btn btn-light" data-page="ocr">${datasetSourced?"Choose another product":"Scan another product"} <span>↗</span></button></div>
    <div class="results-hero ingredient-results-hero"><div><span class="section-kicker">SCAN RESULTS</span><h1>${escapeHtml(name)}</h1><p>${resultDescription}</p></div></div>
    <section class="table-card"><h2>${datasetSourced?"Dataset nutrition values":"Nutrition details per serving"}</h2><table class="comparison-table single-nutrition-table"><tbody><tr><td>${datasetSourced?"Serving basis":"Serving size"}</td><td>${escapeHtml(product.servingSize||"Not found on label")}</td></tr>${nutritionRows}</tbody></table>${estimateNote}${nutritionNote}</section>
    <section class="ingredient-card"><h2>Product description</h2>${renderDatasetDescription(product)}</section>
    <section class="ingredient-card"><h2>${ingredientHeading}</h2>${ingredientMarkup}</section>
    ${allergenMarkup}
    <section class="risk-card"><h2>Potential considerations and what you can do</h2><p class="results-caveat">${datasetSourced?"Allergen prompts use dataset entries. No per-serving nutrition ranges are applied because the dataset basis is unspecified.":"These prompts use label-confirmed information and project reference ranges."} This is not a diagnosis or a claim that an ingredient is harmful.</p><div class="risk-products single-risk-products"><section class="risk-product risk-${riskStatus.level}"><div class="risk-product-heading"><h3>${escapeHtml(name)}</h3><span class="risk-status">${riskStatus.label}</span></div>${riskMessage}</section></div></section>
    ${renderLabelTextSection([product])}
    <p class="ocr-notice" style="margin-top:16px">${escapeHtml(note||"OCR can misread label text. Verify the product name, serving size, nutrition values, units, and ingredients against the packaging.")}</p>`;
  showPage("results");
  $$("[data-page]","#results-content").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page,button.dataset.focus)));
}

function ingredientCards(p) {
  const items=(p.ingredients||"").split(/[,;\n•]+/).map(x=>x.trim()).filter(Boolean);
  if(!items.length)return '<p>No ingredients were entered.</p>';
  const otherItems=new Set((p.otherIngredients||"").split(/[,;\n•]+/).map(x=>x.trim().toLowerCase()).filter(Boolean));
  return items.map(name=>{
    const [description,context,detail]=explainIngredient(name);
    const shared=otherItems.has(name.toLowerCase());
    const marker=shared?'<span class="ingredient-match shared">In both</span>':`<span class="ingredient-match unique">Only ${escapeHtml(p.productLabel)}</span>`;
    return `<div class="ingredient-item"><strong>${escapeHtml(name)}</strong>${marker}<p>${escapeHtml(description)} <b>${escapeHtml(context)}:</b> ${escapeHtml(detail)}</p></div>`;
  }).join("");
}

function trafficStatus(key,value) {
  const positive=key==="protein"||key==="fiber";
  const limits={
    calories:[180,250], protein:[5,10], carbohydrates:[30,45],
    sugar:[5,12], fat:[5,10], saturatedFat:[2,5],
    fiber:[3,6], sodium:[140,300]
  };
  const [low,high]=limits[key]||[0,0];
  if(positive){
    if(value>=high)return {level:"green",label:"Good"};
    if(value>=low)return {level:"amber",label:"Moderate"};
    return {level:"red",label:"Low"};
  }
  if(value<=low)return {level:"green",label:"Low"};
  if(value<=high)return {level:"amber",label:"Moderate"};
  return {level:"red",label:"High"};
}

function renderResults(products,scores,rows,reasons,comparisonWarnings=[],winner=null) {
  const [a,b]=products,[sa,sb]=scores;
  const sameDataSource=(a.dataSource||"label")===(b.dataSource||"label");
  const bothDatasetSourced=sameDataSource&&a.dataSource==="dataset";
  const estimatedProducts=products.filter(product=>product.estimatedFields&&product.estimatedFields.length);
  const hasEstimates=estimatedProducts.length>0;
  const missingIngredients=products.filter(product=>!product.ingredients).map(product=>product.name);
  const confirmedNutrients=["calories","protein","carbohydrates","sugar","fat","saturatedFat","fiber","sodium"];
  const resultNotes=[];
  estimatedProducts.forEach(product=>{
    resultNotes.push(`${escapeHtml(product.name)}: Approximate ${escapeHtml(product.estimateCategory)} nutrition values use a generic ${escapeHtml(product.estimatedServingSize)} reference serving. These are not package values; estimated values were excluded from recommendation scoring. Ingredients and allergens were not estimated.`);
  });
  if(missingIngredients.length){
    resultNotes.push(`Ingredient data unavailable for ${escapeHtml(missingIngredients.join(", "))}; missing ingredients were not assumed.`);
  }
  resultNotes.push(...comparisonWarnings.map(escapeHtml));
  if(products.some(product=>product.dataSource==="dataset")){
    resultNotes.push("Dataset records are reference information and are not independently verified. Their nutrition serving basis is not specified.");
  }
  if(products.some(product=>product.dataSource!=="dataset")){
    resultNotes.push("OCR can misread label text. Verify product names, serving size, nutrition values, units, and ingredients against the packaging.");
  }
  a.otherIngredients=b.ingredients||"";
  a.productLabel=a.name||"Product 1";
  b.otherIngredients=a.ingredients||"";
  b.productLabel=b.name||"Product 2";
  const recommendation=!sameDataSource
    ?"The products use different data sources, so a better-choice prediction is not reliable. Use two label sources or two dataset records with a comparable nutrition basis."
    :winner
      ?`Based on ${bothDatasetSourced?"the selected dataset values":"shared package-label nutrition values"}, ${escapeHtml(winner.name)} has the stronger result in this project's comparison.${bothDatasetSourced?" The dataset serving basis is unspecified, so verify the package before relying on this result.":hasEstimates?" Category estimates shown below were not used to select a better fit.":""} This is general information, not a personalized dietary recommendation.`
    :hasEstimates
      ?"Approximate category values are shown for context, but there is not enough shared label-confirmed nutrition data to make a reliable recommendation."
      :bothDatasetSourced
        ?"There is no clear winner from the selected dataset values."
        :"There is no clear winner from the nutrition information available for both labels. Add comparable nutrition values to get a more useful comparison.";
  const scoreRows=sa!==null&&sb!==null?`
    <div class="score-row"><span>${escapeHtml(a.name)}</span><div class="score-bar"><i style="width:${sa}%"></i></div><b>${sa}</b></div>
    <div class="score-row"><span>${escapeHtml(b.name)}</span><div class="score-bar"><i style="width:${sb}%"></i></div><b>${sb}</b></div>`:
    `<p class="missing-ingredients">${sameDataSource?"Scores are unavailable because the products do not share enough nutrition values.":"Scores are unavailable because the products use different data sources."}</p>`;
  const betterChoice=winner
    ?`Approximate result: <strong>${escapeHtml(winner.name)}</strong> has the higher project score from ${bothDatasetSourced?"the selected dataset values":"shared, label-confirmed nutrition values"}.${bothDatasetSourced?" The nutrition basis is unspecified.":""}`
    :!sameDataSource
      ?"No prediction: the products use different data sources."
    :hasEstimates
      ?"No reliable choice yet. Category estimates are shown for context and are not used to select a winner."
      :sa!==null&&sb!==null
        ?`No clear choice: the ${bothDatasetSourced?"dataset":"confirmed nutrition"} comparison scores are tied.`
        :"No prediction yet: add comparable, confirmed nutrition values for both products.";
  const betterChoiceClass=winner?"predicted-winner":"predicted-unknown";
  const comparisonRows=rows.map(row=>{
    const aClass=row.comparable&&!row.estimated
      ?row.better==="A"?"better":row.better==="B"?"worse":""
      :"";
    const bClass=row.comparable&&!row.estimated
      ?row.better==="B"?"better":row.better==="A"?"worse":""
      :"";
    const valueCell=(value,product,available)=>{
      if(!available)return "Not entered";
      if(product.dataSource==="dataset")return `<span class="nutrition-value">${value} ${row.unit}</span>`;
      const signal=trafficStatus(row.key,value);
      const estimated=(product.estimatedFields||[]).includes(row.key);
      return `<span class="nutrition-value">${estimated?"~":""}${value} ${row.unit}</span><span class="nutrition-signal ${signal.level}${estimated?" estimated":""}"><i aria-hidden="true"></i>${estimated?"Estimate · ":""}${signal.label}</span>`;
    };
    const betterCell=()=>{
      if(!row.available)return '<span class="comparison-status unknown">Need both values</span>';
      if(!row.comparable)return '<span class="comparison-status unknown">Different sources</span>';
      if(row.estimated)return '<span class="comparison-status estimated">Estimate only</span>';
      if(row.better==="similar")return '<span class="comparison-status neutral">Similar</span>';
      const betterName=row.better==="A"?a.name:b.name;
      const otherName=row.better==="A"?b.name:a.name;
      return `<div class="better-pair"><span class="better-indicator good"><i aria-hidden="true"></i>${escapeHtml(betterName)}</span><span class="better-indicator bad"><i aria-hidden="true"></i>${escapeHtml(otherName)}</span></div>`;
    };
    return `<tr><td>${escapeHtml(row.label)}</td><td class="${aClass}">${valueCell(row.a,a,row.availableA)}</td><td class="${bClass}">${valueCell(row.b,b,row.availableB)}</td><td>${betterCell()}</td></tr>`;
  }).join("");
  const servingBasisLabel=products.some(product=>product.dataSource==="dataset")?"Serving size / data basis":"Serving size";
  const servingBasis=(product)=>product.dataSource==="dataset"?"Dataset; basis not specified":product.servingSize||"Not entered";
  const servingSizeRow=`<tr><td>${servingBasisLabel}</td><td>${escapeHtml(servingBasis(a))}</td><td>${escapeHtml(servingBasis(b))}</td><td><span class="comparison-status neutral">Context</span></td></tr>`;
  const estimateBasisRow=hasEstimates
    ?`<tr><td>Estimate basis</td><td>${a.estimatedFields&&a.estimatedFields.length?`Approx. ${escapeHtml(a.estimateCategory)} / ${escapeHtml(a.estimatedServingSize)}`:"—"}</td><td>${b.estimatedFields&&b.estimatedFields.length?`Approx. ${escapeHtml(b.estimateCategory)} / ${escapeHtml(b.estimatedServingSize)}`:"—"}</td><td><span class="comparison-status neutral">Context</span></td></tr>`
    :"";
  const riskCards=products.map((product,index)=>{
    const considerations=productConsiderations(product);
    const hasConfirmedNutrition=confirmedNutrients.some(key=>product[key]!==null&&product[key]!==""&&!(product.estimatedFields||[]).includes(key));
    const riskStatus=productRiskStatus(product,considerations);
    return `<section class="risk-product risk-${riskStatus.level}"><div class="risk-product-heading"><h3>${escapeHtml(product.name||`Product ${index+1}`)}</h3><span class="risk-status">${riskStatus.label}</span></div>${considerations.length
      ?`<ul>${considerations.map(item=>`<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.detail)}<p><b>What to do:</b> ${escapeHtml(item.suggestion)}</p></li>`).join("")}</ul>`
      :`<p class="missing-ingredients">${product.dataSource==="dataset"?"No allergen terms were identified in the selected dataset record. Confirm the full ingredients and allergen label on the package.":product.estimatedFields&&product.estimatedFields.length?"No label-confirmed watch items are available. Estimates do not verify ingredients or allergens; check the package.":!product.ingredients&&!hasConfirmedNutrition?"No label-confirmed information was available to assess this product. This does not establish that the product is safe or suitable for everyone.":"No watch items were identified from the information entered. This does not establish that the product is safe or suitable for everyone."}</p>`}</section>`;
  }).join("");
  const comparisonReasons=!sameDataSource
    ?"<li>Products use different data sources; numeric differences are shown for context, not ranked.</li>"
    :reasons.length
    ?reasons.map(reason=>`<li>${escapeHtml(reason)}</li>`).join("")
    :hasEstimates
      ?"<li>Estimated values are shown for context only; compare package-confirmed values before choosing.</li>"
      :rows.some(row=>row.available)
        ?`<li>No meaningful differences were found in the ${bothDatasetSourced?"selected dataset":"entered"} values.</li>`
        :`<li>No shared ${bothDatasetSourced?"dataset":"label-confirmed"} nutrition values were available for comparison.</li>`;
  const comparisonHeading=!sameDataSource
    ?"Nutrition values from different sources"
    :bothDatasetSourced?"Dataset nutrition comparison":"Nutrition comparison and traffic signals";
  const trafficLegend=products.some(product=>product.dataSource!=="dataset")
    ?`<div class="traffic-legend" aria-label="Traffic signal guide"><span><i class="green"></i>More favorable</span><span><i class="amber"></i>Moderate</span><span><i class="red"></i>Less favorable</span>${hasEstimates?'<span>~ = approximate category estimate</span>':""}</div>`
    :"";
  const comparisonCaveat=!sameDataSource
    ?"Values use different data sources and are shown for context only; no score or better-choice ranking is made. Dataset serving basis is unspecified."
    :bothDatasetSourced
      ?"Values come from the supplied dataset. Its nutrition serving basis is unspecified, so the ranking is indicative only and must be checked against product packaging. Traffic-light thresholds are not applied."
      :`${hasEstimates?"Approximate values are generic category references, not verified product-label values. ":"Values are from entered or scanned product labels. "}Traffic signals use project ranges, not official health ratings. Verify units and serving sizes on both packages.`;
  const scoreCaveat=bothDatasetSourced
    ?"The score compares selected dataset values only. Nutrition basis is unspecified, so treat it as indicative and verify the packages."
    :!sameDataSource
      ?"No score is calculated across different data sources. Use comparable labels or dataset records with a known common basis."
      :"Calculated only from confirmed nutrition values entered for both products. Estimated values are excluded. Higher is more favorable under this project's simple reference ranges.";
  $("#results-content").innerHTML=`<div class="page-heading"><div><span class="section-kicker">PRODUCT COMPARISON</span><h1>Health-Based Product Comparison</h1></div><button class="btn btn-light" data-page="ocr">Change products <span>↗</span></button></div>
  <div class="results-hero ingredient-results-hero"><div><span class="section-kicker">PRODUCTS COMPARED</span><h1>${escapeHtml(a.name||"Product 1")} <span>vs</span> ${escapeHtml(b.name||"Product 2")}</h1><p>${!sameDataSource?"Different data sources cannot support a reliable better-choice prediction.":bothDatasetSourced?"Compare values selected from the dataset; the nutrition basis is not specified.":"See possible watch items and how the entered nutrition values compare."}</p></div></div>
  <div class="summary-grid">
    <section class="summary-card recommendation-card"><h2>Which looks like the better fit?</h2><p>${recommendation}</p><ul>${comparisonReasons}</ul><p class="results-caveat">${bothDatasetSourced?"Dataset values are a comparison aid, not a verified label or official health rating.":"The project score is a simple comparison aid, not an official health rating. Nutrition should be compared using the same serving size."}</p></section>
    <section class="score-card"><h2>Nutrition comparison score</h2>${scoreRows}<div class="better-choice ${betterChoiceClass}"><strong>Approximate better choice</strong><p>${betterChoice}</p></div><p class="results-caveat">${scoreCaveat}</p></section>
  </div>
  <section class="table-card"><h2>${comparisonHeading}</h2>${trafficLegend}<div class="comparison-table-wrap"><table class="comparison-table"><thead><tr><th>Nutrition value</th><th>${escapeHtml(a.name||"Product 1")}</th><th>${escapeHtml(b.name||"Product 2")}</th><th>Better</th></tr></thead><tbody>${servingSizeRow}${estimateBasisRow}${comparisonRows}</tbody></table></div><p class="results-caveat">${comparisonCaveat}</p></section>
  ${renderProductExplanationSection(products)}
  <section class="risk-card"><h2>Potential considerations and what you can do</h2><p class="results-caveat">${products.some(product=>product.dataSource==="dataset")?"Allergen prompts may use dataset entries; confirm the package. Nutrition thresholds are not applied to dataset values with an unspecified basis.":"These prompts use label-confirmed information and project reference ranges. Approximate values do not verify ingredients or allergens."} This is not a diagnosis or a claim that an ingredient is harmful.</p><div class="risk-products">${riskCards}</div></section>
  ${renderLabelTextSection(products)}
  <section class="insight-card"><strong>Practical next step</strong><p>${winner
    ?bothDatasetSourced?`The dataset values favor ${escapeHtml(winner.name)} in this comparison. Verify nutrition basis, ingredients, and allergens on the package before choosing.`:`If the products suit your needs and have comparable serving sizes, ${escapeHtml(winner.name)} is the more favorable option by the values entered. Check the full ingredient and allergen label before choosing.`
    :!sameDataSource
      ?"Use products from the same data source and confirm matching serving sizes before comparing. If either product may contain an allergen relevant to you, follow the package warning and your clinician's advice."
      :"Compare complete labels using the same serving size. If either product may contain an allergen relevant to you, follow the package warning and your clinician's advice."}</p></section>
  <p class="ocr-notice" style="margin-top:16px">${resultNotes.join(" ")}</p>`;
  $$("[data-page]","#results-content").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
}


// Two-label OCR workspace

async function prepareLabelImage(file, centerCrop=false) {
  const image=await createImageBitmap(file);
  const sourceX=centerCrop?Math.round(image.width*.1):0;
  const sourceY=centerCrop?Math.round(image.height*.08):0;
  const sourceWidth=centerCrop?Math.round(image.width*.8):image.width;
  const sourceHeight=centerCrop?Math.round(image.height*.84):image.height;
  const longestSide=Math.max(sourceWidth,sourceHeight);
  const scale=Math.min(3,2800/longestSide);
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(sourceWidth*scale));
  canvas.height=Math.max(1,Math.round(sourceHeight*scale));
  const context=canvas.getContext("2d",{willReadFrequently:true});
  context.drawImage(image,sourceX,sourceY,sourceWidth,sourceHeight,0,0,canvas.width,canvas.height);
  image.close();

  const pixels=context.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<pixels.data.length;i+=4){
    const gray=pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114;
    const contrast=Math.max(0,Math.min(255,(gray-128)*1.45+128));
    pixels.data[i]=contrast;
    pixels.data[i+1]=contrast;
    pixels.data[i+2]=contrast;
  }
  context.putImageData(pixels,0,0);
  return canvas;
}

function scoreOcrText(text,confidence) {
  const labelTerms=(text.match(/ingredients?|nutrition|calories|energy|protein|carbohydrate|sugar|fat|sodium|salt|serving size/gi)||[]).length;
  const hasIngredientList=/\bingredients?\b/i.test(text);
  return confidence+Math.min(labelTerms,8)*8+(hasIngredientList?45:0);
}

function mergeOcrCandidateText(candidates) {
  const ranked=[...candidates].sort((a,b)=>
    scoreOcrText(b.data?.text||"",b.data?.confidence||0)-scoreOcrText(a.data?.text||"",a.data?.confidence||0)
  );
  const lines=[];
  const seen=new Set();
  for(const candidate of ranked){
    for(const line of (candidate.data?.text||"").split(/\r?\n/)){
      const clean=line.trim();
      const key=clean.toLowerCase().replace(/[^\w]+/g," ").trim();
      if(!key||seen.has(key))continue;
      seen.add(key);
      lines.push(clean);
    }
  }
  return lines.join("\n");
}

async function recognizeLabel(slot) {
  const file=$(`#ocr-file-${slot}`).files[0];
  if(!file)throw new Error(`Upload a photo for Product ${slot==="a"?"1":"2"} first.`);
  if(!window.Tesseract)throw new Error("Text scanning is unavailable. Check your internet connection and try again.");
  const status=$(`#ocr-status-${slot}`);
  status.textContent="Preparing label...";
  const options={logger:progress=>{
    if(progress.status==="recognizing text"){
      status.textContent=`Reading label ${Math.round((progress.progress||0)*100)}%`;
    }
  }};
  status.textContent="Reading label...";
  const candidates=[];
  const fullImage=await prepareLabelImage(file);
  candidates.push(await Tesseract.recognize(fullImage,"eng",options));

  const initialText=candidates[0].data?.text?.trim()||"";
  const nutritionTerms=(initialText.match(/\b(?:calories|energy|protein|carbohydrates?|sugars?|fat|fiber|fibre|sodium)\b/gi)||[]).length;
  const hasNutritionHeading=/\bnutrition(?: facts| information|al information)\b/i.test(initialText);
  if(!extractIngredients(initialText)||(candidates[0].data?.confidence||0)<82||!hasNutritionHeading||nutritionTerms<4){
    status.textContent="Focusing on label text...";
    const focusedImage=await prepareLabelImage(file,true);
    candidates.push(await Tesseract.recognize(focusedImage,"eng",options));
  }
  let result=candidates[0];
  for(const candidate of candidates.slice(1)){
    const candidateText=candidate.data?.text?.trim()||"";
    const currentText=result.data?.text?.trim()||"";
    if(scoreOcrText(candidateText,candidate.data?.confidence||0)>scoreOcrText(currentText,result.data?.confidence||0)){
      result=candidate;
    }
  }
  const text=result.data?.text?.trim();
  if(!text)throw new Error(`No text found on Product ${slot==="a"?"1":"2"}.`);
  const completeText=mergeOcrCandidateText(candidates);
  const textarea=$(`#ocr-text-${slot}`);
  textarea.value=text;
  textarea.dataset.fullOcrText=completeText;
  const confidence=Math.round(result.data.confidence||0);
  textarea.dataset.ocrConfidence=String(confidence);
  status.textContent=confidence<65?"Low confidence — verify":`Scanned · ${confidence}% confidence`;
  return {text,confidence,fullText:completeText};
}

["a","b"].forEach(slot=>{
  const fileInput=$(`#ocr-file-${slot}`);
  const preview=$(`#ocr-preview-${slot}`);
  const textarea=$(`#ocr-text-${slot}`);
  const upload=preview.parentElement;
  const datasetSelect=$(`#dataset-product-${slot}`);
  const productNameInput=$(`#product-name-${slot}`);
  const extractButton=$(`.extract-one[data-extract="${slot}"]`);

  textarea.addEventListener("input",()=>{
    textarea.dataset.fullOcrText="";
    textarea.dataset.ocrConfidence="";
    if(datasetSelect.value){
      datasetSelect.value="";
      $(`#dataset-status-${slot}`).textContent="Label text edited; dataset selection cleared.";
    }
  });
  productNameInput.addEventListener("input",()=>{
    if(datasetSelect.value){
      $(`#dataset-status-${slot}`).textContent="Display name changed; selected dataset details will be used.";
    }
  });
  datasetSelect.addEventListener("change",()=>{
    const record=getSelectedDatasetProduct(slot);
    if(!record){
      textarea.readOnly=false;
      textarea.value="";
      textarea.dataset.fullOcrText="";
      textarea.dataset.ocrConfidence="";
      extractButton.disabled=false;
      $(`#ocr-status-${slot}`).textContent="Waiting for product details";
      $(`#dataset-status-${slot}`).textContent="Dataset selection cleared. Enter label text or choose a product.";
      return;
    }
    if(fileInput.files.length){
      datasetSelect.value="";
      showToast("Remove the image before selecting a product from the dataset.");
      return;
    }
    productNameInput.value=record.productName;
    textarea.value=formatDatasetProductText(record);
    textarea.readOnly=true;
    extractButton.disabled=true;
    textarea.dataset.fullOcrText="";
    textarea.dataset.ocrConfidence="";
    $(`#ocr-status-${slot}`).textContent="Dataset product selected";
    $(`#dataset-status-${slot}`).textContent="Dataset details loaded. No photo is needed; nutrition serving basis is not specified.";
    $("#ocr-notice").textContent="Dataset product selected. Review the supplied ingredients and nutrition values, then continue without a photo.";
  });
  $(`.ocr-choose[data-for="${slot}"]`).addEventListener("click",()=>fileInput.click());
  $(`.change-image[data-for="${slot}"]`).addEventListener("click",()=>{
    fileInput.click();
  });
  $(`.remove-image[data-for="${slot}"]`).addEventListener("click",()=>{
    fileInput.value="";
    preview.removeAttribute("src");
    upload.classList.remove("has-preview");
    textarea.readOnly=false;
    datasetSelect.value="";
    extractButton.disabled=false;
    datasetSelect.disabled=Boolean(foodProductsLoadError)||!foodProducts.length;
    $(`#dataset-status-${slot}`).textContent=foodProductsLoadError
      ?`Product dataset unavailable: ${foodProductsLoadError}`
      :"Photo removed. Select a dataset product or enter label details.";
    textarea.dataset.fullOcrText="";
    textarea.dataset.ocrConfidence="";
    $(`#ocr-name-${slot}`).textContent=`Upload Product ${slot==="a"?"1":"2"} photo`;
    $(`#ocr-status-${slot}`).textContent="Photo removed";
  });
  $(`#ocr-dropzone-${slot}`).addEventListener("click",(event)=>{
    if(!event.target.closest("button"))fileInput.click();
  });

  fileInput.addEventListener("change",()=>{
    const file=fileInput.files[0];
    if(!file)return;
    if(!["image/jpeg","image/png"].includes(file.type)){
      showToast("Please upload a JPG, JPEG or PNG image.");
      fileInput.value="";
      return;
    }
    if(file.size>5*1024*1024){
      showToast("Image must be 5 MB or smaller.");
      fileInput.value="";
      return;
    }
    const replacingDatasetProduct=Boolean(datasetSelect.value);
    datasetSelect.value="";
    datasetSelect.disabled=true;
    textarea.readOnly=false;
    extractButton.disabled=false;
    if(replacingDatasetProduct)productNameInput.value=slot==="a"?"Product 1":"Product 2";
    $(`#dataset-status-${slot}`).textContent="Image selected. Remove it to use a product from the dataset.";
    preview.src=URL.createObjectURL(file);
    preview.onload=()=>URL.revokeObjectURL(preview.src);
    upload.classList.add("has-preview");
    textarea.value="";
    textarea.dataset.fullOcrText="";
    textarea.dataset.ocrConfidence="";
    $(`#ocr-name-${slot}`).textContent=file.name;
    $(`#ocr-status-${slot}`).textContent="Photo ready";
  });

  extractButton.addEventListener("click",async()=>{
    if(!fileInput.files.length){
      showToast(`Choose the Product ${slot==="a"?"1":"2"} photo first.`);
      return;
    }
    try{
      const result=await recognizeLabel(slot);
      $("#ocr-notice").textContent=result.confidence<65
        ?"OCR confidence is low. Check and correct the extracted text before comparing."
        :"Text extracted. Verify product names, serving size, nutrition values, units, and ingredients against the package.";
    }catch(error){
      $(`#ocr-status-${slot}`).textContent="Scan failed";
      showToast(error.message||"Could not read this product label.");
      $("#ocr-notice").textContent="Try a clearer, closer photo with the label text in focus.";
    }
  });
});

function extractIngredients(text) {
  const lines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const isIngredientHeading=line=>
    /^(?:[•*]\s*)?(?:all\s+)?ingredients?\s*(?::|[-–—])\s*/i.test(line)
    ||/^(?:[•*]\s*)?(?:all\s+)?ingredients?\s*$/i.test(line)
    ||/^(?:[•*]\s*)?INGREDIENTS\s+\S/.test(line);
  const start=lines.findIndex(isIngredientHeading);
  if(start<0)return "";
  const endMarker=/\b(?:nutrition(?: facts| information)?|serving\s+size|allergens?|contains\b|may contain\b|manufactured\b|distributed\b|best before\b|net (?:weight|quantity)\b)\b/i;
  const nutrientValue=/\b(?:energy|calories|protein|carbohydrates?|total fat|saturated fat|trans fat|sugars?|dietary fibre|dietary fiber|sodium)\s*:?\s*[0-9]+(?:\.[0-9]+)?\s*(?:kcal|calories|g|mg)?\b/i;
  const trimAtLabelEnd=line=>{
    const markers=[endMarker.exec(line),nutrientValue.exec(line)].filter(Boolean);
    const end=markers.length?Math.min(...markers.map(marker=>marker.index)):line.length;
    return line.slice(0,end).trim();
  };
  const first=lines[start].replace(/^(?:[•*]\s*)?(?:all\s+)?ingredients?\s*(?:(?::|[-–—])\s*)?/i,"").trim();
  const firstIngredientLine=trimAtLabelEnd(first);
  const collected=firstIngredientLine?[firstIngredientLine]:[];
  for(const line of lines.slice(start+1)){
    if(endMarker.test(line)||nutrientValue.test(line)){
      const ingredientLine=trimAtLabelEnd(line);
      if(ingredientLine)collected.push(ingredientLine);
      break;
    }
    collected.push(line);
  }
  return collected.join(", ").replace(/\s+/g," ").replace(/^[,;.\s]+|[,;.\s]+$/g,"");
}

function extractAllergenStatement(text) {
  return text.split(/\r?\n/)
    .map(line=>line.trim())
    .filter(line=>/^(?:allergens?\s*:|(?:may contain|contains)\s*:?)\s*/i.test(line))
    .join("\n");
}

function parseOcrProduct(text, fallbackName) {
  const nutritionStart=text.search(/\b(?:nutrition facts|nutrition information|nutritional information)\b/i);
  const nutritionText=nutritionStart<0?text:text.slice(nutritionStart);
  const clean=nutritionText.replace(/[|]/g," ").replace(/\s+/g," ");
  const parse=(labels,kind)=>{
    for(const label of labels){
      const match=clean.match(new RegExp(`(?<![a-z])(?:${label})\\s*[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)(?:\\s*(kcal|calories|kj|g|mg|%))?`,"i"));
      if(!match)continue;
      const trailingText=clean.slice(match.index+match[0].length);
      if(!match[2]&&/^\s*[a-z%]/i.test(trailingText))continue;
      const value=Number(match[1]);
      const unit=(match[2]||"").toLowerCase();
      if(kind==="calories"){
        if(label==="energy"&&!unit)continue;
        if(unit==="kj")return Math.round(value/4.184*10)/10;
        if(!unit||unit==="kcal"||unit==="calories")return value;
      }else if(kind==="sodium"){
        if(unit==="g")return value*1000;
        if(!unit||unit==="mg")return value;
      }else if(unit==="g"||!unit){
        return value;
      }else if(unit==="mg"){
        return value/1000;
      }
    }
    return null;
  };
  const servingMatch=text.match(/(?:serving size|net quantity|net weight)\s*[:=-]?\s*([^\r\n,;]+)/i);
  const servingSize=servingMatch
    ?servingMatch[1].replace(/\b(?:nutrition facts|nutrition information|nutritional information|calories|protein|carbohydrates?|sugars?|total fat|saturated fat|dietary fiber|dietary fibre|sodium)\b[\s\S]*$/i,"").trim()
    :null;
  return {
    name:fallbackName,
    brand:"",
    servingSize:servingSize||null,
    calories:parse(["calories(?!\\s+from\\s+fat)","energy"],"calories"),
    protein:parse(["protein"],"grams"),
    carbohydrates:parse(["total\\s+carbohydrates?","carbohydrates?","total\\s+carbs?","carbs?"],"grams"),
    sugar:parse(["(?<!added )(?<!added)(?:total\\s+)?sugars?"],"grams"),
    fat:parse(["total\\s+fat","(?<!saturated )(?<!trans )fat"],"grams"),
    saturatedFat:parse(["saturated\\s+fat","sat\\.?\\s*fat"],"grams"),
    fiber:parse(["dietary\\s+fibre","dietary\\s+fiber","fibre","fiber"],"grams"),
    sodium:parse(["sodium"],"sodium"),
    ingredients:extractIngredients(text),
    allergens:extractAllergenStatement(text)
  };
}

$("#compare-ocr-products").addEventListener("click",async()=>{
  const button=$("#compare-ocr-products");
  if(button.disabled)return;
  const originalLabel=button.innerHTML;
  button.disabled=true;
  button.textContent="Checking products...";
  try{
    await foodProductsReady;
    const scanWarnings=[];
    const scanFailed={a:false,b:false};
    const sources=[
      {slot:"a",label:"Product 1"},
      {slot:"b",label:"Product 2"}
    ];
    for(const source of sources){
      const textarea=$(`#ocr-text-${source.slot}`);
      const file=$(`#ocr-file-${source.slot}`).files[0];
      let text=textarea.value.trim();
      const selectedDataset=getSelectedDatasetProduct(source.slot);
      if(!text&&selectedDataset){
        text=formatDatasetProductText(selectedDataset);
        textarea.value=text;
      }
      if(!text&&file){
        try{text=(await recognizeLabel(source.slot)).text;}
        catch(error){
          const message=error.message||"Text scanning failed.";
          scanFailed[source.slot]=true;
          scanWarnings.push(`${source.label} scan: ${message}`);
        }
      }
      if(!text&&!file){
        scanWarnings.push(`${source.label} has no photo or label text.`);
        $(`#ocr-status-${source.slot}`).textContent="No product data";
      }
      textarea.value=text;
    }

    const textA=$("#ocr-text-a").value.trim();
    const textB=$("#ocr-text-b").value.trim();
    const a=parseOcrProduct(textA,$("#product-name-a").value.trim()||"Product 1");
    const b=parseOcrProduct(textB,$("#product-name-b").value.trim()||"Product 2");
    a.labelText=$("#ocr-text-a").dataset.fullOcrText||textA;
    b.labelText=$("#ocr-text-b").dataset.fullOcrText||textB;
    a.labelConfidence=$("#ocr-text-a").dataset.ocrConfidence?Number($("#ocr-text-a").dataset.ocrConfidence):null;
    b.labelConfidence=$("#ocr-text-b").dataset.ocrConfidence?Number($("#ocr-text-b").dataset.ocrConfidence):null;
    attachDatasetProduct(a);
    attachDatasetProduct(b);
    applySelectedDatasetProduct(a,"a");
    applySelectedDatasetProduct(b,"b");
    addCategoryEstimates(a);
    addCategoryEstimates(b);
    [["a",a,textA],["b",b,textB]].forEach(([slot,product,text])=>{
      $("#ocr-status-"+slot).textContent=scanFailed[slot]
        ?"Scan unavailable — compared anyway"
        :product.dataSource==="dataset"
          ?"Dataset product ready"
        :product.estimatedFields.length
          ?`Approx. ${product.estimateCategory} values added`
          :!$("#ocr-file-"+slot).files.length&&!text
            ?"No product data"
            :product.ingredients?"Ready to compare":"Compared without ingredients";
    });
    compareProducts(a,b,scanWarnings);
  }catch(error){
    const message=error.message||"Could not compare these product labels.";
    $("#ocr-notice").textContent=message;
    showToast(message);
  }finally{
    button.disabled=false;
    button.innerHTML=originalLabel;
  }
});

$("#analyze-single-product").addEventListener("click",async()=>{
  const button=$("#analyze-single-product");
  if(button.disabled)return;
  const originalLabel=button.innerHTML;
  button.disabled=true;
  button.textContent="Analyzing product...";
  try{
    await foodProductsReady;
    const textarea=$("#ocr-text-a");
    const file=$("#ocr-file-a").files[0];
    let text=textarea.value.trim();
    let note="Entered label text was parsed. Verify the product name, serving size, nutrition values, units, and ingredients against the packaging.";
    const selectedDataset=getSelectedDatasetProduct("a");
    if(!text&&selectedDataset){
      text=formatDatasetProductText(selectedDataset);
      textarea.value=text;
    }
    if(!text&&file){
      const scan=await recognizeLabel("a");
      text=scan.text.trim();
      note=scan.confidence<65
        ?"OCR confidence was low. Check and correct the product name, serving size, nutrition values, units, and ingredients against the package."
        :"Label text extracted. Verify the product name, serving size, nutrition values, units, and ingredients against the package.";
      if(!text)throw new Error("No readable label text was extracted. Try a clearer photo or enter the label text manually.");
    }
    if(!text)throw new Error("Choose a product photo or enter its label text before analyzing.");
    textarea.value=text;
    const name=$("#product-name-a").value.trim()||"Scanned product";
    const product=parseOcrProduct(text,name);
    product.labelText=textarea.dataset.fullOcrText||text;
    product.labelConfidence=textarea.dataset.ocrConfidence?Number(textarea.dataset.ocrConfidence):null;
    attachDatasetProduct(product);
    applySelectedDatasetProduct(product,"a");
    addCategoryEstimates(product);
    if(product.dataSource==="dataset"){
      note="Product details loaded from the supplied dataset. Nutrition serving basis is not specified; verify all details against the package.";
    }
    const hasDetails=Boolean(product.ingredients)||["calories","protein","carbohydrates","sugar","fat","saturatedFat","fiber","sodium"]
      .some(key=>product[key]!==null&&product[key]!=="");
    if(!hasDetails)note=`No nutrition values or ingredients were recognized. ${note}`;
    $("#ocr-status-a").textContent=product.estimatedFields.length
      ?`Approx. ${product.estimateCategory} values added`
      :product.dataSource==="dataset"?"Dataset product ready"
      :product.ingredients?"Label details extracted":"No nutrition values found";
    renderSingleProductResult(product,note);
  }catch(error){
    const message=error.message||"Could not analyze this product label.";
    $("#ocr-status-a").textContent="Analysis failed";
    $("#ocr-notice").textContent=message;
    showToast(message);
  }finally{
    button.disabled=false;
    button.innerHTML=originalLabel;
  }
});
