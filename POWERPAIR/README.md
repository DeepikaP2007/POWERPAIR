# Ingrevia AI — Smart Shopping Decision System

A hackathon-ready food label comparison and decision system. Ingrevia explains why a product may be a better fit using measurable nutrition factors, ingredient context and an optional OCR workflow.

## Main features
- Compare nutrition values and show traffic signals for entered values
- Scan one product label to extract and display nutrition, ingredients, and possible watch items
- Select a product from the local dataset when no photo is available
- Change or remove an uploaded image; dataset selection becomes available again after removal
- Explain extracted ingredients separately for both products in comparison results
- Match exact product names against `data/foodProducts.json` and show clearly labeled reference descriptions
- Identify possible ingredient/allergen considerations from label text
- Show possible ingredient and allergen considerations with practical next steps
- JPG/JPEG/PNG OCR with confidence feedback
- Preserve the full recognized label text in single-product and comparison results
- Editable product names and extracted label text
- Clickable home-page feature cards that open the related scanner/comparison controls
- Responsive, accessible interface
- No API key or database required for the demo

## Recommended project structure
```text
smart-shopping-decision/
├── index.html                 # Working demo application
├── styles.css
├── app.js
├── data/
│   └── foodProducts.json       # Product reference records and derived descriptions
├── client/
│   ├── package.json
│   └── src/services/api.js
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
├── README.md
├── .env.example
└── .gitignore
```

## Install
The included demo is framework-free and works without installation:

```powershell
python -m http.server 4173
```

Open `http://localhost:4173`.

### Run from VS Code

Open the project root and press **F5**, then choose **Run Ingrevia website**. VS Code starts the Python web server and opens the working demo at `http://127.0.0.1:4173/`. No Node.js packages are needed for this demo.

Do not open `client/index.html` directly: it is a Vite entry point and needs the separate React development server described below.

For the React source and Express API:

```powershell
cd client
npm install
npm run dev

cd ../server
npm install
copy ..\\.env.example .env
npm start
```

Set `VITE_API_URL` to `http://localhost:5000/api` if using the React client.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API status |
| POST | `/api/products/analyze` | Analyze one product |
| POST | `/api/products/compare` | Compare two products |
| POST | `/api/products/ingredients/explain` | Explain ingredients |
| POST | `/api/products/summary` | Generate fallback summary |
| POST | `/api/ocr` | Extract text from an image |

## Comparison score and food-safety notes

The comparison score is a project-specific informational heuristic, not a medical, government, or official food-safety rating. It uses nutrition values available for both products and normalizes the points over those shared fields; absent OCR values are not treated as zero, and category estimates are excluded from scores and recommendations. An approximate better-choice prediction is shown only when the products have comparable entered nutrition data and different scores. The nutrition comparison table shows green/red better-choice indicators for comparable, label-entered values, plus traffic signals for entered or estimated values; ties, estimates, and missing values do not produce a better-choice claim.

Risk panels use red when the entered label information triggers a project watch prompt, green when there are no watch items and the key nutrition and ingredient information is present, and amber when more label details are needed. Green means only that no watch items were detected in the information provided; it does not guarantee that a product is safe or suitable for everyone.

- Protein: up to 24 points
- Fiber: up to 25 points
- Lower sugar: up to 20 points
- Lower saturated fat: up to 18 points
- Lower sodium: up to 18 points
- Lower excess calories: up to 15 points

Ingredient names and OCR text are shown with possible considerations, including common allergen terms and project watch ranges for sugar, saturated fat, sodium, and fiber. These prompts are not diagnoses and do not establish that a product is safe or harmful. OCR can miss or misread label text, and the values should only be compared when the serving sizes and units match. Always verify the package's complete ingredients and allergen statements. People with allergies or medical dietary needs should follow their clinician's advice.

The score is shown on a 0–100 scale and is only for comparing the entered information. It is not a medical or government health rating.

## OCR
POST a multipart image named `image`. JPG, JPEG and PNG are accepted, with a 5 MB limit. Tesseract.js returns extracted text and a confidence score; the browser scanner checks a full image and, when needed, a focused crop, and preserves recognized text from both passes in the results. Parsed nutrition values normalize recognized kJ and sodium units and leave ambiguous values blank rather than guessing. When values are missing, generic estimates are added only for clearly named breakfast cereal, fruit juice, biscuits/cookies, and protein bars. Estimates are marked in the results, excluded from recommendation scoring, and never used to infer ingredients or allergens. OCR may miss or misread label details; check the complete transcript and compare it with the package.

The local product reference file contains product names plus descriptions derived from its category, ingredient, and allergen fields because the supplied source did not include descriptions. Select a product in either scanner panel to load its dataset nutrition, ingredients, allergens, and description without a photo. The dataset does not specify a nutrition serving basis, so those values are labeled as reference data, per-serving traffic signals are suppressed, and mixing dataset and label sources will not produce a better-choice score. Verify all details against the package.

## Demo testing
1. Open the home page and choose **Try demo products** to load two sample labels.
2. Choose **Compare both products** and review the scores, nutrition traffic signals, and watch items.
3. Use **Scan one product** to show the single-label workflow, upload one product photo or enter its label text, then choose **Analyze this product** to view extracted details.
4. Use **Compare two products** to return to the comparison workflow. Verify extracted values and ingredients against the package.
5. In either product panel, leave the photo empty and select a dataset product such as **Biscuit A**. Analyze it or select two dataset products and compare them.
6. Upload a photo, choose **Remove image**, and verify the dataset selector is available again.

## Environment
Copy `.env.example` to `server/.env` and set optional values:
- `PORT=5000`
- `MONGODB_URI=...`
- `AI_API_KEY=...`

No key is needed in mock mode. Never expose API keys in frontend code.

## MongoDB
MongoDB is optional for the demo. The API is currently mock-first and may later persist products and analysis documents using the documented fields.

## Limitations
- OCR depends on image quality and lighting.
- Ingredient explanations are educational, not diagnoses or personalized dietary advice.
- Product descriptions are derived from the supplied demo dataset and are not independently verified; confirm product details against the package.
- Dataset nutrition values have no stated serving basis and should not be treated as per-serving label values.
- Scores and watch ranges are project references; they cannot account for individual medical needs, portion sizes, or overall diet.
- Live AI can be added behind the server summary endpoint.
