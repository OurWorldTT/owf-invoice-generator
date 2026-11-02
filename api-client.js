'use strict';
(function(){
  const config=window.PUBLIC_INVOICE_CONFIG||{}; const base=String(config.apiBaseUrl||'').replace(/\/$/,''); const tokenKey='ow_public_access_token';
  const configured=()=>Boolean(base); const token=()=>sessionStorage.getItem(tokenKey)||'';
  const setToken=(value)=>{if(value)sessionStorage.setItem(tokenKey,value);else sessionStorage.removeItem(tokenKey);};
  async function request(path,options={}){
    if(!configured())throw new Error('Public API URL is not configured.'); const headers=new Headers(options.headers||{});headers.set('Accept','application/json');
    if(options.body&&!headers.has('Content-Type'))headers.set('Content-Type','application/json');if(token())headers.set('Authorization',`Bearer ${token()}`);
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let response;
    try{response=await fetch(`${base}${path}`,{...options,headers,mode:'cors',cache:'no-store',credentials:'omit',signal:controller.signal});}
    catch(error){throw new Error(error?.name==='AbortError'?'The public API timed out.':'The public API could not be reached.');}finally{clearTimeout(timer);}
    const payload=await response.json().catch(()=>({}));if(response.status===401)setToken('');if(!response.ok)throw new Error(payload.error||`Request failed (${response.status}).`);return payload;
  }
  async function health(){const value=await request('/api/health');if(value.edition!=='public')throw new Error('Backend edition mismatch. Public data access has been disabled.');return value;}
  const listDocuments=({search='',type=''}={})=>request(`/api/documents?${new URLSearchParams({search,type,limit:'200'})}`);
  const saveDocument=(document)=>request('/api/documents',{method:'POST',body:JSON.stringify({document})});
  const getProfile=()=>request('/api/profile'); const saveProfile=(profile)=>request('/api/profile',{method:'PUT',body:JSON.stringify(profile)});
  window.PublicInvoiceAPI=Object.freeze({configured,token,setToken,health,listDocuments,saveDocument,getProfile,saveProfile});
})();
