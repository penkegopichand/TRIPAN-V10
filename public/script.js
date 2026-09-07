let destinations=[], currentFilter="all", currentLang=localStorage.getItem("tripanLanguage")||"en";

const $=id=>document.getElementById(id);
const toast=(msg)=>{const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)};

async function api(url,options){const r=await fetch(url,options);let data={};try{data=await r.json()}catch(e){}if(!r.ok)throw new Error(data.error||"Request failed");return data}

async function init(){
  await loadLocalizedData();
  setDateDefaults();
  applyUI();
  renderSaved();
  setupPlannerInputs();
}
const uiI18n={en:{home:"Home",explore:"Explore",plan:"Plan My Trip",services:"Services",myTrips:"My Trips",smartTourism:"SMART TOURISM • INDIA",travelSmarter:"Travel smarter.",experienceMore:"Experience more.",exploreDestinations:"Explore destinations",planPerfectTrip:"Plan your perfect trip",tripPreferences:"Trip preferences",destination:"Destination",departureDate:"Departure date",dateHint:"Choose the day you actually start your trip. Return date is calculated from trip length.",numberOfDays:"Number of days",budget:"Budget (₹ per person)",travelling:"Who is travelling?",interests:"Interests",selectAll:"Select all that apply",generate:"✨ Generate my itinerary",everything:"Everything you need on the road",myTripsTitle:"My Trips",yourJourneys:"YOUR JOURNEYS",travelEssentials:"TRAVEL ESSENTIALS",destinations:"Destinations",pace:"Trip pace",stay:"Stay style",hotelDesc:"Browse stays by destination, price and rating.",restaurantDesc:"Discover local cuisines and places to eat.",transportDesc:"Understand the best ways to move around.",emergencyDesc:"Quick access to important safety resources.",favoriteDesc:"Your saved destinations in one place.",feedbackDesc:"Help us improve TRIPAN for travelers.",adminDesc:"SIH demo dashboard for platform analytics.",exploreStays:"Explore stays →",findFood:"Find food →",seeOptions:"See options →",getHelp:"Get help →",viewFavorites:"View favorites →",shareFeedback:"Share feedback →",openDashboard:"Open dashboard →"},te:{home:"హోమ్",explore:"ప్రదేశాలు",plan:"నా ట్రిప్ ప్లాన్",services:"సేవలు",myTrips:"నా ట్రిప్స్",smartTourism:"స్మార్ట్ టూరిజం • ఇండియా",travelSmarter:"తెలివిగా ప్రయాణించండి.",experienceMore:"మరింత అనుభవించండి.",exploreDestinations:"ప్రదేశాలను అన్వేషించండి",planPerfectTrip:"మీ పర్ఫెక్ట్ ట్రిప్ ప్లాన్ చేసుకోండి",tripPreferences:"ట్రిప్ ఎంపికలు",destination:"గమ్యస్థానం",departureDate:"ప్రయాణ తేదీ",dateHint:"మీరు నిజంగా ట్రిప్ ప్రారంభించే రోజును ఎంచుకోండి. ట్రిప్ రోజుల ఆధారంగా తిరుగు తేదీ లెక్కించబడుతుంది.",numberOfDays:"ఎన్ని రోజులు",budget:"బడ్జెట్ (₹)",travelling:"ఎవరు ప్రయాణిస్తున్నారు?",interests:"ఆసక్తులు",selectAll:"అవసరమైనవన్నీ ఎంచుకోండి",generate:"✨ నా ట్రిప్ ప్లాన్ చేయండి",everything:"ప్రయాణంలో మీకు కావాల్సిన ప్రతిదీ",myTripsTitle:"నా ట్రిప్స్",yourJourneys:"మీ ప్రయాణాలు",travelEssentials:"ప్రయాణ అవసరాలు",destinations:"ప్రదేశాలు",pace:"ట్రిప్ వేగం",stay:"స్టే రకం",hotelDesc:"ప్రదేశం, ధర మరియు రేటింగ్ ఆధారంగా స్టేలను చూడండి.",restaurantDesc:"స్థానిక వంటకాలు మరియు రెస్టారెంట్లను కనుగొనండి.",transportDesc:"ప్రాంతంలో తిరగడానికి ఉత్తమ మార్గాలను తెలుసుకోండి.",emergencyDesc:"ముఖ్యమైన భద్రతా సహాయ వనరులకు త్వరిత ప్రాప్తి.",favoriteDesc:"మీరు సేవ్ చేసిన ప్రదేశాలన్నీ ఒకే చోట.",feedbackDesc:"ప్రయాణికుల కోసం TRIPANను మెరుగుపరచడానికి సహాయం చేయండి.",adminDesc:"ప్లాట్‌ఫారమ్ విశ్లేషణ కోసం SIH డెమో డ్యాష్‌బోర్డ్.",exploreStays:"స్టేలను చూడండి →",findFood:"ఆహారం కనుగొనండి →",seeOptions:"ఎంపికలు చూడండి →",getHelp:"సహాయం పొందండి →",viewFavorites:"ఫేవరెట్లను చూడండి →",shareFeedback:"ఫీడ్‌బ్యాక్ ఇవ్వండి →",openDashboard:"డ్యాష్‌బోర్డ్ తెరవండి →"},hi:{home:"होम",explore:"घूमें",plan:"मेरी यात्रा",services:"सेवाएं",myTrips:"मेरी यात्राएं",smartTourism:"स्मार्ट टूरिज़्म • इंडिया",travelSmarter:"स्मार्ट तरीके से यात्रा करें।",experienceMore:"और अधिक अनुभव करें।",exploreDestinations:"गंतव्य खोजें",planPerfectTrip:"अपनी सही यात्रा की योजना बनाएं",tripPreferences:"यात्रा विकल्प",destination:"गंतव्य",departureDate:"प्रस्थान की तारीख",dateHint:"वह दिन चुनें जब आप वास्तव में यात्रा शुरू करेंगे। वापसी की तारीख यात्रा की अवधि से निकलेगी।",numberOfDays:"कितने दिन",budget:"बजट (₹ प्रति व्यक्ति)",travelling:"कौन यात्रा कर रहा है?",interests:"रुचियाँ",selectAll:"जो लागू हों सभी चुनें",generate:"✨ मेरी यात्रा बनाएं",everything:"यात्रा में आपकी हर ज़रूरत",myTripsTitle:"मेरी यात्राएं",yourJourneys:"आपकी यात्राएं",travelEssentials:"यात्रा की ज़रूरतें",destinations:"गंतव्य",pace:"यात्रा की गति",stay:"ठहरने का प्रकार",hotelDesc:"गंतव्य, कीमत और रेटिंग के अनुसार ठहरने की जगह देखें।",restaurantDesc:"स्थानीय व्यंजन और रेस्तरां खोजें।",transportDesc:"स्थानीय यात्रा के सर्वोत्तम विकल्प जानें।",emergencyDesc:"महत्वपूर्ण सुरक्षा सेवाओं तक तेज़ पहुँच।",favoriteDesc:"आपके सेव किए हुए गंतव्य एक जगह।",feedbackDesc:"यात्रियों के लिए TRIPAN बेहतर बनाने में मदद करें।",adminDesc:"प्लेटफ़ॉर्म विश्लेषण के लिए SIH डेमो डैशबोर्ड।",exploreStays:"स्टे देखें →",findFood:"खाना खोजें →",seeOptions:"विकल्प देखें →",getHelp:"मदद लें →",viewFavorites:"पसंदीदा देखें →",shareFeedback:"फीडबैक दें →",openDashboard:"डैशबोर्ड खोलें →"}};
const valueI18n={te:{Solo:"ఒంటరిగా",Couple:"జంట",Family:"కుటుంబం",Friends:"స్నేహితులు",Relaxed:"విశ్రాంతి",Balanced:"సమతుల్యం",Packed:"ఫాస్ట్",Budget:"బడ్జెట్","Mid-range":"మధ్యస్థం",Premium:"ప్రీమియం",Beach:"బీచ్",Nature:"ప్రకృతి",Heritage:"వారసత్వం",Adventure:"అడ్వెంచర్",Culture:"సంస్కృతి",Food:"ఆహారం"},hi:{Solo:"अकेले",Couple:"जोड़ी",Family:"परिवार",Friends:"दोस्त",Relaxed:"आरामदायक",Balanced:"संतुलित",Packed:"तेज़",Budget:"बजट","Mid-range":"मिड-रेंज",Premium:"प्रीमियम",Beach:"समुद्र तट",Nature:"प्रकृति",Heritage:"विरासत",Adventure:"एडवेंचर",Culture:"संस्कृति",Food:"भोजन"}};
async function loadLocalizedData(){destinations=await api("/api/destinations?lang="+encodeURIComponent(currentLang));renderDestCards("homeDestinations",destinations.slice(0,6));renderExplore();const selected=$("planDestination")?.value;$("planDestination").innerHTML=destinations.map(d=>`<option value="${d.id}">${d.name}, ${d.state}</option>`).join("");if(selected&&destinations.some(d=>d.id===selected))$("planDestination").value=selected;$("destinationCount").textContent=destinations.length+"+"}
function applyUI(){const t=uiI18n[currentLang]||uiI18n.en;document.querySelectorAll("[data-i18n]").forEach(el=>{const k=el.dataset.i18n;if(t[k])el.textContent=t[k]});const base={Solo:"Solo",Couple:"Couple",Family:"Family",Friends:"Friends",Relaxed:"Relaxed",Balanced:"Balanced",Packed:"Packed",Budget:"Budget",["Mid-range"]:"Mid-range",Premium:"Premium"};document.querySelectorAll("#travellers option,#pace option,#stay option").forEach(el=>{const key=el.value;el.textContent=(valueI18n[currentLang]?.[key]||base[key]||key)});const interests={Beach:"🏖️ Beach",Nature:"🌿 Nature",Heritage:"🏛️ Heritage",Adventure:"🧗 Adventure",Culture:"🎭 Culture",Food:"🍛 Food"};document.querySelectorAll(".interest-grid .check").forEach(label=>{const input=label.querySelector("input");if(input)label.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent=" "+(valueI18n[currentLang]?.[input.value]||interests[input.value]||input.value)})});$("language").value=currentLang}
function setDateDefaults(){const input=$("startDate");if(!input)return;const today=new Date();today.setHours(0,0,0,0);const tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);input.min=today.toISOString().slice(0,10);if(!input.value)input.value=tomorrow.toISOString().slice(0,10);updateDateSummary();input.addEventListener("change",updateDateSummary);$("days").addEventListener("input",updateDateSummary)}
function updateDateSummary(){const start=$("startDate")?.value,days=+$("days")?.value||1,box=$("dateSummary");if(!start||!box)return;const d=new Date(start+"T12:00:00"),end=new Date(d);end.setDate(end.getDate()+days-1);const opts={day:"numeric",month:"short",year:"numeric"};box.textContent=`${d.toLocaleDateString(currentLang+"-IN",opts)} → ${end.toLocaleDateString(currentLang+"-IN",opts)}`}
function setupPlannerInputs(){
  const type=$("travellers"), count=$("travellerCount");
  if(type && count && !type.dataset.bound){
    type.dataset.bound="1";
    type.addEventListener("change",()=>{
      const defaults={Solo:1,Couple:2,Friends:3,Family:4};
      count.value=defaults[type.value]||1;
      updateBudgetHint();
    });
  }
  ["planDestination","days","budget","travellerCount","pace","stay"].forEach(id=>{
    const el=$(id); if(el && !el.dataset.budgetBound){el.dataset.budgetBound="1";el.addEventListener("input",updateBudgetHint);el.addEventListener("change",updateBudgetHint);}
  });
  updateBudgetHint();
}
function updateBudgetHint(){
  const box=$("budgetHint"); if(!box)return;
  const days=Math.min(Math.max(Number($("days")?.value)||1,1),7);
  const people=Math.min(Math.max(Number($("travellerCount")?.value)||1,1),10);
  const stay=$("stay")?.value||"Mid-range";
  const pace=$("pace")?.value||"Balanced";
  const rates={Budget:1450,"Mid-range":2550,Premium:5650};
  const paceFactor={Relaxed:.92,Balanced:1,Packed:1.12}[pace]||1;
  const nights=Math.max(days-1,0);
  const minPerPerson=Math.round(((rates[stay]||2550)*Math.max(days,1)*paceFactor*0.70));
  const comfortablePerPerson=Math.round(((rates[stay]||2550)*Math.max(days,1)*paceFactor));
  box.innerHTML=`Recommended starting range: <b>₹${minPerPerson.toLocaleString()}–₹${comfortablePerPerson.toLocaleString()}</b> per person for ${days} day${days>1?"s":""}. ${people>1?`Party total budget at your entered amount: <b>₹${(Math.max(Number($("budget")?.value)||0,0)*people).toLocaleString()}</b>.`:""}`;
}
function peopleLabel(n){return `${Number(n)||1} ${Number(n)===1?"person":"people"}`}
function showPage(id){
  if(id==="plan" && !getToken()){ openModal("login","plan"); toast("Login is required to plan a trip."); return; }
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  $(id).classList.add("active"); window.scrollTo({top:0,behavior:"smooth"});
  if(id==="explore")renderExplore(); if(id==="mytrips")renderSaved();
}
function destinationLabel(id){const d=destinations.find(x=>x.id===id);return d?d.name:id}
function safeImage(url){
  return String(url||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function renderDestCards(target,list){
  $(target).innerHTML=list.map(d=>`<article class="dest-card" onclick="openDestination('${d.id}')">
    <div class="dest-image"><img src="${safeImage(d.image)}" alt="${safeImage(d.name)}" loading="lazy" onerror="this.onerror=null;this.src='/destination-fallback.svg';"><span class="dest-emoji">${d.emoji}</span></div>
    <div class="dest-body"><span class="rating">★ ${d.rating}</span><h3>${d.name}</h3><small>${d.state}</small><p>${d.description}</p><div class="tags">${d.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div></div>
  </article>`).join("");
}
function renderExplore(){
  const q=($("searchDest")?.value||"").trim().toLowerCase();

  const list=destinations.filter(d=>{
    const searchable=[d.name,d.state,d.description,...(Array.isArray(d.tags)?d.tags:[])].join(" ").toLowerCase();
    const matchesSearch=!q||searchable.includes(q);
    const tags=Array.isArray(d.tags)?d.tags:[];
    const matchesFilter=currentFilter==="all"||
      tags.some(tag=>String(tag).trim().toLowerCase()===String(currentFilter).trim().toLowerCase());

    return matchesFilter&&matchesSearch;
  });

  const grid=$("exploreGrid");
  if(!grid)return;

  if(!list.length){
    grid.innerHTML=`<div class="empty-state">
      <div class="empty-state-icon">🔎</div>
      <h3>No destinations found</h3>
      <p>Try another category or search term.</p>
    </div>`;
    return;
  }

  renderDestCards("exploreGrid",list);
}
function filterDest(f,el){currentFilter=f;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));el.classList.add("active");renderExplore()}

