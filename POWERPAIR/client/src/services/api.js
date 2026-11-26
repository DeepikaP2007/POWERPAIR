import axios from "axios";
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||"http://localhost:5000/api"});
export const analyzeProduct=(product)=>api.post("/products/analyze",product);
export const compareProducts=(a,b)=>api.post("/products/compare",{a,b});
export const explainIngredients=(ingredients)=>api.post("/products/ingredients/explain",{ingredients});
export const extractOCR=(image)=>{const form=new FormData();form.append("image",image);return api.post("/ocr",form,{headers:{"Content-Type":"multipart/form-data"}})};
export default api;
