'use strict';
(function(){
  const key='ow_invoice_theme_preference';
  const media=matchMedia('(prefers-color-scheme: dark)');
  const stored=()=>{const value=localStorage.getItem(key);return ['auto','light','dark'].includes(value)?value:'auto';};
  const effective=(preference=stored())=>preference==='auto'?(media.matches?'dark':'light'):preference;
  function apply(preference=stored()){
    const normalized=['auto','light','dark'].includes(preference)?preference:'auto';
    document.documentElement.dataset.theme=effective(normalized);document.documentElement.dataset.themePreference=normalized;
    document.documentElement.style.colorScheme=effective(normalized);return normalized;
  }
  function set(preference){localStorage.setItem(key,preference);return apply(preference);}
  media.addEventListener?.('change',()=>{if(stored()==='auto')apply('auto');});
  apply(); window.OWTheme=Object.freeze({get:stored,set,apply,effective});
})();