async function openDestination(id){
  const d=await api("/api/destinations/"+id+"?lang="+encodeURIComponent(currentLang)); showPage("destination");
  $("destinationDetail").innerHTML=`
  <button class="back" onclick="showPage('explore')">← Back to Explore</button>
  <div class="detail-hero" style="background-image:linear-gradient(rgba(7,20,15,.05),rgba(7,20,15,.05)),url('${safeImage(d.image)}')"><div class="detail-copy"><span class="eyebrow" style="color:#c7f36b">${d.state.toUpperCase()}</span><h1 data-id="${d.id}">${d.emoji} ${d.name}</h1><p>${d.description}</p></div></div>
  <div class="detail-section"><div class="section-head"><div><span class="eyebrow">TOP EXPERIENCES</span><h2>Places to explore</h2></div><div class="detail-actions"><button class="btn btn-outline" data-active="0" onclick="toggleFavorite('${d.id}',this)">♡ Save</button><button class="btn btn-primary" onclick="setPlan('${d.id}')">Plan this trip →</button></div></div>
  <div class="place-grid">${(d.places||[]).map(p=>`<div class="place-card">
    <div class="icon">${p.emoji||"📍"}</div>
    <h3>${p.name||"Unnamed place"}</h3>
    <p>${p.description||"Explore this attraction."}</p>
    <span class="tag">${p.category||"Attraction"}</span>
  </div>`).join("")}</div></div>`;
}
function setPlan(id){$("planDestination").value=id;showPage("plan");toast("Destination selected — customize your trip.")}

