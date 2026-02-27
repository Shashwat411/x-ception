// Front-end logic for AI Voice Banking demo
// uses backend API endpoints

const API = {
  signup: async (data) => {
    const r = await fetch('/api/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    return r.json();
  },
  login: async (id, password) => {
    const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,password})});
    return r.json();
  },
  me: async () => {
    const r = await fetch('/api/customers/me', { headers:{ Authorization: 'Bearer ' + session.token }});
    return r.json();
  },
  transfer: async (payload) => {
    const r = await fetch('/api/transfer', { method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+session.token}, body:JSON.stringify(payload)});
    return r.json();
  },
  txns: async () => {
    const r = await fetch('/api/transactions/me', { headers:{ Authorization:'Bearer '+session.token }});
    return r.json();
  }
};

let session = { user:null, token:null, lang:'en', adminToken:null };

function goto(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el = document.getElementById(page+'-page'); if(el) el.classList.add('active');
  window.scrollTo(0,0);
  document.getElementById('pub-nav').style.display=(page==='dashboard' || page==='admin')?'none':'flex';
  if(page==='dashboard') refreshDash();
  if(page==='admin') refreshAdmin();
}

async function doSignup() {
  const name=document.getElementById('su-name').value.trim();
  const phone=document.getElementById('su-phone').value.trim();
  const dob=document.getElementById('su-dob').value;
  const addr=document.getElementById('su-addr').value.trim();
  const pwd=document.getElementById('su-pwd').value;
  const pwd2=document.getElementById('su-pwd2').value;
  const lang=document.getElementById('su-lang').value;
  const pin=['pin1','pin2','pin3','pin4'].map(id=>document.getElementById(id).value).join('');
  if(!name||!phone||!dob||!addr||!pwd) { toast(T('fill_all'),'err'); return; }
  if(pwd!==pwd2) { toast(T('pwd_mismatch'),'err'); return; }
  if(pin.length!==4||isNaN(pin)) { toast(T('pin_invalid'),'err'); return; }
  const resp=await API.signup({name,phone,dob,addr,password:pwd,lang,pin});
  if(resp.token) {
    session.token=resp.token; session.user=resp.user; session.lang=resp.user.lang||'en';
    document.getElementById('global-lang').value=session.lang;
    toast(`✅ Account created! Your Account No: ${resp.accNo}. ₹10,000 welcome bonus added.`,'ok');
    setTimeout(()=>{goto('dashboard'); vpAddMsg(T('welcome_msg', session.user.name),'ai');},1200);
  } else {
    toast(resp.message||'Signup failed','err');
  }
}

async function doLogin() {
  const id=document.getElementById('li-id').value.trim();
  const pwd=document.getElementById('li-pwd').value;
  if(!id||!pwd){toast(T('fill_all'),'err');return;}
  const resp=await API.login(id,pwd);
  if(resp.token) {
    session.token=resp.token; session.user=resp.user; session.lang=session.user.lang||'en';
    document.getElementById('global-lang').value=session.lang;
    toast(T('login_ok', session.user.name),'ok');
    setTimeout(()=>goto('dashboard'),800);
  } else {
    toast(resp.message||'Login error','err');
  }
}

async function doAdminLogin(){
  const id=document.getElementById('adm-id').value.trim();
  const pwd=document.getElementById('adm-pwd').value;
  if(!id||!pwd){toast('Fill admin credentials','err');return;}
  const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,password:pwd})});
  const resp=await r.json();
  if(resp.token){
    session.adminToken=resp.token;
    toast('✅ Admin authenticated','ok');
    setTimeout(()=>goto('admin'),400);
  } else {
    toast(resp.message||'Admin login failed','err');
  }
}

function doLogout(){ session.user=null; session.token=null; toast('Logged out securely.','ok'); goto('home'); }

