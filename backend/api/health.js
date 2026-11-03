import { applyCors, configuredOrigins } from '../lib/cors.js';
import { getPool } from '../lib/db.js';
import { authConfiguration } from '../lib/auth.js';
import { sendError } from '../lib/http.js';
export default async function handler(req,res){
  if(applyCors(req,res))return; if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
  try{const{rows}=await getPool().query(`SELECT current_database() database_name,(SELECT value FROM app_meta WHERE key='schema_version') schema_version,
    to_regclass('public.user_profiles') IS NOT NULL has_profiles,to_regclass('public.documents') IS NOT NULL has_documents,
    to_regclass('public.api_rate_limits') IS NOT NULL has_rate_limits,to_regclass('public.client_presets') IS NOT NULL has_presets,to_regclass('public.audit_events') IS NOT NULL has_audit`); const db=rows[0]||{};
    const expected=String(process.env.EXPECTED_DATABASE_NAME||'invoice_public'); const databaseIdentityReady=db.database_name===expected;
    const databaseReady=Boolean(db.has_profiles&&db.has_documents&&db.has_rate_limits&&db.has_presets&&db.has_audit); const authReady=authConfiguration().ready;
    const corsReady=configuredOrigins().length>0; const ok=databaseIdentityReady&&databaseReady&&authReady&&corsReady;
    res.status(200).json({ok,service:'owf-public-invoice-api',edition:'public',version:'1.2.0',database:db.database_name,schemaVersion:db.schema_version||'',databaseIdentityReady,databaseReady,authReady,corsReady,
      ...(ok?{}:{error:'Public API readiness checks failed. Verify database identity/schema, OW Login Portal authentication, and CORS.'})});
  }catch(error){sendError(res,error);}
}
