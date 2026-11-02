import { applyCors } from '../lib/cors.js'; import { requireAuth } from '../lib/auth.js'; import { ensureUser } from '../lib/users.js';
import { getPool } from '../lib/db.js'; import { enforceRateLimit } from '../lib/rate-limit.js'; import { readJson,sendError } from '../lib/http.js';
const clean=(value,max)=>String(value??'').trim().slice(0,max);
export default async function handler(req,res){
  if(applyCors(req,res))return; if(!['GET','PUT'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
  try{const identity=await requireAuth(req); await enforceRateLimit({subject:identity.subject,action:`profile:${req.method}`,limit:30}); let profile=await ensureUser(identity);
    if(req.method==='PUT'){const body=readJson(req); const currency=clean(body.defaultCurrency||'USD',3).toUpperCase(); if(!/^[A-Z]{3}$/.test(currency))throw Object.assign(new Error('Default currency is invalid.'),{statusCode:400});
      const{rows}=await getPool().query(`UPDATE user_profiles SET business_name=$2,business_email=$3,business_phone=$4,business_address=$5,default_currency=$6,updated_at=now() WHERE id=$1 RETURNING *`,
        [profile.id,clean(body.businessName,200),clean(body.businessEmail,320),clean(body.businessPhone,50),clean(body.businessAddress,1000),currency]); profile=rows[0];}
    res.status(200).json({profile:{businessName:profile.business_name,businessEmail:profile.business_email,businessPhone:profile.business_phone,businessAddress:profile.business_address,defaultCurrency:profile.default_currency,hasLogo:Boolean(profile.logo_object_key)}});
  }catch(error){sendError(res,error);}
}