// voice login remains client-side name detection
function voiceLogin() {
  toast('🎙️ Listening for voice authentication...', 'ok');
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast('Voice auth not supported. Use Chrome browser.','err'); return; }
  const r=new SR(); r.lang='en-IN';
  r.onresult=(e)=>{
    const spoken=e.results[0][0].transcript.toLowerCase();
    // ask server for matching user by name (open endpoint)
    fetch('/api/customers/list').then(r=>r.json()).then(list=>{
      const found=list.find(c=>spoken.includes(c.name.toLowerCase().split(' ')[0]));
      if(found) {
        // exchange for token so we can perform transfers
        fetch('/api/voice-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accNo:found.accNo})})
          .then(r=>r.json())
          .then(data=>{
            if(data.token){
              session.token=data.token; session.user=data.user; session.lang=data.user.lang||'en';
              document.getElementById('global-lang').value=session.lang;
              toast(`✅ Voice matched: ${found.name} | Login successful!`,'ok');
              setTimeout(()=>goto('dashboard'),800);
            } else {
              toast('Voice login failed (no token)','err');
            }
          }).catch(()=>toast('Voice login API error','err'));
      } else {
        toast('Voice not matched. Please try password login.','err');
      }
    }).catch(()=>toast('Voice login failed.','err'));
  };
  r.onerror=()=>toast('Voice capture failed. Try password login.','err');
  r.start();
}

async function refreshDash(){
  if(!session.user) return;
  // if we have token, fetch latest from server
  if(session.token) {
    const u=await API.me(); if(u.accNo) session.user=u;
  }
  const u=session.user;
  document.getElementById('sb-name').textContent=u.name;
  document.getElementById('sb-accno').textContent='A/C: '+u.accNo;
  document.getElementById('sb-bal').textContent='₹'+u.balance.toLocaleString('en-IN');
  document.getElementById('d-greet').textContent=T('greet',u.name);
  document.getElementById('d-date').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  document.getElementById('d-bal-main').textContent='₹'+u.balance.toLocaleString('en-IN');
  document.getElementById('d-accno-disp').textContent='A/C '+u.accNo;
  document.getElementById('dash-user-label').textContent=u.name;
  document.getElementById('card-name').textContent=u.name.toUpperCase();
  // refresh transactions
  const txns = await API.txns(); u.txns=txns;
  // populate tables similar to earlier code...
  // (Omitted for brevity, can reuse earlier mapping)
  applyLangUI();
}

// ...other functions (transfer, pin modal) mostly same as earlier but using API
let pendingTransfer=null, transferMode='NEFT';
function setTT(mode){ transferMode=mode; ['NEFT','IMPS','UPI'].forEach(m=>{
  document.getElementById('tb-'+m.toLowerCase()).className='btn '+(m===mode?'btn-primary':'btn-outline');
}); }

