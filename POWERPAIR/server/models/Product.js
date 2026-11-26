export default class Product {
  constructor(data){Object.assign(this,data,{createdAt:new Date()})}
}
