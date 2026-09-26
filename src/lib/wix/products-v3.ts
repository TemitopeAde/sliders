import { productsV3,readOnlyVariantsV3 } from '@wix/stores';
import { categories } from '@wix/categories';
import { media } from '@wix/sdk';
import type { StoreProduct } from './products';
import { safeUrl } from '../../schemas/slider';
const fields=['CURRENCY','PLAIN_DESCRIPTION','URL'] as const;
export function normalizeV3(p:productsV3.V3Product):StoreProduct{const actual=p.actualPriceRange?.minValue;const compare=p.compareAtPriceRange?.minValue;const onSale=Number(compare?.amount??0)>Number(actual?.amount??0);const source=p.media?.main?.image??p.media?.main?.url??'';return {id:p._id??'',name:p.name??'Product',description:(p.plainDescription??'').replace(/<[^>]*>/g,''),image:source.startsWith('wix:image://')?media.getScaledToFillImageUrl(source,800,800,{}):source,url:safeUrl.safeParse(p.url??'').success?p.url??'':'',price:(onSale?compare?.formattedAmount:actual?.formattedAmount)??'',discountedPrice:actual?.formattedAmount??'',amount:Number(actual?.amount??0),sku:p.variantsInfo?.variants?.[0]?.sku??'',inStock:p.inventory?.availabilityStatus==='IN_STOCK'||p.inventory?.availabilityStatus==='PARTIALLY_OUT_OF_STOCK',onSale,requiresOptions:!!p.options?.length||!!p.modifiers?.length,catalogVersion:'V3'};}
export async function queryV3(search:string,collectionId:string,sort:string,offset:number){
 const filter:productsV3.V3ProductSearch['filter']=collectionId?{'directCategoriesInfo.categories':{$matchItems:[{_id:collectionId}]}}:undefined;
 const sorting:productsV3.V3ProductSearch['sort']=sort==='name'?[{fieldName:'name',order:'ASC'}]:sort==='price'?[{fieldName:'actualPriceRange.minValue.amount',order:'ASC'}]:sort==='newest'?[{fieldName:'_createdDate',order:'DESC'}]:undefined;
 let cursor:string|undefined;let result:productsV3.V3SearchProductsResponse={};
 // The dashboard uses offsets; V3 accepts cursors. Walk only to the requested page.
 for(let page=0;page<=Math.floor(offset/48);page++){result=await productsV3.searchProducts({cursorPaging:{limit:48,...(cursor?{cursor}:{})},...(filter?{filter}:{}),...(sorting?{sort:sorting}:{}),...(search?{search:{expression:search,fields:['name']}}:{})},{fields:[...fields]});cursor=result.pagingMetadata?.cursors?.next??undefined;if(!cursor)break;}
 return {items:(result.products??[]).filter(p=>p.visible!==false).map(normalizeV3),hasNext:!!cursor};
}
export async function getV3(id:string){const p=await productsV3.getProduct(id,{fields:[...fields]});return p&&p.visible!==false?normalizeV3(p):null;}
export async function collectionsV3(){let result=await categories.queryCategories({treeReference:{appNamespace:'@wix/stores'}}).exists('name',true).limit(100).find();const all=[...result.items];while(result.hasNext()){result=await result.next();all.push(...result.items);}return all.map(c=>({id:c._id??'',name:c.name??'Category'}));}
export async function defaultVariant(id:string){const result=await readOnlyVariantsV3.queryVariants().eq('productData.productId',id).limit(2).find();if(result.items.length!==1)throw new Error('Choose options on the product page before adding to cart.');const variant=result.items[0];const variantId=variant?.variantId??variant?._id;if(!variantId)throw new Error('This product has no purchasable variant.');return variantId;}
