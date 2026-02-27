// Frontend extension: bank info loader, Bengali strings, spoken-PIN parser, sentiment & fraud helpers, feedback on close
(function(){
  // Load bank info JSON into window.BANK_INFO
  fetch('data/bank_info.json')
    .then(r => r.json())
    .then(j => { window.BANK_INFO = j; console.log('BANK_INFO loaded'); })
    .catch(e => { console.warn('Failed to load BANK_INFO', e); });

  // Add Bengali (bn) translations to existing STRINGS object if present
  if (window.STRINGS) {
    window.STRINGS.bn = {
      "voice_bot": "ভয়েস বো্ট",
      "send": "পাঠান",
      "mic": "মাইক্রোফোন",
      "close": "বন্ধ করুন",
      "enter_amount": "পরিমাণ লিখুন",
      "enter_pin": "পিন লিখুন",
      "transfer_success": "ট্রান্সফার সফল হয়েছে",
      "transfer_failed": "ট্রান্সফার ব্যর্থ হয়েছে",
      "confirm": "নিশ্চিত করুন",
      "cancel": "বাতিল করুন",
      "welcome": "স্বাগতম",
      "thank_you_feedback": "আপনার প্রতিক্রিয়ার জন্য ধন্যবাদ!",
      "ask_pin_voice": "অনুগ্রহ করে আপনার 4-অঙ্কের পিনটা বলুন।"
    };
  }

  // Simple spoken-number-to-digits parser supporting en, hi, mr, ta, bn words
  window.parseSpokenPin = function(spoken, lang){
    if(!spoken || typeof spoken !== 'string') return '';
    spoken = spoken.toLowerCase().replace(/[,.]/g,' ').replace(/-/g,' ');

    // direct digits in text
    const direct = spoken.match(/\d+/g);
    if(direct){
      const joined = direct.join('');
      return joined.slice(0,4);
    }

    // word maps
    const maps = {
      en: { 'zero':'0','oh':'0','o':'0','one':'1','two':'2','three':'3','four':'4','for':'4','five':'5','six':'6','seven':'7','eight':'8','nine':'9' },
      hi: { 'shoonya':'0','shunya':'0','zero':'0','ek':'1','do':'2','teen':'3','char':'4','chaar':'4','paanch':'5','chhe':'6','che':'6','saat':'7','aat':'8','aath':'8','nau':'9','nau':'9' },
      mr: { 'shunya':'0','ek':'1','don':'2','don':'2','don':'2','do':'2','dō':'2','don':'2','dōn':'2','don':'2','don':'2','don':'2','don':'2','teen':'3','char':'4','paanch':'5','sah':'6','saat':'7','aath':'8','nau':'9' },
      ta: { 'sonna':'0','onru':'1','ondru':'1','onru':'1','ondru':'1','ondu':'1','rendu':'2','moonru':'3','moondru':'3','naalu':'4','anchu':'5','aaru':'6','elu':'7','entu':'8','ombathu':'9' },
      bn: { 'shunno':'0','shunya':'0','ek':'1','dui':'2','tin':'3','char':'4','panch':'5','choy':'6','sat':'7','aath':'8','noy':'9' }
    };

    const map = maps[lang] || maps['en'];
    const parts = spoken.split(/\s+/);
    let out = '';
    for (const p of parts){
      if (out.length >= 4) break;
      if (map[p]) { out += map[p]; continue; }
      // try stripping common suffixes
      const clean = p.replace(/[^a-z]/g,'');
      if (map[clean]) { out += map[clean]; continue; }
      // english words like 'one-two-three' or hyphenated handled earlier
    }
    return out.slice(0,4);
  };

  // Simple sentiment detector
  window.detectSentimentLite = function(text){
    if(!text) return 'neutral';
    text = text.toLowerCase();
    const positive = ['good','great','awesome','nice','thanks','thank you','helpful','love','excellent'];
    const negative = ['bad','terrible','hate','angry','upset','not','fraud','scam','fraudulent','complain'];
    let score = 0;
    for(const w of positive) if(text.includes(w)) score++;
    for(const w of negative) if(text.includes(w)) score--;
    if(score > 0) return 'positive';
    if(score < 0) return 'negative';
    return 'neutral';
  };

  // Simple fraud heuristics for demo
  window.checkFraudLite = function(transfer){
    // transfer: {amount, senderBalance, timesToday, newBeneficiary}
    const reasons = [];
    if(!transfer) return { risk: 'low', reasons };
    const amt = Number(transfer.amount) || 0;
    const bal = Number(transfer.senderBalance) || 0;
    if(amt > bal) reasons.push('Amount greater than balance');
    if(bal>0 && amt > 0.5 * bal) reasons.push('High amount relative to balance');
    if(amt > 500000) reasons.push('Very large amount');
    if(transfer.timesToday && transfer.timesToday >= 5) reasons.push('Multiple transfers today');
    if(transfer.newBeneficiary) reasons.push('New beneficiary');
    return { risk: reasons.length ? 'high' : 'low', reasons };
  };

  // On voice panel close: ask for short feedback and store
  const originalClose = window.closeVP || function(){
    const vp = document.getElementById('voicePanel'); if(vp) vp.style.display='none';
  };

  window.closeVP = function(){
    // ask quick feedback using prompt (lightweight) then call originalClose
    try{
      const q = (window.currentLang && window.STRINGS && window.STRINGS[window.currentLang] && window.STRINGS[window.currentLang].close) ? window.STRINGS[window.currentLang].close : 'Close';
      const fb = prompt('Before you close, please give a short feedback (1-2 lines):');
      if(fb && fb.trim()){
        const sentiment = window.detectSentimentLite(fb);
        const entry = { ts: Date.now(), feedback: fb.trim(), sentiment: sentiment, lang: window.currentLang || 'en' };
        const key = 'xb_feedback_entries';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(entry);
        localStorage.setItem(key, JSON.stringify(existing));
        alert((window.STRINGS && window.STRINGS[window.currentLang] && window.STRINGS[window.currentLang].thank_you_feedback) || 'Thank you for your feedback!');
      }
    }catch(e){ console.warn('feedback capture failed', e); }
    // close UI
    originalClose();
  };

  // Expose a convenience to fill pin inputs from spoken pin
  window.fillPinFieldsFromSpoken = function(spoken, lang){
    const pin = window.parseSpokenPin(spoken, lang||window.currentLang||'en');
    if(!pin || pin.length < 4) return false;
    try{
      for(let i=0;i<4;i++){
        const el = document.getElementById('cp'+(i+1)); if(el) el.value = pin.charAt(i);
      }
      return true;
    }catch(e){ return false; }
  };

  console.log('nb_extra loaded: parseSpokenPin, detectSentimentLite, checkFraudLite, fillPinFieldsFromSpoken, closeVP override');
})();
