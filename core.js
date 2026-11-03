export function createInitialState() {
  return {
    profile: { displayName:'', email:'', avatarUrl:'', businessName: '', businessEmail: '', businessPhone: '', businessAddress: '', logoDataUrl: '', signatureEnabled:false, signatureMode:'typed', signatureValue:'' },
    counters: { invoice: 0, receipt: 0 },
    documents: [],
    presets: []
  };
}

export function formatMoney(value, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(value) || 0);
}

export function nextDocumentNumber(type, count, date = new Date()) {
  const prefix = type === 'receipt' ? 'RCT' : 'INV';
  return `${prefix}-${date.getFullYear()}-${String(count + 1).padStart(4, '0')}`;
}