let plannerMap=null;
function initMap(lat,lng,name){
  const el=$("plannerMap"); if(!el||typeof L==="undefined")return;
  if(plannerMap){plannerMap.remove();plannerMap=null}
  plannerMap=L.map(el).setView([lat,lng],11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(plannerMap);
  L.marker([lat,lng]).addTo(plannerMap).bindPopup(`<b>${name}</b><br>TRIPAN destination centre`).openPopup();
  L.circle([lat,lng],{radius:12000,fillOpacity:.08,weight:1}).addTo(plannerMap);
}
async function loadWeather(id,selectedDate,days=5){
  const panel=$("weatherPanel"),status=$("weatherStatus");
  panel.innerHTML=`<div class="weather-placeholder">Loading live forecast…</div>`;status.textContent="Loading live data";
  try{
    const d=await api(`/api/weather/${id}?startDate=${encodeURIComponent(selectedDate||"")}&days=${Math.min(Math.max(Number(days)||5,1),7)}`);
    status.textContent="Live • Open-Meteo";
    const list=d.forecast.slice(0,Math.min(Number(days)||5,7));
    panel.innerHTML=list.map((w,i)=>`<div class="weather-day"><small>${selectedDate&&w.date===selectedDate?"Trip day 1":`Day ${i+1} • `+new Date(w.date).toLocaleDateString(currentLang+"-IN",{weekday:"short",day:"numeric",month:"short"})}</small><b>${w.max}° / ${w.min}°</b><span>${weatherIcon(w.code)} ${localCondition(w.condition)}</span><em>💧 ${w.rainChance}% rain</em></div>`).join("");
    initMap(d.coordinates.lat,d.coordinates.lng,d.destination);
    return d;
  }catch(e){status.textContent="Weather unavailable";panel.innerHTML=`<div class="weather-placeholder">Live weather is temporarily unavailable. Your itinerary can still be generated using destination data.</div>`;return null}
}
function weatherIcon(code){if([0,1].includes(code))return"☀️";if([2,3].includes(code))return"⛅";if([45,48].includes(code))return"🌫️";if([51,53,55,61,63,65,80,81,82].includes(code))return"🌧️";if([95,96,99].includes(code))return"⛈️";return"🌦️"}function localCondition(c){const m={te:{Clear:"స్పష్టమైన ఆకాశం",Cloudy:"మేఘావృతం",Fog:"పొగమంచు",Rain:"వర్షం",Thunderstorm:"ఉరుములతో వర్షం",Mixed:"మిశ్రమ వాతావరణం"},hi:{Clear:"साफ़",Cloudy:"बादल",Fog:"कोहरा",Rain:"बारिश",Thunderstorm:"गरज के साथ बारिश",Mixed:"मिश्रित मौसम"}};return m[currentLang]?.[c]||c}
function formatDate(v){if(!v)return "";return new Date(v+"T12:00:00").toLocaleDateString(currentLang+"-IN",{day:"numeric",month:"short",year:"numeric"})}
async function generateTrip(){
  const destination=$("planDestination").value,days=Math.min(Math.max(+$('days').value||1,1),7),budget=Math.max(+$('budget').value||0,0),startDate=$("startDate").value,travellers=$("travellers").value,travellerCount=Math.min(Math.max(+$("travellerCount").value||1,1),10),pace=$("pace").value,stay=$("stay").value;
  const interests=[...document.querySelectorAll(".interest-grid input:checked")].map(x=>x.value);
  if(!startDate){toast("Please choose your departure date.");return}
  const chosen=new Date(startDate+"T12:00:00"),today=new Date();today.setHours(0,0,0,0);
  if(chosen<today){toast("Departure date cannot be in the past.");$("startDate").classList.add("date-input-invalid");return}else{$("startDate").classList.remove("date-input-invalid")}
  if(budget<1000){toast("Please set a budget of at least ₹1,000.");$("budget").focus();return}

  const button=document.querySelector('.planner-form .btn-primary.full');
  const originalText=button?.textContent||"✨ Generate my itinerary";
  if(button){button.disabled=true;button.textContent="⏳ Building your smart plan…"}
  $("itinerary").innerHTML=`<div class="planner-loading"><div class="loading-orb">✦</div><h3>Building your ${days}-day itinerary</h3><p>Combining your interests, budget, destination highlights and live weather.</p><div class="loading-steps"><span>✓ Trip preferences</span><span>⏳ Weather forecast</span><span>○ Daily route</span></div></div>`;
  try{
    await loadWeather(destination,startDate,days);
    const data=await api("/api/itinerary",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination,days,budget,interests,travellers,pace,stay,startDate,language:currentLang,travellerCount})});
    const rainDays=Number(data.rainDays||0);
    const weatherBanner=data.weatherAware?`<div class="weather-banner"><div class="weather-banner-icon">🌦️</div><div><b>${currentLang==="te"?"వాతావరణానికి అనుగుణమైన ప్లాన్":currentLang==="hi"?"मौसम के अनुसार योजना":"Weather-aware plan"}</b><span>${rainDays?(currentLang==="te"?`${rainDays} రోజుల్లో వర్షం అవకాశం ఎక్కువగా ఉంది, కాబట్టి TRIPAN బయటి కార్యకలాపాలను సర్దుబాటు చేసింది.`:currentLang==="hi"?`${rainDays} दिनों में बारिश की संभावना अधिक है, इसलिए TRIPAN ने बाहरी गतिविधियाँ बदली हैं.`:`${rainDays} day(s) have higher rain probability, so TRIPAN adjusted outdoor activities.`):(currentLang==="te"?"ఎంచుకున్న రోజుల్లో అధిక వర్షపు అవకాశం కనిపించలేదు.":currentLang==="hi"?"चुने गए दिनों में अधिक बारिश की संभावना नहीं मिली।":"No high-rain days detected in the selected trip window.")}</span></div></div>`:"";
    const interestSummary=interests.length?interests.join(" • "):"Mixed interests";
    const aiBadge=`<span class="ai-badge">✦ TRIPAN Smart Planner</span>`;
    const aiSummary=`<div class="ai-summary"><div class="ai-summary-icon">🧠</div><div><b>Personalized by TRIPAN</b><p>Built from your selected interests, pace, stay style, verified destination places and live weather.</p><small>The planner prioritizes fresh places across days and adapts outdoor activities when rain is likely.</small></div></div>`;
    let html=`<div class="trip-head"><div><span class="eyebrow">YOUR SMART PLAN</span><div class="plan-title-row"><h2>${data.destination}</h2>${aiBadge}</div><p class="trip-subtitle">A practical route built around ${interestSummary.toLowerCase()}.</p></div><button class="btn btn-outline" onclick='saveTrip(${JSON.stringify(data)})'>♡ Save trip</button></div>
    <div class="trip-meta"><span class="meta">📅 ${formatDate(data.startDate)} → ${formatDate(data.endDate)}</span><span class="meta">🗓️ ${data.days} days</span><span class="meta">💰 ₹${Number(data.budget||0).toLocaleString()} / person</span><span class="meta">📊 ~₹${Number(data.estimatedDailySpend||0).toLocaleString()}/person/day</span><span class="meta">🏃 ${data.pace||pace}</span><span class="meta"> ${data.stay||stay}</span><span class="meta">👥 ${data.travellers||travellers} • ${peopleLabel(data.travellerCount||travellerCount)}</span></div>${weatherBanner}${aiSummary}
    <div class="plan-summary"><div><span>🗓️</span><b>${data.days} days</b><small>Trip length</small></div><div><span>⏱️</span><b>${data.itinerary.reduce((n,d)=>n+Number(d.totalHours||0),0).toFixed(1)} hrs</b><small>Planned activities</small></div><div><span>💰</span><b>₹${Number(data.totalBudget||0).toLocaleString()}</b><small>Total budget • party</small></div><div><span>📊</span><b>₹${Number(data.estimatedPerPersonSpend||0).toLocaleString()}</b><small>Estimated • person</small></div></div>
    ${data.budgetWarning?`<div class="budget-warning ${data.budgetWarning.level}"><span>${data.budgetWarning.level==="ok"?"✅":data.budgetWarning.level==="warning"?"⚠️":"🚨"}</span><div><b>${data.budgetWarning.status==="within"?"Budget looks workable":data.budgetWarning.status==="tight"?"Budget is tight":"Budget may be too low"}</b><p>${data.budgetWarning.message}</p></div></div>`:""}
    <div class="budget-guide"><div><span class="eyebrow">BUDGET GUIDE</span><h4>Estimated local-trip cost</h4><p>Calculated from the places selected, verified attraction fees, ${data.stay||stay} stay, ${data.pace||pace} pace, food, local transport and a 10% safety buffer. Your entered budget is per person.</p></div><div class="budget-guide-grid"><span>🏨 Stay <b>₹${Math.round((data.itinerary||[]).reduce((n,d)=>n+Number(d.budgetAllocation?.stay||0),0)/Math.max(data.travellerCount||1,1)).toLocaleString()}</b></span><span>🍛 Food <b>₹${Math.round((data.itinerary||[]).reduce((n,d)=>n+Number(d.budgetAllocation?.food||0),0)/Math.max(data.travellerCount||1,1)).toLocaleString()}</b></span><span>🚌 Local travel <b>₹${Math.round((data.itinerary||[]).reduce((n,d)=>n+Number(d.budgetAllocation?.transport||0),0)/Math.max(data.travellerCount||1,1)).toLocaleString()}</b></span><span>🎟️ Entry + activities <b>₹${Math.round((data.itinerary||[]).reduce((n,d)=>n+Number(d.budgetAllocation?.activities||0),0)/Math.max(data.travellerCount||1,1)).toLocaleString()}</b></span><span>🛟 Buffer <b>₹${Math.round((data.itinerary||[]).reduce((n,d)=>n+Number(d.budgetAllocation?.buffer||0),0)/Math.max(data.travellerCount||1,1)).toLocaleString()}</b></span></div></div>`;
    html+=`<div class="itinerary-title"><div><span class="eyebrow">DAY-BY-DAY ROUTE</span><h3>Your trip at a glance</h3></div><span class="route-note">${data.itinerary.length} days • morning → afternoon → evening</span></div>`;
    html+=`<div class="day-list">${data.itinerary.map(day=>`<article class="day-card"><div class="day-card-head"><div class="day-number">${day.day}</div><div><span class="eyebrow">DAY ${day.day}</span><h3>${day.dateLabel||formatDate(day.date)}</h3><p class="day-theme">${day.theme||"Personalized route"}</p></div><div class="day-spend">₹${Number(day.estimatedSpend||0).toLocaleString()}<small>day total • ₹${Number(day.estimatedSpendPerPerson||0).toLocaleString()} / person</small></div></div>${day.weather?`<div class="day-weather"><span>${weatherIcon(day.weather.code)}</span><b>${localCondition(day.weather.condition)}</b><span>${day.weather.max}° / ${day.weather.min}°C</span><span>💧 ${day.weather.rainChance}% rain</span></div>`:`<div class="day-weather muted">Weather data unavailable</div>`}<div class="day-timeline">${day.items.map((x,idx)=>`<div class="time-item rich"><div class="time-dot">${x.icon||"📍"}</div><div class="time-block"><span class="time">${x.time} • ${x.period}</span><b>${x.place}</b><small>${x.note}</small><div class="item-meta"><span>⏱️ ${x.durationHours}h</span><span>${x.category}</span><span>${Number(x.estimatedCost||0)>0?`🎟️ ₹${Number(x.estimatedCost).toLocaleString()} entry`:"🆓 Free entry"}</span></div></div></div>`).join("")}</div><div class="day-footer"><span>⏱️ ${day.totalHours} hrs planned</span><span>🎟️ Entry fees: ₹${Number(day.activityFees||0).toLocaleString()} party total</span><span>🍛 Food ₹${Number(day.budgetAllocation?.food||0).toLocaleString()} • 🚌 Local ₹${Number(day.budgetAllocation?.transport||0).toLocaleString()} • 🛟 Buffer ₹${Number(day.budgetAllocation?.buffer||0).toLocaleString()}</span></div></article>`).join("")}</div>`;
    html+=`<div class="planner-note"><div class="planner-note-icon">🧠</div><div><b>${"Why this plan is smart"}</b><p>${"TRIPAN builds the route from verified destination places, your preferences, budget context and the live forecast. No external generative AI is required."}</p></div></div>`;
    $("itinerary").innerHTML=html;
    loadRecommendations();
    toast("Your full day-by-day itinerary is ready! ✨");
  }catch(e){
    console.error("generateTrip:",e);
    $("itinerary").innerHTML=`<div class="empty error-empty"><div class="empty-icon">⚠️</div><h3>We couldn't build the itinerary</h3><p>${e.message||"Please check the destination and try again."}</p><button class="btn btn-primary" onclick="generateTrip()">Try again</button></div>`;
    toast(e.message||"Could not generate itinerary.");
  }finally{
    if(button){button.disabled=false;button.textContent=originalText}
  }
}

