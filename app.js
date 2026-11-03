import { createInitialState, formatMoney, nextDocumentNumber } from './core.js';

const CONFIG = window.PUBLIC_INVOICE_CONFIG || {};
const API = window.PublicInvoiceAPI;
const STORAGE_KEY = 'ow_public_invoice_mobile_v1';

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && Array.isArray(parsed.documents) ? { ...createInitialState(), ...parsed, profile:{...createInitialState().profile,...parsed.profile}, presets:Array.isArray(parsed.presets)?parsed.presets:[] } : createInitialState();
  } catch { return createInitialState(); }
}

let state = loadState();
let itemId = 0;
let signatureMode = state.profile.signatureMode || 'typed';
let signaturePad;
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function usesRemoteAccount() { return CONFIG.authMode === 'ow-login' && API?.configured(); }
function canUseRemoteAccount() { return usesRemoteAccount() && Boolean(API.token()); }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(dateString, days) { const date = new Date(`${dateString}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0,10); }
function showToast(message) { const toast=$('toast'); toast.textContent=message; toast.hidden=false; clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>{toast.hidden=true;},2600); }
function requireSignedIn(){if(usesRemoteAccount()&&!canUseRemoteAccount()){showToast('Sign in through the OW Login Portal to continue.');route('settings');return false;}return true;}

function route(name,{ reset = true } = {}) {
  if ((name === 'create' || name === 'records') && !requireSignedIn()) return;
  document.querySelectorAll('[data-screen]').forEach((screen) => { const active=screen.dataset.screen===name; screen.hidden=!active; screen.classList.toggle('is-active',active); });
  document.querySelectorAll('.bottom-nav [data-route]').forEach((button)=>button.classList.toggle('is-active',button.dataset.route===name));
  if (name === 'create' && reset) resetForm();
  if (name === 'records') renderRecords();
  if (name === 'settings') renderProfile();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  $('mainContent').focus({ preventScroll: true });
}

function calculate() {
  const items=[...document.querySelectorAll('.item-row')].map((row)=>({ description:row.querySelector('.item-desc').value.trim(), quantity:Number(row.querySelector('.item-qty').value)||0, rate:Number(row.querySelector('.item-rate').value)||0 }));
  const subtotal=items.reduce((sum,item)=>sum+item.quantity*item.rate,0);
  const tax=Number($('taxValue').value)||0;
  const currency=$('currency').value;
  $('subtotalValue').textContent=formatMoney(subtotal,currency);
  $('totalValue').textContent=formatMoney(subtotal+tax,currency);
  return { items, subtotal, tax, total:subtotal+tax };
}

function addItem(item={ description:'', quantity:1, rate:0 }) {
  const row=document.createElement('div'); row.className='item-row'; row.dataset.itemId=String(++itemId);
  row.innerHTML=`<label class="item-description-field"><span>Description</span><input class="item-desc" value="${escapeHtml(item.description)}" required /></label><label><span>Qty</span><input class="item-qty" type="number" min="0.01" step="0.01" value="${item.quantity}" required /></label><label><span>Rate</span><input class="item-rate" type="number" min="0" step="0.01" value="${item.rate}" required /></label><button class="remove-item" type="button" aria-label="Remove item">×</button>`;
  row.querySelectorAll('input').forEach((input)=>input.addEventListener('input',calculate));
  row.querySelector('.remove-item').addEventListener('click',()=>{ if(document.querySelectorAll('.item-row').length===1) return showToast('A document needs at least one item.'); row.remove(); calculate(); });
  $('itemsList').append(row); calculate();
}

function resetForm() {
  $('documentForm').reset(); $('documentType').value='invoice'; $('issueDate').value=today(); $('dueDate').value=addDays(today(),14); $('currency').value='USD'; $('itemsList').innerHTML=''; addItem(); setDocumentType('invoice');
}

function setDocumentType(type) {
  $('documentType').value=type; document.querySelectorAll('[data-doc-type]').forEach((button)=>button.classList.toggle('is-selected',button.dataset.docType===type));
  $('dueDateField').hidden=type==='receipt'; $('dueDate').required=type==='invoice';
  $('documentNumber').value=nextDocumentNumber(type,state.counters[type]);
  $('createScreen').querySelector('h1').textContent=`${type==='receipt'?'Receipt':'Invoice'} details`;
}

function collectDocument() {
  const totals=calculate(); const type=$('documentType').value;
  return { id:crypto.randomUUID(), type, number:$('documentNumber').value, issueDate:$('issueDate').value, dueDate:type==='invoice'?$('dueDate').value:null, status:type==='receipt'?'paid':'pending', clientName:$('clientName').value.trim(), clientPhone:$('clientPhone').value.trim(), clientEmail:$('clientEmail').value.trim(), clientAddress:$('clientAddress').value.trim(), currency:$('currency').value, ...totals, notes:$('notes').value.trim(), createdAt:new Date().toISOString() };
}

function previewMarkup(doc) {
  const logo=state.profile.logoDataUrl?`<img class="paper-logo" src="${state.profile.logoDataUrl}" alt="Business logo" />`:'';
  const rows=doc.items.map((item)=>`<tr><td>${escapeHtml(item.description||'Item')}</td><td>${item.quantity}</td><td>${formatMoney(item.quantity*item.rate,doc.currency)}</td></tr>`).join('');
  const signature=state.profile.signatureEnabled&&state.profile.signatureValue?(state.profile.signatureMode==='drawn'?`<div class="paper-signature"><img src="${escapeHtml(state.profile.signatureValue)}" alt="Saved signature" /><small>Authorized signature</small></div>`:`<div class="paper-signature"><div class="typed-signature">${escapeHtml(state.profile.signatureValue)}</div><small>Authorized signature</small></div>`):'';
  return `<div class="paper-head"><div>${logo}<h3>${escapeHtml(state.profile.businessName||'Your business')}</h3><p>${escapeHtml(state.profile.businessEmail)}</p></div><div class="paper-meta"><strong>${doc.type==='receipt'?'RECEIPT':'INVOICE'}</strong><p>${escapeHtml(doc.number)}</p><p>${escapeHtml(doc.issueDate)}</p></div></div><section><p><strong>Bill to</strong><br>${escapeHtml(doc.clientName||'Client name')}<br>${escapeHtml(doc.clientPhone||'')}<br>${escapeHtml(doc.clientEmail)}<br>${escapeHtml(doc.clientAddress)}</p></section><table class="paper-table"><thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><p class="paper-total">Total <strong>${formatMoney(doc.total,doc.currency)}</strong></p>${doc.notes?`<p><strong>Notes</strong><br>${escapeHtml(doc.notes)}</p>`:''}${signature}`;
}

function openPreview(doc) { if(!requireSignedIn())return; $('previewHeading').textContent=doc.number; $('previewContent').innerHTML=previewMarkup(doc); $('previewDialog').showModal(); }
function emptyMarkup() { return '<div class="empty-state"><strong>No documents yet</strong>Create your first invoice or receipt to see it here.</div>'; }
function rowMarkup(doc) { return `<article class="document-row"><button type="button" data-open-document="${doc.id}"><strong>${escapeHtml(doc.clientName)}</strong><small>${escapeHtml(doc.number)} · ${escapeHtml(doc.issueDate)}</small></button><div class="document-total"><strong>${formatMoney(doc.total,doc.currency)}</strong><small>${escapeHtml(doc.status)}</small></div></article>`; }
function bindDocumentRows(root) { root.querySelectorAll('[data-open-document]').forEach((button)=>button.addEventListener('click',()=>{const doc=state.documents.find((entry)=>entry.id===button.dataset.openDocument); if(doc) openPreview(doc);})); }
function renderHome() {
  const outstanding=state.documents.filter((doc)=>doc.type==='invoice'&&doc.status!=='paid').reduce((sum,doc)=>sum+doc.total,0);
  const paid=state.documents.filter((doc)=>doc.status==='paid').reduce((sum,doc)=>sum+doc.total,0);
  $('outstandingValue').textContent=formatMoney(outstanding); $('outstandingCount').textContent=`${state.documents.filter((doc)=>doc.type==='invoice'&&doc.status!=='paid').length} open invoices`; $('paidValue').textContent=formatMoney(paid); $('documentCount').textContent=String(state.documents.length);
  $('recentList').innerHTML=state.documents.length?state.documents.slice(0,4).map(rowMarkup).join(''):emptyMarkup(); bindDocumentRows($('recentList'));
}
function renderRecords() {
  const query=$('recordSearch').value.trim().toLowerCase(); const type=$('recordType').value;
  const docs=state.documents.filter((doc)=>(type==='all'||doc.type===type)&&(!query||`${doc.number} ${doc.clientName}`.toLowerCase().includes(query)));
  $('recordsList').innerHTML=docs.length?docs.map(rowMarkup).join(''):emptyMarkup(); bindDocumentRows($('recordsList'));
}
function initials(name=''){return name.split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('').toUpperCase()||'?';}
function renderPresets(){const rail=$('presetRail');rail.innerHTML=state.presets.length?state.presets.map((preset)=>`<div class="preset-tile" data-preset-id="${escapeHtml(preset.id)}"><button class="preset-remove" type="button" aria-label="Remove ${escapeHtml(preset.name)} preset">×</button><button type="button" class="preset-load"><span class="preset-initials">${escapeHtml(initials(preset.name))}</span><strong>${escapeHtml(preset.name)}</strong><small>${escapeHtml(preset.phone||preset.email||'No contact')}</small></button></div>`).join(''):'<p class="preset-empty">No client presets saved yet.</p>';
  rail.querySelectorAll('.preset-load').forEach((button)=>button.addEventListener('click',()=>{const preset=state.presets.find((entry)=>entry.id===button.parentElement.dataset.presetId);if(!preset)return;route('create',{reset:false});$('clientName').value=preset.name||'';$('clientPhone').value=preset.phone||'';$('clientEmail').value=preset.email||'';showToast('Client preset loaded. Other document fields were kept.');}));
  rail.querySelectorAll('.preset-remove').forEach((button)=>button.addEventListener('click',async()=>{const id=button.parentElement.dataset.presetId;try{if(canUseRemoteAccount())await API.deletePreset(id);state.presets=state.presets.filter((preset)=>preset.id!==id);persist();renderPresets();showToast('Preset removed.');}catch(error){showToast(error.message||'Preset could not be removed.');}}));}
function renderProfile(){Object.entries(state.profile).forEach(([key,value])=>{const input=$({businessName:'businessName',businessEmail:'businessEmail',businessPhone:'businessPhone',businessAddress:'businessAddress'}[key]);if(input)input.value=value||'';});$('logoPreview').innerHTML=state.profile.logoDataUrl?`<img src="${state.profile.logoDataUrl}" alt="Uploaded business logo" />`:'<span>Logo</span>';$('removeLogoBtn').hidden=!state.profile.logoDataUrl;$('signatureEnabled').checked=Boolean(state.profile.signatureEnabled);$('signatureEditor').hidden=!state.profile.signatureEnabled;signatureMode=state.profile.signatureMode||'typed';$('typedSignature').value=signatureMode==='typed'?state.profile.signatureValue||'':'';document.querySelectorAll('[data-signature-mode]').forEach((button)=>button.classList.toggle('is-selected',button.dataset.signatureMode===signatureMode));$('typedSignatureField').hidden=signatureMode!=='typed';$('drawnSignatureField').hidden=signatureMode!=='drawn';if(signatureMode==='drawn')signaturePad?.load(state.profile.signatureValue);$('themePreference').value=window.OWTheme?.get()||'auto';renderPresets();}

signaturePad=window.OWSignaturePad.create($('signatureCanvas'));

document.querySelectorAll('[data-route]').forEach((button)=>button.addEventListener('click',()=>route(button.dataset.route)));
document.querySelectorAll('[data-doc-type]').forEach((button)=>button.addEventListener('click',()=>setDocumentType(button.dataset.docType)));
document.querySelectorAll('[data-close-dialog]').forEach((button)=>button.addEventListener('click',()=>button.closest('dialog').close()));
$('newDocumentBtn').addEventListener('click',()=>route('create')); $('addItemBtn').addEventListener('click',()=>addItem()); $('taxValue').addEventListener('input',calculate);
$('clearDocumentBtn').addEventListener('click',()=>{resetForm();showToast('Document fields cleared.');});
$('previewBtn').addEventListener('click',()=>{ if(!$('documentForm').reportValidity()) return; openPreview(collectDocument()); });
$('documentForm').addEventListener('submit',async(event)=>{ event.preventDefault(); if(!event.currentTarget.reportValidity()) return; let doc=collectDocument();
  try{if(usesRemoteAccount()){if(!canUseRemoteAccount())throw new Error('Sign in through the OW Login Portal before saving to your account.');doc=(await API.saveDocument(doc)).document;}
    else state.counters[doc.type]+=1; state.documents.unshift(doc); persist(); renderHome(); resetForm(); showToast(`${doc.type==='receipt'?'Receipt':'Invoice'} saved${usesRemoteAccount()?' securely':''}.`); route('home');
  }catch(error){showToast(error.message||'Document could not be saved.');}});
$('recordSearch').addEventListener('input',renderRecords); $('recordType').addEventListener('change',renderRecords);
$('profileForm').addEventListener('submit',async(event)=>{event.preventDefault();const profile={...state.profile,businessName:$('businessName').value.trim(),businessEmail:$('businessEmail').value.trim(),businessPhone:$('businessPhone').value.trim(),businessAddress:$('businessAddress').value.trim()};
  try{state.profile=canUseRemoteAccount()?{...state.profile,...(await API.saveProfile(profile)).profile}:profile;persist();renderProfile();showToast(`Business profile saved${canUseRemoteAccount()?' securely':''}.`);}catch(error){showToast(error.message||'Profile could not be saved.');}});
$('logoInput').addEventListener('change',(event)=>{const file=event.target.files[0]; if(!file)return; if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>(CONFIG.maxLogoBytes||2097152)){event.target.value='';return showToast('Choose a PNG, JPEG, or WebP under 2 MB.');} const reader=new FileReader(); reader.onload=()=>{state.profile.logoDataUrl=reader.result;persist();renderProfile();showToast('Logo updated.');};reader.readAsDataURL(file);});
$('removeLogoBtn').addEventListener('click',()=>{state.profile.logoDataUrl='';persist();renderProfile();showToast('Logo removed.');});
$('themePreference').addEventListener('change',(event)=>window.OWTheme.set(event.target.value));
$('signatureEnabled').addEventListener('change',(event)=>{$('signatureEditor').hidden=!event.target.checked;});
document.querySelectorAll('[data-signature-mode]').forEach((button)=>button.addEventListener('click',()=>{signatureMode=button.dataset.signatureMode;document.querySelectorAll('[data-signature-mode]').forEach((entry)=>entry.classList.toggle('is-selected',entry===button));$('typedSignatureField').hidden=signatureMode!=='typed';$('drawnSignatureField').hidden=signatureMode!=='drawn';}));
$('clearSignatureBtn').addEventListener('click',()=>signaturePad.clear());
$('saveSignatureBtn').addEventListener('click',async()=>{const enabled=$('signatureEnabled').checked,value=signatureMode==='drawn'?signaturePad.toDataURL():$('typedSignature').value.trim();if(enabled&&!value)return showToast('Add a signature before enabling it.');const profile={...state.profile,signatureEnabled:enabled,signatureMode,signatureValue:enabled?value:''};try{state.profile=canUseRemoteAccount()?{...state.profile,...(await API.saveProfile(profile)).profile}:profile;persist();renderProfile();showToast(enabled?'Signature saved.':'Signature disabled and cleared.');}catch(error){showToast(error.message||'Signature could not be saved.');}});
$('presetForm').addEventListener('submit',async(event)=>{event.preventDefault();if(!requireSignedIn())return;let preset={id:crypto.randomUUID(),name:$('presetName').value.trim(),phone:$('presetPhone').value.trim(),email:$('presetEmail').value.trim()};try{if(canUseRemoteAccount())preset=(await API.savePreset(preset)).preset;state.presets.push(preset);persist();event.currentTarget.reset();renderPresets();showToast('Client preset saved.');}catch(error){showToast(error.message||'Preset could not be saved.');}});
$('supportBtn').addEventListener('click',()=>$('supportDialog').showModal()); $('paypalBtn').addEventListener('click',()=>{if(CONFIG.paypalDonateUrl){window.open(CONFIG.paypalDonateUrl,'_blank','noopener');}else{showToast('PayPal will be connected before release.');}});
$('printBtn').addEventListener('click',()=>{if(!requireSignedIn())return;window.print();resetForm();}); $('shareBtn').addEventListener('click',async()=>{if(!requireSignedIn())return;const text=$('previewContent').innerText;let completed=false;if(navigator.share){try{await navigator.share({title:$('previewHeading').textContent,text});completed=true;}catch{}}else{await navigator.clipboard.writeText(text);showToast('Document details copied.');completed=true;}if(completed)resetForm();});

$('loginPortalBtn').addEventListener('click',async()=>{try{await window.OWLoginPortal.login();}catch(error){showToast(error.message);}});
$('logoutBtn').addEventListener('click',()=>{window.OWLoginPortal.logout();state=createInitialState();persist();renderHome();renderProfile();resetForm();updateAccountPanel();showToast('Logged out securely.');});

function updateAccountPanel(){const signedIn=canUseRemoteAccount(),zone=$('loginZone');zone.classList.toggle('is-authenticated',signedIn);$('loggedOutView').hidden=signedIn;$('loggedInView').hidden=!signedIn;if(!signedIn)return;const name=state.profile.displayName||state.profile.businessName||'Account member';$('portalDisplayName').textContent=name;$('portalEmail').textContent=state.profile.email||state.profile.businessEmail||'';const avatar=state.profile.avatarUrl;$('portalAvatar').src=avatar||'assets/ourworld-mark.png';$('profileShortcut').innerHTML=avatar?`<img src="${escapeHtml(avatar)}" alt="" />`:escapeHtml(initials(name));}

async function initializeAccount(){
  const status=$('authStatus'),login=$('loginPortalBtn');
  try{await window.OWLoginPortal.handleCallback();}catch(error){status.textContent=error.message;}
  if(!usesRemoteAccount()){status.textContent='Development mode is active. OW Login Portal protection becomes mandatory when production configuration is enabled.';updateAccountPanel();return;}
  login.hidden=canUseRemoteAccount();
  if(!canUseRemoteAccount()){status.textContent='Sign up or log in through the OW Login Portal to continue.';updateAccountPanel();return;}
  try{await API.health();const[documents,profile,presets]=await Promise.all([API.listDocuments(),API.getProfile(),API.listPresets()]);state.documents=documents.documents||[];state.profile={...state.profile,...profile.profile};state.presets=presets.presets||[];persist();renderHome();renderProfile();status.textContent='Signed in · public cloud records synchronized.';updateAccountPanel();}
  catch(error){status.textContent=error.message||'Account synchronization failed.';login.hidden=false;}
}

renderHome(); renderProfile(); resetForm(); initializeAccount();
