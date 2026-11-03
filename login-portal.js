'use strict';
(function(){
  const config=window.PUBLIC_INVOICE_CONFIG||{},verifierKey='ow_login_pkce_verifier',stateKey='ow_login_oauth_state';
  const base64url=(bytes)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  function random(size=32){const bytes=new Uint8Array(size);crypto.getRandomValues(bytes);return base64url(bytes);}
  async function login(){
    if(!config.loginPortalUrl||!config.loginPortalClientId)throw new Error('OW Login Portal is not configured.');
    const verifier=random(64),state=random(24),digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));sessionStorage.setItem(verifierKey,verifier);sessionStorage.setItem(stateKey,state);
    const redirectUri=config.loginPortalRedirectUri||`${location.origin}${location.pathname}`;const params=new URLSearchParams({response_type:'code',client_id:config.loginPortalClientId,redirect_uri:redirectUri,scope:config.loginPortalScope||'openid profile email',state,code_challenge:base64url(new Uint8Array(digest)),code_challenge_method:'S256'});
    location.assign(`${config.loginPortalUrl}${config.loginPortalUrl.includes('?')?'&':'?'}${params}`);
  }
  async function handleCallback(){
    const params=new URLSearchParams(location.search);const code=params.get('code');if(!code)return false;const returnedState=params.get('state'),expectedState=sessionStorage.getItem(stateKey),verifier=sessionStorage.getItem(verifierKey);
    if(!returnedState||returnedState!==expectedState||!verifier)throw new Error('Login response validation failed. Please try again.');if(!config.loginPortalTokenUrl)throw new Error('OW Login Portal token URL is not configured.');
    const redirectUri=config.loginPortalRedirectUri||`${location.origin}${location.pathname}`;const response=await fetch(config.loginPortalTokenUrl,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:config.loginPortalClientId,redirect_uri:redirectUri,code_verifier:verifier})});
    const payload=await response.json().catch(()=>({}));if(!response.ok||!payload.access_token)throw new Error(payload.error_description||'OW Login Portal could not complete sign-in.');window.PublicInvoiceAPI.setToken(payload.access_token);sessionStorage.removeItem(verifierKey);sessionStorage.removeItem(stateKey);history.replaceState({},document.title,`${location.pathname}${location.hash}`);return true;
  }
  function logout(){window.PublicInvoiceAPI.logout();if(config.loginPortalLogoutUrl)location.assign(config.loginPortalLogoutUrl);}
  window.OWLoginPortal=Object.freeze({login,handleCallback,logout});
})();