function getToken(){return localStorage.getItem("tripanToken")||""}
function getUser(){try{return JSON.parse(localStorage.getItem("tripanUserData")||"null")}catch(e){return null}}
function authHeaders(){const t=getToken();return t?{"Authorization":"Bearer "+t,"Content-Type":"application/json"}:{"Content-Type":"application/json"}}


async function loadRecommendations(){
 const box=$("recommendationPanel"); if(!box)return;
 const destination=$("planDestination").value,days=+$("days").value,budget=+$("budget").value;
 const interests=[...document.querySelectorAll(".interest-grid input:checked")].map(x=>x.value),travellers=$("travellers").value;
 box.innerHTML=`<div class="loading-card">🧠 Finding the best matches for you…</div>`;
 try{const d=await api("/api/recommendations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({destination,days,budget,interests,travellers,language:currentLang})});
 box.innerHTML=`<div class="recommend-head"><span class="eyebrow">PERSONALIZED</span><h3>🧠 Recommended for you</h3><p>${d.reason}</p></div><div class="recommend-grid">${d.recommendations.map(x=>`<div class="recommend-card"><span class="rec-icon">${x.icon}</span><div><b>${x.name}</b><small>${x.type} • Match score ${x.score}</small><p>${x.description}</p></div></div>`).join("")}</div>`}
 catch(e){box.innerHTML=`<div class="loading-card">Recommendations temporarily unavailable.</div>`}
}
async function toggleFavorite(id,button){
 if(!getToken()){openModal("login");return} const active=button.dataset.active==="1";
 try{await api("/api/favorites/"+id,{method:active?"DELETE":"POST",headers:{"Authorization":"Bearer "+getToken()}});button.dataset.active=active?"0":"1";button.textContent=active?"♡ Save":"♥ Saved";toast(active?"Removed from favorites":"Added to favorites ❤️")}catch(e){toast("Could not update favorite. Please try again.")}
}
async function showFavorites(){
 if(!getToken()){openModal("login");return} const c=$("serviceContent");
 try{const d=await api("/api/favorites",{headers:{"Authorization":"Bearer "+getToken()}});
 c.innerHTML=`<div class="service-result-head"><h2>❤️ My favorite destinations</h2><p>${d.length} saved destination(s).</p></div>${d.length?`<div class="destination-grid">${d.map(x=>`<article class="dest-card" onclick="openDestination('${x.id}')"><div class="dest-image"><img src="${safeImage(x.image)}" alt="${safeImage(x.name)}" loading="lazy" onerror="this.onerror=null;this.src='/destination-fallback.svg';"><span class="dest-emoji">${x.emoji}</span></div><div class="dest-body"><h3>${x.name}</h3><small>${x.state}</small><p>${x.description}</p></div></article>`).join("")}</div>`:`<div class="empty card"><div class="empty-icon">♡</div><h3>No favorites yet</h3><p>Open a destination and save it.</p></div>`}`}catch(e){toast("Could not load favorites.")}
}
async function showFeedback(){
 if(!getToken()){openModal("login");return}$("modal").classList.add("open");
 $("modalBody").innerHTML=`<h2>How was TRIPAN?</h2><p>Your feedback helps improve the platform.</p><label>Rating<select id="feedbackRating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><label>Feedback<textarea id="feedbackMessage" rows="4" placeholder="Tell us what worked or what should improve."></textarea></label><button class="btn btn-primary" onclick="sendFeedback()">Send feedback</button>`;
}
async function sendFeedback(){try{await api("/api/feedback",{method:"POST",headers:authHeaders(),body:JSON.stringify({rating:$("feedbackRating").value,message:$("feedbackMessage").value})});closeModal();toast("Thanks for the feedback! 🙌")}catch(e){toast("Please enter feedback.")}}
async function showAdmin(){
 if(!getToken()){openModal("login");return}
 try{const d=await api("/api/admin/stats",{headers:{"Authorization":"Bearer "+getToken()}});
 $("serviceContent").innerHTML=`<div class="admin-panel"><span class="eyebrow">ADMIN</span><h2>📊 TRIPAN dashboard</h2><div class="admin-stats"><div><b>${d.users}</b><small>Users</small></div><div><b>${d.trips}</b><small>Trips</small></div><div><b>${d.favorites}</b><small>Favorites</small></div><div><b>${d.feedback}</b><small>Feedback</small></div></div><h3>Popular destinations</h3><div class="admin-list">${d.topDestinations.length?d.topDestinations.map(x=>`<div><b>${x[0]}</b><span>${x[1]} trip(s)</span></div>`).join(""):"<p>No trips yet.</p>"}</div></div>`}
 catch(e){toast("Admin access is available only to an admin account.")}
}

async function saveTrip(data){
  if(!getToken()){openModal("login","save");toast("Login is required to save trips.");return}
  try{
    await api("/api/trips",{method:"POST",headers:authHeaders(),body:JSON.stringify(data)});
    toast("Trip saved to your account ❤️");renderSaved();
  }catch(e){toast("Could not save trip. Please login again.")}
}
async function renderSaved(){
  const box=$("savedTrips");
  if(!getToken()){
    box.innerHTML=`<div class="empty card" style="grid-column:1/-1"><div class="empty-icon">🔐</div><h3>Login to see your trips</h3><p>Your saved itineraries are stored securely with your account.</p><button class="btn btn-primary" onclick="openModal('login')">Login</button></div>`;
    return;
  }
  try{
    const trips=await api("/api/trips",{headers:{"Authorization":"Bearer "+getToken()}});
    box.innerHTML=trips.length?trips.map(t=>`<div class="saved"><span class="eyebrow">SAVED TRIP • ${new Date(t.createdAt).toLocaleDateString("en-IN")}</span><h3>🧳 ${t.destination}</h3><p>📅 ${t.startDate?formatDate(t.startDate):"Date not set"}${t.endDate?` → ${formatDate(t.endDate)}`:""}<br>🗓️ ${t.days} days • ₹${Number(t.budget).toLocaleString()} • ${t.interests?.join(", ")||"Mixed interests"}</p><div class="saved-actions"><button class="btn btn-primary" onclick='viewTrip(${JSON.stringify(t)})'>View itinerary</button><button class="btn btn-outline" onclick="deleteTrip('${t.id}')">Delete</button></div></div>`).join(""):`<div class="empty card" style="grid-column:1/-1"><div class="empty-icon">🗺️</div><h3>No saved trips yet</h3><p>Generate an itinerary and save it to your account.</p><button class="btn btn-primary" onclick="showPage('plan')">Plan a trip</button></div>`;
  }catch(e){box.innerHTML=`<div class="empty card"><h3>Could not load trips</h3><p>Please login again.</p></div>`}
}
function viewTrip(t){
  showPage("plan");
  let html=`<div class="trip-head"><div><span class="eyebrow">SAVED ITINERARY</span><h2>${t.destination}</h2></div></div><div class="trip-meta"><span class="meta">📅 ${t.startDate?formatDate(t.startDate):"Date not set"}${t.endDate?` → ${formatDate(t.endDate)}`:""}</span><span class="meta">🗓️ ${t.days} days</span><span class="meta">💰 ₹${Number(t.budget).toLocaleString()}</span></div>`;
  html+=`<div class="day-list">${(t.itinerary||[]).map(d=>`<article class="day-card"><div class="day-card-head"><div class="day-number">${d.day}</div><div><span class="eyebrow">DAY ${d.day}</span><h3>${d.dateLabel||formatDate(d.date)}</h3></div></div>${d.weather?`<div class="day-weather"><span>${weatherIcon(d.weather.code)}</span><b>${localCondition(d.weather.condition)}</b><span>${d.weather.max}° / ${d.weather.min}°C</span><span>💧 ${d.weather.rainChance}% rain</span></div>`:""}<div class="day-timeline">${(d.items||[]).map(x=>`<div class="time-item rich"><div class="time-dot">${x.icon||"📍"}</div><div class="time-block"><span class="time">${x.time} • ${x.period||""}</span><b>${x.place}</b><small>${x.note}</small><div class="item-meta"><span>⏱️ ${x.durationHours||2}h</span><span>${x.category||"Attraction"}</span></div></div></div>`).join("")}</div></article>`).join("")}</div>`;
  $("itinerary").innerHTML=html;
}
async function deleteTrip(id){
  if(!getToken())return;
  try{await api("/api/trips/"+id,{method:"DELETE",headers:{"Authorization":"Bearer "+getToken()}});renderSaved();toast("Trip deleted.");}
  catch(e){toast("Could not delete trip.")}
}
async function loadProfile(){
  if(!getToken()) return;
  try{
    const d=await api("/api/auth/me",{headers:{"Authorization":"Bearer "+getToken()}});
    localStorage.setItem("tripanUserData",JSON.stringify(d));
    updateNavUser(d);
  }catch(e){
    console.warn("Profile loading failed:",e.message);
    logout(false);
  }
}
function updateNavUser(user){
  if(!user)return;
  const loginBtn=document.querySelector(".nav-actions .btn-outline");
  if(loginBtn){loginBtn.textContent="Hi, "+(user.name||"Traveler").split(" ")[0];loginBtn.onclick=()=>openModal("account")}
}
function logout(show=true){
  localStorage.removeItem("tripanToken");localStorage.removeItem("tripanUserData");
  const loginBtn=document.querySelector(".nav-actions .btn-outline");
  if(loginBtn){loginBtn.textContent="Login";loginBtn.onclick=()=>openModal("login")}
  if(show){closeModal();toast("Logged out.");}
}
function serviceFallbackImage(type, seed){
  const hotelImages=[
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80"
  ];
  const restaurantImages=[
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80"
  ];
  const list=type==="hotels"?hotelImages:restaurantImages;
  let n=0; for(const ch of String(seed||"")) n=(n+ch.charCodeAt(0))%list.length;
  return list[n];
}
function transportFallbackImage(type, seed){
  const images=[
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=900&q=80"
  ];
  let n=0; for(const ch of String(seed||type||"")) n=(n+ch.charCodeAt(0))%images.length;
  return images[n];
}

async function showService(type){
  const c=$("serviceContent");
  if(!c)return;

  if(type!=="hotels" && type!=="restaurants" && type!=="transport"){
    return;
  }

  const isHotel=type==="hotels";
  const isRestaurant=type==="restaurants";
  const isTransport=type==="transport";

  const T=currentLang==="te"
    ? (isHotel
      ? {h:"🏨 సిఫార్సు చేసిన హోటళ్లు",sub:"గమ్యస్థానం, రేటింగ్ మరియు ధర ఆధారంగా చూడండి",all:"అన్ని గమ్యస్థానాలు",empty:"హోటల్ డేటా ఇంకా జోడించలేదు."}
      : isRestaurant
      ? {h:"🍛 సిఫార్సు చేసిన రెస్టారెంట్లు",sub:"స్థానిక వంటకాలు, రేటింగ్ మరియు ధర ఆధారంగా చూడండి",all:"అన్ని గమ్యస్థానాలు",empty:"రెస్టారెంట్ డేటా ఇంకా జోడించలేదు."}
      : {h:"🚌 స్థానిక రవాణా",sub:"బస్సులు, రైలు, ట్యాక్సీలు మరియు ఇతర స్థానిక రవాణా ఎంపికలను చూడండి.",all:"అన్ని గమ్యస్థానాలు",empty:"రవాణా సమాచారం ఇంకా జోడించలేదు."})
    : currentLang==="hi"
    ? (isHotel
      ? {h:"🏨 सुझाए गए होटल",sub:"गंतव्य, रेटिंग और कीमत के अनुसार देखें",all:"सभी गंतव्य",empty:"होटल डेटा अभी जोड़ा नहीं गया है।"}
      : isRestaurant
      ? {h:"🍛 सुझाए गए रेस्तरां",sub:"स्थानीय व्यंजन, रेटिंग और कीमत के अनुसार देखें",all:"सभी गंतव्य",empty:"रेस्तरां डेटा अभी जोड़ा नहीं गया है।"}
      : {h:"🚌 स्थानीय परिवहन",sub:"बस, ट्रेन, टैक्सी और अन्य स्थानीय यात्रा विकल्प देखें।",all:"सभी गंतव्य",empty:"परिवहन जानकारी अभी जोड़ी नहीं गई है।"})
    : (isHotel
      ? {h:"🏨 Recommended hotels",sub:"Browse verified stays by destination, rating and price.",all:"All destinations",empty:"No hotel records have been added yet."}
      : isRestaurant
      ? {h:"🍛 Recommended restaurants",sub:"Browse local food options by destination, rating and price.",all:"All destinations",empty:"No restaurant records have been added yet."}
      : {h:"🚌 Local transport",sub:"See practical ways to move around each destination.",all:"All destinations",empty:"No transport records have been added yet."});

  const endpointType=isTransport?"transport":type;
  const loadingLabel=isTransport?"transport options":isHotel?"hotels":"restaurants";

  c.innerHTML=`<div class="service-result-head"><div><span class="eyebrow">LOCAL SERVICES</span><h2>${T.h}</h2><p>${T.sub}</p></div><select id="serviceDestinationFilter" class="service-filter"><option value="">${T.all}</option>${destinations.map(d=>`<option value="${d.id}">${d.name}</option>`).join("")}</select></div><div id="serviceCards" class="service-results"><div class="loading-card">Loading ${loadingLabel}…</div></div>`;

  const filter=$("serviceDestinationFilter");
  const load=async()=>{
    const destinationId=filter.value;
    const endpoint=`/api/${endpointType}${destinationId?`?destination_id=${encodeURIComponent(destinationId)}`:""}`;
    const box=$("serviceCards");
    box.innerHTML=`<div class="loading-card">Loading ${loadingLabel}…</div>`;
    try{
      const data=await api(endpoint);
      if(!data.length){
        box.innerHTML=`<div class="empty service-empty"><div class="empty-icon">${isHotel?"":isRestaurant?"":""}</div><h3>${T.empty}</h3><p>Add verified records to the <b>${endpointType}</b> Supabase table and they will appear here automatically.</p></div>`;
        return;
      }
      box.innerHTML=data.map(x=>{
        if(isTransport){
          const title=x.name||"Local transport";
          const imageUrl=x.image_url||transportFallbackImage(x.type||"transport", `${title}-${x.destination_id||""}`);
          const image=`<img src="${safeImage(imageUrl)}" alt="${safeImage(title)}" loading="lazy" onerror="this.parentElement.classList.add('no-image');this.remove();">`;
          const maps=x.maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title+" "+destinationLabel(x.destination_id))}`;
          return `<article class="service-result-card transport-card"><div class="service-result-image ${x.image_url?"":"no-image"}">${image}<span></span></div><div class="service-result-body"><div class="service-result-top"><h3>${title}</h3><b>${x.type||"Local transport"}</b></div><p class="service-destination">📍 ${destinationLabel(x.destination_id)}</p><p>${x.description||"Useful local travel option."}</p><div class="service-result-meta"><span>💰 ${x.fare_range||"Fare varies"}</span><span>📍 ${x.location||"Local area"}</span><span>🕐 ${x.availability||"Check locally"}</span></div><a class="service-map-link" href="${safeImage(maps)}" target="_blank" rel="noopener">View on Google Maps →</a></div></article>`;
        }
        const title=x.name||"Unnamed";
        const rating=x.rating>0?`★ ${Number(x.rating).toFixed(1)}`:"Rating pending";
        const reviews=x.review_count>0?` • ${Number(x.review_count).toLocaleString()} reviews`:"";
        const imageUrl=x.image_url||serviceFallbackImage(type, `${title}-${x.destination_id||""}`);
        const image=`<img src="${safeImage(imageUrl)}" alt="${safeImage(title)}" loading="lazy" onerror="this.parentElement.classList.add('no-image');this.remove();">`;
        const maps=x.maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title+" "+destinationLabel(x.destination_id))}`;
        return `<article class="service-result-card"><div class="service-result-image ${x.image_url?"":"no-image"}">${image}<span>${isHotel?"":""}</span></div><div class="service-result-body"><div class="service-result-top"><h3>${title}</h3><b>${rating}</b></div><p class="service-destination">📍 ${destinationLabel(x.destination_id)}</p><p>${isHotel?(x.stay_style||"Stay"):(x.cuisine||"Local cuisine")}</p><div class="service-result-meta"><span>💰 ${x.price_range||"Price unavailable"}</span><span>📍 ${x.location||"Local area"}</span>${reviews?`<span>${reviews}</span>`:""}</div><a class="service-map-link" href="${safeImage(maps)}" target="_blank" rel="noopener">View on Google Maps →</a></div></article>`;
      }).join("");
    }catch(e){
      box.innerHTML=`<div class="empty service-empty"><div class="empty-icon">⚠️</div><h3>Could not load ${loadingLabel}</h3><p>${e.message||"Check Supabase and the server terminal."}</p></div>`;
    }
  };
  filter.addEventListener("change",load);
  await load();
}

