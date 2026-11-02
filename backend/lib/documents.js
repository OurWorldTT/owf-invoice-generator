const types=new Set(['invoice','receipt']); const statuses=new Set(['draft','pending','paid','overdue','void']);
const text=(value,max=500)=>String(value ?? '').trim().slice(0,max); const money=(value)=>Math.round((Number(value)||0)*100)/100;
export function validateDocument(input={}) {
  const documentType=text(input.type || input.documentType,20).toLowerCase();
  if(!types.has(documentType)) throw Object.assign(new Error('Document type must be invoice or receipt.'),{statusCode:400});
  const issueDate=text(input.issueDate,10); const dueDate=documentType==='invoice'?text(input.dueDate,10):'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) throw Object.assign(new Error('Issue date is invalid.'),{statusCode:400});
  if(dueDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)||dueDate<issueDate)) throw Object.assign(new Error('Due date cannot be before the issue date.'),{statusCode:400});
  const clientName=text(input.clientName,200); if(!clientName) throw Object.assign(new Error('Client name is required.'),{statusCode:400});
  const currency=text(input.currency,3).toUpperCase(); if(!/^[A-Z]{3}$/.test(currency)) throw Object.assign(new Error('Currency must be a three-letter ISO code.'),{statusCode:400});
  const items=Array.isArray(input.items)?input.items.slice(0,100).map((item)=>({description:text(item.description,500),quantity:money(item.quantity),rate:money(item.rate)})):[];
  if(!items.length||items.some((item)=>!item.description||item.quantity<=0||item.rate<0)) throw Object.assign(new Error('At least one valid line item is required.'),{statusCode:400});
  const subtotal=money(items.reduce((sum,item)=>sum+item.quantity*item.rate,0)); const taxTotal=money(input.tax ?? input.taxTotal);
  const discountTotal=money(input.discountTotal); const deliveryFee=money(input.deliveryFee);
  if([taxTotal,discountTotal,deliveryFee].some((value)=>value<0)) throw Object.assign(new Error('Tax, discount, and delivery amounts cannot be negative.'),{statusCode:400});
  const total=money(subtotal+taxTotal+deliveryFee-discountTotal); if(total<0) throw Object.assign(new Error('Document total cannot be negative.'),{statusCode:400});
  const status=text(input.status || (documentType==='receipt'?'paid':'pending'),20).toLowerCase(); if(!statuses.has(status)) throw Object.assign(new Error('Document status is invalid.'),{statusCode:400});
  return {requestId:text(input.requestId||input.id,100),documentType,status,issueDate,dueDate:dueDate||null,clientName,clientEmail:text(input.clientEmail,320),clientPhone:text(input.clientPhone,50),clientAddress:text(input.clientAddress,1000),currency,items,subtotal,taxTotal,discountTotal,deliveryFee,total,paymentMethod:text(input.paymentMethod,100),transactionReference:text(input.transactionReference,200),notes:text(input.notes,2000)};
}
export function serializeDocument(row){return{id:row.id,requestId:row.request_id,type:row.document_type,number:row.document_number,issueDate:row.issue_date,dueDate:row.due_date,status:row.status,clientName:row.client_name,clientEmail:row.client_email,clientPhone:row.client_phone,clientAddress:row.client_address,currency:row.currency,items:row.items,subtotal:Number(row.subtotal),tax:Number(row.tax_total),discountTotal:Number(row.discount_total),deliveryFee:Number(row.delivery_fee),total:Number(row.total),paymentMethod:row.payment_method,transactionReference:row.transaction_reference,notes:row.notes,createdAt:row.created_at,updatedAt:row.updated_at};}