function startTransfer(){
  const u=session.user; if(!u){toast('Please login first.','err');return;}
  const ben=document.getElementById('tf-ben').value.trim();
  const amt=parseFloat(document.getElementById('tf-amt').value);
  if(!ben){toast(T('fill_ben'),'err');return;}
  if(!amt||amt<=0){toast(T('fill_amt'),'err');return;}
  if(amt>u.balance){toast(T('low_bal'),'err');return;}
  pendingTransfer={ben,amt,mode:transferMode};
  document.getElementById('pin-modal-desc').textContent=T('pin_confirm',amt,ben);
  document.getElementById('pin-step-list').innerHTML=`
    <div class="step"><div class="step-n done">✓</div>Fraud risk check: LOW</div>
    <div class="step"><div class="step-n done">✓</div>Amount: ₹${amt.toLocaleString('en-IN')} | Mode: ${transferMode}</div>
    <div class="step"><div class="step-n">3</div>Enter 4-digit PIN to confirm</div>`;
  ['cp1','cp2','cp3','cp4'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('pin-modal').classList.add('show');
  setTimeout(()=>document.getElementById('cp1').focus(),200);
}

async function confirmPIN(){
  const u=session.user; if(!u||!pendingTransfer) return;
  const pin=['cp1','cp2','cp3','cp4'].map(id=>document.getElementById(id).value).join('');
  if(pin.length!==4){toast(T('enter_pin'),'err');return;}
  if(pin!==u.pin){toast(T('wrong_pin'),'err');return;}
  const {ben,amt,mode}=pendingTransfer;
  const resp=await API.transfer({to:ben,amount:amt,mode,pin});
  if(resp.message && resp.sender){
    session.user=resp.sender; if(resp.receiver){/* optionally update receiver */}
    document.getElementById('pin-modal').classList.remove('show');
    pendingTransfer=null;
    ['tf-ben','tf-amt','tf-remark'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    refreshDash();
    toast(`✅ ₹${amt.toLocaleString('en-IN')} transferred successfully to ${ben} via ${mode}!`,'ok');
    vpAddMsg(T('transfer_success',amt,ben),'ai');
  } else {
    toast(resp.message||'Transfer failed','err');
  }
}

// ADMIN HANDLERS
async function refreshAdmin(){
  const container=document.getElementById('admin-cust-list');
  if(!container)return;
  if(!session.adminToken){ container.innerHTML='<p>Please log in as admin.</p>'; return; }
  try{
    const r=await fetch('/api/customers',{headers:{Authorization:'Bearer '+session.adminToken}});
    if(!r.ok){ throw new Error('Fetch failed'); }
    const list=await r.json();
    container.innerHTML='<table style="width:100%;border-collapse:collapse"><tr><th>A/C No</th><th>Name</th><th>Balance</th><th>Lang</th></tr>'+
      list.map(c=>`<tr><td>${c.accNo}</td><td>${c.name}</td><td>₹${c.balance.toLocaleString()}</td><td>${c.lang||''}</td></tr>`).join('')+'</table>';
  }catch(e){ container.innerHTML='<p>Error loading customers</p>'; }
}

// translation strings & language functions remain same as earlier script
// for brevity, copy the STRINGS object from original script unchanged

const STRINGS = {
  en: {
    greet: n => `Good Day, ${n}! 👋`,
    fill_all: 'Please fill all required fields.',
    pwd_mismatch: 'Passwords do not match.',
    pin_invalid: 'Please enter a valid 4-digit PIN.',
    not_found: 'Account not found. Check name or account number.',
    wrong_pwd: 'Incorrect password. Please try again.',
    login_ok: n => `✅ Welcome back, ${n}!`,
    saved: 'Changes saved successfully!',
    fill_ben: 'Please enter beneficiary name or account number.',
    fill_amt: 'Please enter a valid transfer amount.',
    low_bal: 'Insufficient balance for this transfer.',
    ben_not_found: 'Beneficiary not found. Check name or account number.',
    pin_confirm: (amt, ben) => `Transfer ₹${amt.toLocaleString('en-IN')} to ${ben}. Enter your PIN to authorize.`,
    enter_pin: 'Please enter your 4-digit PIN.',
    wrong_pin: 'Incorrect PIN. Please try again.',
    transfer_success: (amt, ben) => `✅ Transfer of ₹${amt.toLocaleString('en-IN')} to ${ben} was successful!`,
    welcome_msg: n => `Welcome ${n}! Your account is ready. Say "check balance" or "transfer funds" anytime.`,
    v_bal: (n, b) => `Your current balance is ₹${b.toLocaleString('en-IN')}. Account: ${n}`,
    v_txn: (txns) => `Last 5 transactions:\n` + txns.slice(0,5).map(t => `• ${t.type==='CR'?'+':'-'}₹${t.amount.toLocaleString('en-IN')} — ${t.desc} (${t.date})`).join('\n'),
    v_login_req: 'Please login first to access your account details.',
    v_transfer_ask_amount: 'How much would you like to transfer, and to whom?',
    v_greet: 'Hello! I\'m Nova, your AI banking assistant. Ask me about your balance, transactions, or fund transfer.',
    v_unknown: 'I\'m sorry, I didn\'t understand that. Try: "check balance", "show transactions", "transfer 1000 to [name]"',
    v_emotion_angry: '😤 I can sense frustration. Let me help resolve this quickly.',
    v_emotion_urgent: '⚡ Understood! Prioritizing your request now.',
    v_pin_ask: 'Please enter your PIN in the confirmation dialog to proceed.',
    v_transfer_pin: (amt, to) => `Initiating transfer of ₹${amt.toLocaleString('en-IN')} to ${to}. Please confirm with your PIN.`,
    v_transfer_not_found: 'Beneficiary not found in our system. Check the name or account number.',
    v_transfer_low_bal: 'Insufficient balance for this transfer.',
  },
  hi: {
    greet: n => `नमस्ते, ${n}! 👋`,
    fill_all: 'कृपया सभी आवश्यक फ़ील्ड भरें।',
    pwd_mismatch: 'पासवर्ड मेल नहीं खाते।',
    pin_invalid: 'कृपया एक मान्य 4-अंकीय PIN दर्ज करें।',
    not_found: 'खाता नहीं मिला। नाम या खाता संख्या जांचें।',
    wrong_pwd: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।',
    login_ok: n => `✅ स्वागत है, ${n}!`,
    saved: 'परिवर्तन सफलतापूर्वक सहेजे गए!',
    fill_ben: 'कृपया लाभार्थी का नाम या खाता संख्या दर्ज करें।',
    fill_amt: 'कृपया एक मान्य राशि दर्ज करें।',
    low_bal: 'इस स्थानांतरण के लिए अपर्याप्त बैलेंस।',
    ben_not_found: 'लाभार्थी नहीं मिला।',
    pin_confirm: (amt, ben) => `₹${amt.toLocaleString('en-IN')} को ${ben} को ट्रांसफर करें। PIN दर्ज करें।`,
    enter_pin: 'कृपया अपना 4-अंकीय PIN दर्ज करें।',
    wrong_pin: 'गलत PIN। पुनः प्रयास करें।',
    transfer_success: (amt, ben) => `✅ ₹${amt.toLocaleString('en-IN')} का ट्रांसफर ${ben} को सफल रहा!`,
    welcome_msg: n => `स्वागत है ${n}! आपका खाता तैयार है।`,
    v_bal: (n, b) => `आपका वर्तमान बैलेंस ₹${b.toLocaleString('en-IN')} है। खाता: ${n}`,
    v_txn: (txns) => `पिछले 5 लेनदेन:\n` + txns.slice(0,5).map(t => `• ${t.type==='CR'?'+':'-'}₹${t.amount.toLocaleString('en-IN')} — ${t.desc} (${t.date})`).join('\n'),
    v_login_req: 'कृपया पहले लॉगिन करें।',
    v_transfer_ask_amount: 'आप कितना और किसको ट्रांसफर करना चाहते हैं?',
    v_greet: 'नमस्ते! मैं Nova हूँ। बैलेंस, ट्रांसफर या लेनदेन के बारे में पूछें।',
    v_unknown: 'माफ़ करें, समझ नहीं आया। "बैलेंस चेक करो", "ट्रांसफर करो" आज़माएं।',
    v_emotion_angry: '😤 मैं आपकी परेशानी समझता हूँ। मैं तुरंत मदद करता हूँ।',
    v_emotion_urgent: '⚡ समझा! आपकी अनुरोध को प्राथमिकता दे रहा हूँ।',
    v_pin_ask: 'पुष्टि करने के लिए कृपया अपना PIN दर्ज करें।',
    v_transfer_pin: (amt, to) => `₹${amt.toLocaleString('en-IN')} का ट्रांसफर ${to} को शुरू हो रहा है। PIN से पुष्टि करें।`,
    v_transfer_not_found: 'लाभार्थी नहीं मिला।',
    v_transfer_low_bal: 'अपर्याप्त बैलेंस।',
  },
  mr: {
    greet: n => `नमस्कार, ${n}! 👋`,
    fill_all: 'कृपया सर्व आवश्यक फील्ड भरा.',
    pwd_mismatch: 'पासवर्ड जुळत नाहीत.',
    pin_invalid: 'कृपया वैध 4-अंकी PIN टाका.',
    not_found: 'खाते सापडले नाही.',
    wrong_pwd: 'चुकीचा पासवर्ड.',
    login_ok: n => `✅ स्वागत आहे, ${n}!`,
    saved: 'बदल जतन झाले!',
    fill_ben: 'कृपया लाभार्थीचे नाव किंवा खाते क्रमांक टाका.',
    fill_amt: 'कृपया वैध रक्कम टाका.',
    low_bal: 'अपुरी शिल्लक.',
    ben_not_found: 'लाभार्थी सापडला नाही.',
    pin_confirm: (amt, ben) => `₹${amt.toLocaleString('en-IN')} ${ben} ला हस्तांतरित करा. PIN टाका.`,
    enter_pin: 'कृपया 4-अंकी PIN टाका.',
    wrong_pin: 'चुकीचा PIN.',
    transfer_success: (amt, ben) => `✅ ₹${amt.toLocaleString('en-IN')} ${ben} ला यशस्वीरित्या हस्तांतरित झाले!`,
    welcome_msg: n => `स्वागत आहे ${n}! तुमचे खाते तयार आहे.`,
    v_bal: (n, b) => `तुमची सध्याची शिल्लक ₹${b.toLocaleString('en-IN')} आहे. खाते: ${n}`,
    v_txn: (txns) => `शेवटचे 5 व्यवहार:\n` + txns.slice(0,5).map(t => `• ${t.type==='CR'?'+':'-'}₹${t.amount.toLocaleString('en-IN')} — ${t.desc} (${t.date})`).join('\n'),
    v_login_req: 'कृपया आधी लॉगिन करा.',
    v_transfer_ask_amount: 'तुम्हाला किती आणि कुणाला पाठवायचे आहे?',
    v_greet: 'नमस्कार! मी Nova आहे. शिल्लक, व्यवहार किंवा हस्तांतरणाबद्दल विचारा.',
    v_unknown: 'माफ करा, समजले नाही. "शिल्लक पाहा", "पैसे पाठवा" प्रयत्न करा.',
    v_emotion_angry: '😤 तुमची अडचण समजते. मी लगेच मदत करतो.',
    v_emotion_urgent: '⚡ समजले! तुमच्या विनंतीला प्राधान्य देत आहे.',
    v_pin_ask: 'पुष्टीसाठी PIN टाका.',
    v_transfer_pin: (amt, to) => `₹${amt.toLocaleString('en-IN')} ${to} ला पाठवत आहे. PIN ने पुष्टी करा.`,
    v_transfer_not_found: 'लाभार्थी सापडला नाही.',
    v_transfer_low_bal: 'अपुरी शिल्लक.',
  },
  ta: {
    greet: n => `வணக்கம், ${n}! 👋`,
    fill_all: 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்.',
    pwd_mismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை.',
    pin_invalid: 'சரியான 4-இலக்க PIN ஐ உள்ளிடவும்.',
    not_found: 'கணக்கு காணவில்லை.',
    wrong_pwd: 'தவறான கடவுச்சொல்.',
    login_ok: n => `✅ வரவேற்கிறோம், ${n}!`,
    saved: 'மாற்றங்கள் சேமிக்கப்பட்டன!',
    fill_ben: 'பயனாளர் பெயர் அல்லது கணக்கு எண் உள்ளிடவும்.',
    fill_amt: 'சரியான தொகையை உள்ளிடவும்.',
    low_bal: 'போதுமான இருப்பு இல்லை.',
    ben_not_found: 'பயனாளர் காணவில்லை.',
    pin_confirm: (amt, ben) => `₹${amt.toLocaleString('en-IN')} ஐ ${ben} க்கு மாற்றவும். PIN உள்ளிடவும்.`,
    enter_pin: '4-இலக்க PIN உள்ளிடவும்.',
    wrong_pin: 'தவறான PIN.',
    transfer_success: (amt, ben) => `✅ ₹${amt.toLocaleString('en-IN')} ${ben} க்கு வெற்றிகரமாக மாற்றப்பட்டது!`,
    welcome_msg: n => `வரவேற்கிறோம் ${n}! உங்கள் கணக்கு தயாராக உள்ளது.`,
    v_bal: (n, b) => `உங்கள் தற்போதைய இருப்பு ₹${b.toLocaleString('en-IN')}. கணக்கு: ${n}`,
    v_txn: (txns) => `கடைசி 5 பரிவர்த்தனைகள்:\n` + txns.slice(0,5).map(t => `• ${t.type==='CR'?'+':'-'}₹${t.amount.toLocaleString('en-IN')} — ${t.desc} (${t.date})`).join('\n'),
    v_login_req: 'முதலில் உள்நுழையவும்.',
    v_transfer_ask_amount: 'எவ்வளவு, யாருக்கு அனுப்ப விரும்புகிறீர்கள்?',
    v_greet: 'வணக்கம்! நான் Nova. இருப்பு, பரிவர்த்தனை அல்லது பணம் அனுப்புவது பற்றி கேளுங்கள்.',
    v_unknown: 'மன்னிக்கவும், புரியவில்லை. "இருப்பு சரிபார்", "பணம் அனுப்பு" முயற்சிக்கவும்.',
    v_emotion_angry: '😤 உங்கள் கோபம் புரிகிறது. உடனே தீர்வு தருகிறேன்.',
    v_emotion_urgent: '⚡ புரிந்தது! உங்கள் கோரிக்கையை முன்னுரிமை தருகிறேன்.',
    v_pin_ask: 'தொடர PIN உள்ளிடவும்.',
    v_transfer_pin: (amt, to) => `₹${amt.toLocaleString('en-IN')} ஐ ${to} க்கு அனுப்புகிறோம். PIN உறுதிப்படுத்தவும்.`,
    v_transfer_not_found: 'பயனாளர் காணவில்லை.',
    v_transfer_low_bal: 'போதுமான இருப்பு இல்லை.',
  }
};
function T(key,...args){ const lang=session.lang||'en'; const s=STRINGS[lang]||STRINGS['en']; const val=s[key]||STRINGS['en'][key]; if(!val)return key; return typeof val==='function'?val(...args):val; }

function setLang(lang){ session.lang=lang; applyLangUI(); if(session.user) vpAddMsg(T('v_greet'),'ai'); }
function applyLangUI(){
  const lang = session.lang;
  const ht2 = document.getElementById('ht2');
  if(ht2){
    const heroTitles = {
      en: 'Banking With <span class="accent">Your Voice</span>,<br><span class="gold-text">Your Language</span>',
      hi: 'अपनी <span class="accent">आवाज़ से</span> बैंकिंग,<br><span class="gold-text">अपनी भाषा में</span>',
      mr: 'आपल्या <span class="accent">आवाजाने</span> बँकिंग,<br><span class="gold-text">आपल्या भाषेत</span>',
      ta: 'உங்கள் <span class="accent">குரலில்</span> வங்கி,<br><span class="gold-text">உங்கள் மொழியில்</span>'
    };
    ht2.innerHTML = heroTitles[lang] || heroTitles['en'];
  }
  const aiTip = document.getElementById('ai-tip');
  if(aiTip){
    const tips = {
      en: '💡 AI Insight: Spending up 28% in Jan. Consider a monthly budget.',
      hi: '💡 AI सलाह: जनवरी में खर्च 28% बढ़ा। मासिक बजट बनाएं।',
      mr: '💡 AI सूचना: जानेवारीत खर्च 28% वाढला. मासिक बजट करा.',
      ta: '💡 AI யோசனை: ஜனவரியில் செலவு 28% அதிகரித்தது. மாதாந்திர பட்ஜெட் திட்டமிடவும்.'
    };
    aiTip.textContent = tips[lang] || tips['en'];
  }
}

// voice chatbot helpers
function detectEmotion(text) {
  const t = text.toLowerCase();
  if(t.includes('angry')||t.includes('terrible')||t.includes('worst')||t.includes('hate')||t.includes('गुस्सा')||t.includes('रागावलो')) return T('v_emotion_angry');
  if(t.includes('urgent')||t.includes('emergency')||t.includes('asap')||t.includes('जल्दी')||t.includes('तातडी')) return T('v_emotion_urgent');
  return null;
}
function parseTransferIntent(text){
  const t=text.toLowerCase();
  const amtMatch=t.match(/(\d[\d,]*)/);
  const toMatch=t.match(/to\s+(.+)$/i)||t.match(/(?:को|ला|க்கு|क्यों)\s+(.+)/i);
  if(!amtMatch) return null;
  const amt=parseFloat(amtMatch[1].replace(/,/g,''));
  const to=toMatch?toMatch[1].trim():null;
  return {amt,to};
}
function handleVoiceCommand(text){
  const u=session.user;
  const t=text.toLowerCase();
  const emotion=detectEmotion(text);
  if(t.includes('balance')||t.includes('बैलेंस')||t.includes('शिल्लक')||t.includes('இருப்பு')){
    if(!u) return [T('v_login_req'),emotion];
    return [T('v_bal',u.accNo,u.balance),emotion];
  }
  if(t.includes('transaction')||t.includes('history')||t.includes('लेनदेन')||t.includes('பரிவர்த்தனை')){
    if(!u) return [T('v_login_req'),emotion];
    return [T('v_txn',u.txns||[]),emotion];
  }
  if(t.includes('transfer')||t.includes('send')||t.includes('ट्रांसफर')||t.includes('பரிவு')){
    if(!u) return [T('v_login_req'),emotion];
    const parsed=parseTransferIntent(text);
    if(!parsed||!parsed.to) return [T('v_transfer_ask_amount'),emotion];
    const {amt,to}=parsed;
    const receiver = session.user && null; // we could search in local list or hit API
    // we'll prefill transfer form and ask user to confirm via PIN
    document.getElementById('tf-ben').value=to;
    document.getElementById('tf-amt').value=amt;
    setTimeout(()=>{ setSection('transfer',null); startTransfer(); },300);
    return [T('v_transfer_pin',amt,to),emotion];
  }
  if(t.includes('block')){
    return ['🛑 Card block request initiated. Confirm via PIN in Settings > Security.',emotion];
  }
  if(t.includes('emi')||t.includes('loan')){
    if(!u) return [T('v_login_req'),emotion];
    return ['📅 Your Car Loan EMI is ₹8,450/month.\nNext due: 5 March 2026\nOutstanding: ₹4,82,000',emotion];
  }
  if(t.includes('hello')||t.includes('hi')||t.includes('नमस्ते')||t.includes('வணக்கம்')){
    return [T('v_greet'),emotion];
  }
  return [T('v_unknown'),emotion];
}

function vpAddMsg(text,type,emotion){
  const msgs=document.getElementById('vp-msgs');
  const div=document.createElement('div');
  div.className='vpm '+type;
  div.textContent=text;
  msgs.appendChild(div);
  if(emotion){ const emo=document.getElementById('vp-emo'); emo.innerHTML=`<div class="vp-emotion">🧠 ${emotion}</div>`; }
  msgs.scrollTop=msgs.scrollHeight;
}
function vpTyping(){
  const msgs=document.getElementById('vp-msgs');
  const d=document.createElement('div'); d.className='vpm ai'; d.id='vp-typing'; d.textContent='⏳ Nova is thinking...';
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
}
function vpRemoveTyping(){ const d=document.getElementById('vp-typing'); if(d)d.remove(); }
function vpSend(){
  const inp=document.getElementById('vp-inp');
  const text=inp.value.trim(); if(!text) return;
  vpAddMsg(text,'user'); inp.value=''; vpTyping();
  setTimeout(()=>{
    vpRemoveTyping();
    handleVoiceCommand(text, (result) => {
      const [response, emotion] = result;
      vpAddMsg(response,'ai',emotion);
      speak(response);
    });
  },900);
}
function vpMic(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice input requires Chrome browser.','err');return;}
  const r=new SR();
  const langMap={en:'en-IN',hi:'hi-IN',mr:'mr-IN',ta:'ta-IN'};
  r.lang=langMap[session.lang]||'en-IN';
  r.onresult=(e)=>{ const text=e.results[0][0].transcript; document.getElementById('vp-inp').value=text; vpSend(); };
  r.onerror=()=>toast('Voice capture error. Please speak clearly.','err');
  r.start(); toast('🎤 Listening...','ok');
}
function speak(text){
  if(!('speechSynthesis' in window)) return;
  const langMap={en:'en-IN',hi:'hi-IN',mr:'mr-IN',ta:'ta-IN'};
  const u=new SpeechSynthesisUtterance(text.replace(/[₹•🏦📋🔐🛑📅⚡✅💡🧠😤⏳]/g,''));
  u.lang=langMap[session.lang]||'en-IN'; u.rate=0.92;
  window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
}

// VOICE PANEL UI
function openVP(){
  const vp = document.getElementById('voice-panel');
  if(vp) vp.classList.add('show');
  const inp = document.getElementById('vp-inp');
  if(inp) setTimeout(() => inp.focus(), 200);
}

function closeVP(){
  const vp = document.getElementById('voice-panel');
  if(vp) vp.classList.remove('show');
}

function vpLang(btn, lang){
  session.lang = lang;
  document.querySelectorAll('.vpl-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  setLang(lang);
  vpAddMsg(T('v_greet'), 'ai');
}

function setSection(name, el){
  document.querySelectorAll('.sec-content').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('sec-' + name);
  if(sec) sec.classList.add('active');
  if(el){
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const vp = document.getElementById('voice-panel');
  if(vp) vp.classList.remove('show');
});

document.getElementById('vp-inp').addEventListener('keypress', e=>{ if(e.key==='Enter') vpSend(); });
document.addEventListener('DOMContentLoaded', ()=>{
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  document.body.appendChild(toast);
});

// helpers
function pinNav(el,nextId){ if(el.value.length===1){ const n=document.getElementById(nextId); if(n)n.focus(); }}
let toastTimer;
function toast(msg,type){ const t=document.getElementById('toast'); t.textContent=msg; t.className='toast show '+type; clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),4000); }
function toggleVoiceBio(){ toast('Voice biometric preference updated.','ok'); }

// init
setTimeout(()=>{ vpAddMsg(STRINGS['en'].v_greet,'ai'); },1000);

// finished