function showEmergency(){const T=currentLang==="te"?{ey:"ప్రయాణ భద్రత",h:"🚨 అత్యవసర సహాయం",p:"తక్షణ ప్రమాదంలో సరైన అత్యవసర సేవను సంప్రదించండి. మీ ఫోన్ లొకేషన్‌ను ఉపయోగించి విశ్వసనీయ వ్యక్తితో మీ గమ్యస్థానాన్ని పంచుకోండి.",n:"జాతీయ అత్యవసర సేవ",pol:"పోలీస్",amb:"అంబులెన్స్",fire:"ఫైర్"}:currentLang==="hi"?{ey:"यात्रा सुरक्षा",h:"🚨 आपातकालीन सहायता",p:"तत्काल खतरे में सही आपातकालीन सेवा से संपर्क करें। फोन की लोकेशन का उपयोग करें और अपना गंतव्य किसी भरोसेमंद व्यक्ति से साझा करें।",n:"राष्ट्रीय आपातकाल",pol:"पुलिस",amb:"एम्बुलेंस",fire:"फायर"}:{ey:"TRAVEL SAFETY",h:"🚨 Emergency assistance",p:"For immediate danger, contact the appropriate emergency service. Use your phone's location and share your destination with someone you trust.",n:"National emergency",pol:"Police",amb:"Ambulance",fire:"Fire"};$("serviceContent").innerHTML=`<div class="emergency-box"><span class="eyebrow">${T.ey}</span><h2>${T.h}</h2><p>${T.p}</p><div class="emergency-actions"><a href="tel:112">🚨 112<small>${T.n}</small></a><a href="tel:100">👮 100<small>${T.pol}</small></a><a href="tel:108">🚑 108<small>${T.amb}</small></a><a href="tel:101">🔥 101<small>${T.fire}</small></a></div></div>`;
}
function closeModal(){
  const modal=$("modal");
  if(modal) modal.classList.remove("open");
}

function authInput(id,type,placeholder,autocomplete=""){
  return `<input id="${id}" type="${type}" placeholder="${placeholder}" ${autocomplete?`autocomplete="${autocomplete}"`:""}>`;
}
function passwordField(id,placeholder,autocomplete){
  return `<div class="auth-password-wrap">${authInput(id,"password",placeholder,autocomplete)}<button type="button" class="auth-eye" onclick="togglePassword('${id}',this)" aria-label="Show password">👁</button></div>`;
}
function authShell(title,subtitle,content){
  return `<div class="auth-brand"><div class="auth-mark">✦</div><div><b>TRIPAN</b><small>Travel smarter. Experience more.</small></div></div><h2>${title}</h2><p>${subtitle}</p>${content}`;
}
function togglePassword(id,button){
  const input=$(id); if(!input)return;
  input.type=input.type==="password"?"text":"password";
  button.textContent=input.type==="password"?"👁":"🙈";
}
function openModal(type){
  $("modal").classList.add("open");
  if(type==="account"){
    const u=getUser();
    $("modalBody").innerHTML=authShell(`Hello, ${u?.name||"Traveler"} 👋`,`Your TRIPAN account is ready for your next journey.`,
      `<div class="auth-note"><b>${u?.email||""}</b><br>Your saved trips and preferences are linked to this account.</div><button class="btn btn-primary" onclick="showPage('mytrips');closeModal()">View My Trips →</button><button class="btn btn-outline" style="margin-top:10px" onclick="logout()">Logout</button>`);
    return;
  }
  if(type==="forgot"){
    $("modalBody").innerHTML=authShell("Reset your password","Enter the email connected to your TRIPAN account. We'll start the password recovery process.",
      `<label>Email${authInput("resetEmail","email","you@example.com","email")}</label><div id="resetMessage"></div><button class="btn btn-primary" onclick="requestPasswordReset()">Send reset request</button><div class="switch" onclick="openModal('login')">← Back to Login</div><div class="auth-note">Password recovery will be completed through the configured account provider. Never share your password or private API keys.</div>`);
    return;
  }
  if(type==="register"){
    $("modalBody").innerHTML=authShell("Create your account","Build trips, save itineraries and keep your travel preferences in one place.",
      `<label>Full name${authInput("authName","text","Your name","name")}</label><label>Email${authInput("authEmail","email","you@example.com","email")}</label><label>Password${passwordField("authPassword","At least 6 characters","new-password")}</label><button class="btn btn-primary" onclick="registerUser()">Create my TRIPAN account ✦</button><div class="auth-divider"><span>or</span></div><div class="switch" onclick="openModal('login')">Already have an account? Sign in</div>`);
    return;
  }
  $("modalBody").innerHTML=authShell("Welcome back 👋","Sign in to save trips, access your itinerary history and personalize TRIPAN.",
    `<label>Email${authInput("authEmail","email","you@example.com","email")}</label><label>Password${passwordField("authPassword","Your password","current-password")}</label><div class="auth-forgot" onclick="openModal('forgot')">Forgot password?</div><button class="btn btn-primary" onclick="loginUser()">Sign in to TRIPAN →</button><div class="auth-divider"><span>new to TRIPAN?</span></div><div class="switch" onclick="openModal('register')">Create a free account</div>`);
}
async function requestPasswordReset(){
  const email=($("resetEmail")?.value||"").trim();
  const box=$("resetMessage");
  if(!email){box.innerHTML=`<div class="auth-error">Please enter your email address.</div>`;return}
  // The current V5 auth is Express/JWT + local prototype storage.
  // We intentionally don't fake an email being sent. This UI is ready for the
  // Supabase Auth resetPasswordForEmail integration in the next auth migration.
  box.innerHTML=`<div class="auth-note"><b>Recovery request captured.</b><br>TRIPAN's current V5 authentication is local Express/JWT. We will connect this button to Supabase Auth when we migrate authentication to the online database.</div>`;
}
async function loginUser(){
  try{
    const d=await api("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$("authEmail").value,password:$("authPassword").value})});
    localStorage.setItem("tripanToken",d.token);localStorage.setItem("tripanUserData",JSON.stringify(d.user));closeModal();updateNavUser(d.user);toast("Welcome back, "+d.user.name.split(" ")[0]+"! 👋");renderSaved();
  }catch(e){toast(e.message||"Login failed. Check your email and password.")}
}
async function registerUser(){
  try{
    const d =await api("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:$("authName").value,email:$("authEmail").value,password:$("authPassword").value,language:currentLang})});
    localStorage.setItem("tripanToken",d.token);localStorage.setItem("tripanUserData",JSON.stringify(d.user));closeModal();updateNavUser(d.user);toast("Account created! 🎉");
  }catch(e){toast(e.message||"Registration failed. Use a valid email and 6+ character password.")}
}
async function changeLanguage(lang){currentLang=lang;localStorage.setItem("tripanLanguage",lang);await loadLocalizedData();applyUI();if(getToken()){try{const d=await api("/api/auth/profile",{method:"PUT",headers:authHeaders(),body:JSON.stringify({language:lang})});localStorage.setItem("tripanUserData",JSON.stringify(d.user));}catch(e){}}const active=document.querySelector(".page.active")?.id;if(active==="destination"){const title=$("destinationDetail").querySelector("h1");if(title){const id=title.dataset.id; if(id)openDestination(id)}}if(active==="mytrips")renderSaved();updateDateSummary();toast(lang==="te"?"తెలుగు ఎంచుకున్నారు • మొత్తం ట్రావెల్ డేటా అనువదించబడుతోంది":lang==="hi"?"हिन्दी चुनी गई • यात्रा डेटा अनुवादित किया जा रहा है":"English selected • Travel data updated")}

init().then(()=>{loadProfile();renderSaved()}).catch(e=>{console.error(e);toast("Could not load TRIPAN data.")});
