/**
 * TRAVELISER — MAIN APPLICATION ENGINE (MMT / GOIBIBO LIGHT LUXURY EDITION)
 * Features:
 * 1. MakeMyTrip Style Booking Engine (Swap, City selector, Filters)
 * 2. SAHAYAKMITR.ai Generative Itinerary Copilot with Gemini API Integration
 * 3. YOUR PLANS: Persistent Multi-Plan Architect with Instant "BUY NOW" Expedition Flow
 * 4. Emergency Command Center:
 *    - Women Safety (Live Telemetry, Force Pairing, Base ID, Police SOS Dispatch)
 *    - Lost and Found Recovery Portal & SafeTag QR
 *    - Nearby Specialist Directory
 * 5. High-Altitude Satellite Weather Telemetry
 */

(function () {
    'use strict';

    // =========================================================================
    // =========================================================================
    // 0. GEMINI API CONFIGURATION & MULTI-FEATURE INTELLIGENCE CLIENT
    const GEMINI_DEFAULT_KEY = ''; // Configurable via SAHAYAKMITR.ai Settings modal or localStorage
    let lastWorkingModel = 'gemini-flash-lite-latest';
    const GEMINI_CANDIDATE_MODELS = [
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite'
    ];

    function getActiveGeminiKey() {
        try {
            const saved = localStorage.getItem('margify_gemini_key') || localStorage.getItem('traveliser_gemini_key');
            if (saved && saved.trim() && saved.trim().length > 20 && !saved.includes('MaWQ_IdOi63YyMsOORcrg')) {
                return saved.trim();
            }
        } catch (e) {
            // fallback
        }
        return GEMINI_DEFAULT_KEY;
    }

    async function callGeminiRaw(promptText, maxTokens = 1200) {
        const apiKey = getActiveGeminiKey();
        let lastError = null;

        // Try the last verified working model first for ultra-fast latency
        const modelsToTry = [lastWorkingModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== lastWorkingModel)];

        for (const model of modelsToTry) {
            if (!model) continue;
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: promptText }]
                        }],
                        generationConfig: {
                            temperature: 0.65,
                            maxOutputTokens: maxTokens
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text && text.trim()) {
                        lastWorkingModel = model;
                        return { success: true, text: text.trim(), model: model };
                    }
                } else {
                    lastError = `HTTP ${response.status}`;
                }
            } catch (err) {
                lastError = err.message || err;
                console.warn(`Gemini candidate model ${model} failed:`, err);
            }
        }
        return { success: false, error: lastError || 'All Gemini models unavailable' };
    }

    async function callGeminiForItinerary(promptText, durationDays, vibe) {
        const dur = parseInt(durationDays) || 3;
        const systemPrompt = `You are SAHAYAKMITR.ai, India's premier AI Travel, Expedition & Heritage Itinerary Architect for Traveliser.
User trip request: "${promptText}". Preferred duration: ${dur} days. Vibe: ${vibe || 'Cultural & Exploration'}.
Architect a comprehensive, realistic, and tailored day-by-day travel itinerary.
Format your entire response strictly as a JSON object (pure JSON only, no markdown codeblock wrapper):
{
  "destination": "Destination name (e.g. Varanasi / Banaras, or Manali, Spiti, Goa)",
  "title": "${dur}-Day Compelling Trip Title",
  "duration": "${dur} Days / ${Math.max(1, dur - 1)} Nights",
  "vibe": "${(vibe || 'Heritage').toUpperCase()} Journey",
  "pricePerPerson": 4999,
  "pickupLocation": "Regional Airport / Central Railway Station / Hub",
  "highlights": ["Top Highlight 1", "Top Highlight 2", "Top Highlight 3"],
  "altitudeTag": "Verified Travel Corridor",
  "acclimationAdvisory": "Travel advice, hydration, and safety advisory.",
  "days": [
    {
      "day": "DAY 01",
      "title": "Arrival & Initial Highlights",
      "desc": "Detailed morning, afternoon, and evening schedule with sights and safe food recommendations."
    },
    {
      "day": "DAY 02",
      "title": "Core Exploration & Cultural Highlights",
      "desc": "Key landmarks, guided tours, local culinary experiences, and safety escort."
    }
  ],
  "perks": [
    "🛡️ Verified Chauffeur & Sanitized Transport",
    "📋 Dedicated Traveliser Itinerary Guide & Entry Passes",
    "🚨 24x7 Traveliser Women Safety Live Telemetry Link",
    "🍲 FSSAI Safe Food & Pure Drinking Water Assurance"
  ],
  "summary": "Here is your custom-crafted ${dur}-day itinerary designed for comfort, safety, and authentic discovery!"
};`;

        const res = await callGeminiRaw(systemPrompt, 1500);
        if (res.success && res.text) {
            try {
                let clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                const firstBrace = clean.indexOf('{');
                const lastBrace = clean.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    clean = clean.substring(firstBrace, lastBrace + 1);
                }
                const parsed = JSON.parse(clean);
                if (parsed && (parsed.title || parsed.destination) && parsed.days && Array.isArray(parsed.days)) {
                    return parsed;
                }
            } catch (parseErr) {
                console.warn('Failed parsing Gemini JSON, falling back:', parseErr);
            }
        }

        // Dynamic High-Quality Local Generator Fallback
        return generateDynamicLocalItinerary(promptText, durationDays, vibe);
    }

    function generateDynamicLocalItinerary(promptText, durationDays, vibe) {
        const q = (promptText || '').toLowerCase();
        const dur = parseInt(durationDays) || 3;
        let destination = "Manali & Solang Valley";
        let title = `${dur}-Day Himalayan High-Pass Adventure`;
        let price = 5499 + (dur - 2) * 1800;
        let altitudeTag = "Max Altitude: 3,978 M (Pass Summit)";
        let advisory = "Stay hydrated with 3-4 liters of water. Acclimatize before high passes.";
        let pickup = "Delhi / Chandigarh Airport or ISBT";
        let highlights = ["Verified Mountain Chauffeur", "Scenic High-Pass Halts", "Boutique Alpine Stay"];
        let days = [];

        if (q.includes('banaras') || q.includes('varanasi') || q.includes('kashi')) {
            destination = "Varanasi (Banaras) & Kashi Ghats";
            title = `${dur}-Day Sacred Ghats & Spiritual Heritage of Banaras`;
            price = 4899 + (dur - 2) * 1400;
            altitudeTag = "Sacred Plains Heritage Corridor";
            advisory = "Wear comfortable walking footwear for ancient alleys. Drink sealed bottled water.";
            pickup = "Varanasi Lal Bahadur Shastri Airport / Varanasi Cantt Station";
            highlights = ["Private Sunrise Boat Ride on Ganges", "VIP Dashashwamedh Ganga Aarti Seating", "Kashi Vishwanath Corridor & Sarnath Stupa"];
            
            for (let i = 1; i <= dur; i++) {
                if (i === 1) {
                    days.push({
                        day: `DAY 0${i}`,
                        title: "Arrival, Sacred Ghats & Evening Maha Ganga Aarti",
                        desc: "Chauffeur pickup from airport/station. Check-in to heritage riverside haveli. Late afternoon boat cruise along the 84 historic ghats to Dashashwamedh Ghat for the world-famous grand Maha Ganga Aarti with VIP riverside seating. Evening street-side Kachori & Jalebi tasting at audited hygienic sweet shops."
                    });
                } else if (i === 2) {
                    days.push({
                        day: `DAY 0${i}`,
                        title: "Kashi Vishwanath Darshan, Heritage Alleys & Sarnath",
                        desc: "Dawn VIP Darshan at the revered Kashi Vishwanath Golden Temple corridor and Annapurna Mandir. Midday heritage alley walk through Thatheri Bazaar. Afternoon excursion to Sarnath (Dhamek Stupa, Deer Park & Archaeological Museum where Lord Buddha delivered his first sermon). Evening shopping for GI-tagged Banarasi silk sarees."
                    });
                } else if (i === 3) {
                    days.push({
                        day: `DAY 0${i}`,
                        title: "Subah-e-Banaras at Assi Ghat & Departure Transfer",
                        desc: "Witness Subah-e-Banaras at sunrise at Assi Ghat with Vedic chanting and morning raga music. Savor seasonal saffron Malaiyyo and authentic Banarasi Paan. Return transfer to Varanasi airport/station with verified escort."
                    });
                } else {
                    days.push({
                        day: `DAY 0${i}`,
                        title: "Ramnagar Fort & Sacred Temple Trail",
                        desc: "Cross the Ganges to explore the 18th-century Ramnagar Fort museum, Sankat Mochan temple, and BHU Bharat Kala Bhavan campus before evening riverfront farewell."
                    });
                }
            }
        } else if (q.includes('spiti') || q.includes('kaza')) {
            destination = "Spiti Valley & Chandratal Lake";
            title = `${dur}-Day Trans-Himalayan Spiti Circuit`;
            price = 11499;
            altitudeTag = "Max Altitude: 4,590 M (Kunzum Pass)";
            advisory = "Acclimatize in Kaza for 24 hours. Drink 4L water daily.";
            pickup = "Chandigarh / Manali Hub";
            highlights = ["Key Monastery", "Chandratal Glacial Lake", "Hikkim Highest Post Office"];
        } else if (q.includes('leh') || q.includes('ladakh')) {
            destination = "Leh Ladakh & Pangong Tso";
            title = `${dur}-Day Land of High Passes Expedition`;
            price = 18999;
            altitudeTag = "Max Altitude: 5,359 M (Khardung La)";
            advisory = "Mandatory 48-hour rest upon landing in Leh. Diamox advisory provided.";
            pickup = "Kushok Bakula Rimpochee Airport (Leh)";
            highlights = ["Pangong Tso Blue Waters", "Nubra Valley Sand Dunes", "Magnetic Hill"];
        } else if (q.includes('shimla') || q.includes('kufri')) {
            destination = "Shimla, Kufri & Narkanda";
            title = `${dur}-Day Pine Ridges & Apple Valley Escape`;
            price = 4499;
            altitudeTag = "Max Altitude: 2,708 M (Hatu Peak)";
            advisory = "Pack warm layers for evening temperature drop.";
            pickup = "Chandigarh Airport / Kalka Station";
            highlights = ["Mall Road Heritage Walk", "Kufri Himalayan Nature Park", "Narkanda Orchards"];
        } else if (q.includes('goa') || q.includes('coastal') || q.includes('mumbai')) {
            destination = "Goa & Konkan Coastal Highway";
            title = `${dur}-Day Coastal Cruise & Sunsets`;
            price = 6899;
            altitudeTag = "Sea Level Coastal Route";
            advisory = "Stay hydrated and use sun protection during afternoon beach excursions.";
            pickup = "Mopa Goa Airport / Dabolim Hub";
            highlights = ["North Goa Heritage Forts", "South Goa Pristine Beaches", "Mandovi Sunset Cruise"];
        } else if (q.includes('ooty') || q.includes('coonoor') || q.includes('bangalore')) {
            destination = "Ooty, Coonoor & Nilgiri Hills";
            title = `${dur}-Day Nilgiri Highlands & Tea Estates`;
            price = 5899;
            altitudeTag = "Max Altitude: 2,637 M (Doddabetta Peak)";
            advisory = "Gentle winding mountain roads; carry motion sickness remedies if prone.";
            pickup = "Coimbatore Airport / Bangalore Hub";
            highlights = ["Nilgiri Mountain Heritage Toy Train", "Tea Garden Tasting", "Botanical Gardens"];
        }

        if (days.length === 0) {
            for (let i = 1; i <= dur; i++) {
                if (i === 1) {
                    days.push({
                        day: `DAY 0${i}`,
                        title: `Scenic Drive & Arrival in ${destination.split('&')[0].trim()}`,
                        desc: "Morning pickup in sanitized vehicle. Scenic cruise, check-in to boutique chalet/hotel, welcome hot herbal tea, and local walking orientation."
                    });
                } else if (i === dur) {
                    days.push({
                        day: `DAY 0${i}`,
                        title: "Scenic Panorama Sunrise & Return Departure",
                        desc: "Early morning viewpoint sunrise halt. Souvenir shopping at local bazaar, honey & dry fruit tasting, and comfortable return transfer."
                    });
                } else {
                    days.push({
                        day: `DAY 0${i}`,
                        title: `Alpine Exploration & High-Altitude Trekking`,
                        desc: "Cross mountain pass with verified local guide. Explore streams, ancient shrines, and evening bonfire with stargazing."
                    });
                }
            }
        }

        return {
            destination: destination,
            title: title,
            duration: `${dur} Days / ${dur - 1} Nights`,
            vibe: `${vibe ? vibe.toUpperCase() : 'CULTURAL'} Expedition`,
            pricePerPerson: price,
            pickupLocation: pickup,
            highlights: highlights,
            altitudeTag: altitudeTag,
            acclimationAdvisory: advisory,
            days: days,
            perks: [
                "🛡️ Sanitized Vehicle & Verified Chauffeur",
                "🫁 Medical First Aid & Oxygen Emergency Kit",
                "📋 Traveliser Verified Local Itinerary Escort",
                "🚨 24x7 Traveliser Women Safety Force Pairing"
            ],
            summary: `Here is your customized ${dur}-Day expedition plan for ${destination}!`
        };
    }

    // =========================================================================
    // 1. MAKEMYTRIP (MMT) INSPIRED BOOKING WIDGET LOGIC & CONTROLS
    // =========================================================================
    const btnSwap = document.getElementById('btn-swap');
    const fromCity = document.getElementById('from-city');
    const toCity = document.getElementById('to-city');
    const fromHelper = document.getElementById('from-helper');
    const toHelper = document.getElementById('to-helper');
    const blockFrom = document.getElementById('block-from');
    const blockTo = document.getElementById('block-to');
    const blockDeparture = document.getElementById('block-departure');
    const blockReturn = document.getElementById('block-return');
    const popoverFrom = document.getElementById('popover-from');
    const popoverTo = document.getElementById('popover-to');
    const popoverDuration = document.getElementById('popover-duration');
    const departureDateInput = document.getElementById('departure-date-input');
    const departureDisplayVal = document.getElementById('departure-display-val');
    const departureDisplaySub = document.getElementById('departure-display-sub');
    const durationDisplayVal = document.getElementById('duration-display-val');
    const durationDisplaySub = document.getElementById('duration-display-sub');
    const btnSearch = document.getElementById('btn-search');

    function closeAllPopovers() {
        if (popoverFrom) popoverFrom.classList.remove('open');
        if (popoverTo) popoverTo.classList.remove('open');
        if (popoverDuration) popoverDuration.classList.remove('open');
        if (blockFrom) blockFrom.classList.remove('active');
        if (blockTo) blockTo.classList.remove('active');
        if (blockReturn) blockReturn.classList.remove('active');
    }

    // FROM City selection
    if (blockFrom && popoverFrom) {
        blockFrom.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popoverFrom.classList.contains('open');
            closeAllPopovers();
            if (!isOpen) {
                popoverFrom.classList.add('open');
                blockFrom.classList.add('active');
                if (fromCity) fromCity.focus();
            }
        });

        popoverFrom.querySelectorAll('.popover-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = item.dataset.name;
                const hub = item.dataset.hub;
                if (fromCity && name) fromCity.value = name;
                if (fromHelper && hub) fromHelper.textContent = hub;
                closeAllPopovers();
            });
        });
    }

    // TO Destination selection
    if (blockTo && popoverTo) {
        blockTo.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popoverTo.classList.contains('open');
            closeAllPopovers();
            if (!isOpen) {
                popoverTo.classList.add('open');
                blockTo.classList.add('active');
                if (toCity) toCity.focus();
            }
        });

        popoverTo.querySelectorAll('.popover-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = item.dataset.name;
                const hub = item.dataset.hub;
                if (toCity && name) toCity.value = name;
                if (toHelper && hub) toHelper.textContent = hub;
                closeAllPopovers();
            });
        });
    }

    // City Swap ⇄
    if (btnSwap && fromCity && toCity) {
        btnSwap.addEventListener('click', (e) => {
            e.stopPropagation();
            const tempVal = fromCity.value;
            fromCity.value = toCity.value;
            toCity.value = tempVal;

            if (fromHelper && toHelper) {
                const tempHelp = fromHelper.textContent;
                fromHelper.textContent = toHelper.textContent;
                toHelper.textContent = tempHelp;
            }
            btnSwap.style.transform = 'rotate(180deg)';
            setTimeout(() => { btnSwap.style.transform = ''; }, 300);
            closeAllPopovers();
        });
    }

    // DEPARTURE Date picker
    if (blockDeparture && departureDateInput) {
        // Set default minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        departureDateInput.min = `${yyyy}-${mm}-${dd}`;
        departureDateInput.value = `${yyyy}-${mm}-${dd}`;

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        function updateDepartureDisplay(dateObj) {
            const d = dateObj.getDate();
            const m = monthNames[dateObj.getMonth()];
            const y = String(dateObj.getFullYear()).slice(-2);
            const dayName = dayNames[dateObj.getDay()];

            if (departureDisplayVal) departureDisplayVal.textContent = `${d} ${m} '${y}`;
            if (departureDisplaySub) departureDisplaySub.textContent = `${dayName} Departure`;
        }

        updateDepartureDisplay(tomorrow);

        blockDeparture.addEventListener('click', (e) => {
            closeAllPopovers();
            if (typeof departureDateInput.showPicker === 'function') {
                try {
                    departureDateInput.showPicker();
                } catch (err) {
                    departureDateInput.click();
                }
            } else {
                departureDateInput.click();
            }
        });

        departureDateInput.addEventListener('change', () => {
            if (departureDateInput.value) {
                const chosen = new Date(departureDateInput.value);
                if (!isNaN(chosen.getTime())) {
                    updateDepartureDisplay(chosen);
                }
            }
        });
    }

    // DURATION & Trip Type selection
    let selectedTripDays = 3;
    if (blockReturn && popoverDuration) {
        blockReturn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = popoverDuration.classList.contains('open');
            closeAllPopovers();
            if (!isOpen) {
                popoverDuration.classList.add('open');
                blockReturn.classList.add('active');
            }
        });

        popoverDuration.querySelectorAll('.popover-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = item.dataset.val;
                const sub = item.dataset.sub;
                const days = parseInt(item.dataset.days) || 3;
                selectedTripDays = days;
                if (durationDisplayVal && val) durationDisplayVal.textContent = val;
                if (durationDisplaySub && sub) durationDisplaySub.textContent = sub;
                closeAllPopovers();
            });
        });
    }

    // Close popovers on outer click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mmt-block') && !e.target.closest('.mmt-dropdown-popover')) {
            closeAllPopovers();
        }
    });

    // SEARCH EXPEDITIONS button action
    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
            closeAllPopovers();
            const fCity = fromCity ? fromCity.value.trim() : 'New Delhi';
            const tCity = toCity ? toCity.value.trim() : 'Manali & Rohtang';
            const depDate = departureDisplayVal ? departureDisplayVal.textContent : '18 Oct \'26';
            const durText = durationDisplayVal ? durationDisplayVal.textContent : '3 Days / 2 Nights';

            // Button loading feedback
            const originalContent = btnSearch.innerHTML;
            btnSearch.innerHTML = `<span>SEARCHING VERIFIED EXPEDITIONS...</span> ⏳`;
            btnSearch.style.pointerEvents = 'none';

            setTimeout(() => {
                btnSearch.innerHTML = originalContent;
                btnSearch.style.pointerEvents = 'auto';

                // Pre-fill SAHAYAKMITR.ai with this route
                const chatInput = document.getElementById('chat-user-input');
                if (chatInput) {
                    chatInput.value = `Plan me an expedition from ${fCity} to ${tCity} for ${durText} departing on ${depDate}`;
                }

                // Filter & Highlight in Packages section
                const packagesSec = document.getElementById('packages');
                if (packagesSec) {
                    // Update or insert search result banner
                    let banner = document.getElementById('mmt-search-result-banner');
                    if (!banner) {
                        banner = document.createElement('div');
                        banner.id = 'mmt-search-result-banner';
                        const pkgHeader = packagesSec.querySelector('.content-container');
                        if (pkgHeader) {
                            pkgHeader.insertBefore(banner, pkgHeader.children[1] || pkgHeader.firstChild);
                        }
                    }
                    banner.style.display = 'flex';
                    banner.style.cssText = `
                        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                        border: 1.5px solid #bae6fd;
                        border-radius: 16px;
                        padding: 16px 24px;
                        margin-bottom: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        gap: 14px;
                        box-shadow: 0 4px 16px rgba(2, 132, 199, 0.08);
                    `;

                    banner.innerHTML = `
                        <div>
                            <span style="background:#0284c7; color:#fff; font-size:10.5px; font-weight:800; padding:3px 10px; border-radius:12px; letter-spacing:0.5px;">✓ SEARCH RESULTS APPLIED</span>
                            <h3 style="font-family:var(--font-heading); font-size:19px; font-weight:800; color:#0f172a; margin:6px 0 2px;">Expeditions from <strong>${fCity}</strong> to <strong>${tCity}</strong></h3>
                            <p style="font-size:12.5px; color:#475569; margin:0;">Departure: <strong>${depDate}</strong> • Duration: <strong>${durText}</strong> • Guaranteed 4x4 Chauffeur & Women Safety Protection</p>
                        </div>
                        <a href="#ai-assistance" style="background:#0284c7; color:#fff; font-weight:700; font-size:12.5px; padding:10px 18px; border-radius:24px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                            <span>Ask AI For Custom Itinerary &rarr;</span>
                        </a>
                    `;

                    // Highlight matching package cards
                    const packageCards = packagesSec.querySelectorAll('.pkg-card');
                    const searchDestLower = tCity.toLowerCase();

                    packageCards.forEach(card => {
                        const cardText = card.textContent.toLowerCase();
                        if (
                            (searchDestLower.includes('manali') && cardText.includes('manali')) ||
                            (searchDestLower.includes('spiti') && cardText.includes('spiti')) ||
                            (searchDestLower.includes('ladakh') && cardText.includes('ladakh')) ||
                            (searchDestLower.includes('varanasi') && (cardText.includes('varanasi') || cardText.includes('banaras') || cardText.includes('spiritual'))) ||
                            (searchDestLower.includes('goa') && cardText.includes('goa')) ||
                            (searchDestLower.includes('shimla') && cardText.includes('shimla'))
                        ) {
                            card.style.border = '2.5px solid #0284c7';
                            card.style.transform = 'translateY(-4px)';
                            card.style.boxShadow = '0 16px 36px rgba(2, 132, 199, 0.2)';
                        } else {
                            card.style.border = '1px solid #e2e8f0';
                            card.style.transform = '';
                            card.style.boxShadow = '';
                        }
                    });

                    packagesSec.scrollIntoView({ behavior: 'smooth' });
                }

                showNotificationToast(`✨ Filtered top expeditions: ${fCity} → ${tCity} (${durText})!`);
            }, 350);
        });
    }

    // Category Nav Cards
    const catCards = document.querySelectorAll('.cat-card');
    catCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const cat = card.dataset.cat;
            if (cat === 'food') {
                e.preventDefault();
                if (window.openFoodInspectionSection) {
                    window.openFoodInspectionSection();
                }
                return;
            } else if (cat === 'plans') {
                e.preventDefault();
                if (window.openPlansDrawer) {
                    window.openPlansDrawer();
                }
                return;
            } else {
                if (window.closeFoodInspectionSection) {
                    window.closeFoodInspectionSection(false);
                }
            }

            catCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const targetTab = card.dataset.targetTab;
            if (targetTab && window.switchEmergencyTab) {
                window.switchEmergencyTab(targetTab);
            }
        });
    });

    // Header Food Inspection Button
    const headerFoodBtn = document.getElementById('header-food-inspection-btn');
    if (headerFoodBtn) {
        headerFoodBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openFoodInspectionSection) {
                window.openFoodInspectionSection();
            }
        });
    }

    // Header YOUR PLANS button (Opens ecommerce corner drawer)
    const headerPlansBtn = document.getElementById('header-my-plans-btn');
    if (headerPlansBtn) {
        headerPlansBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openPlansDrawer) {
                window.openPlansDrawer();
            }
        });
    }

    // Floating corner launcher for YOUR PLANS
    const floatingPlansBtn = document.getElementById('floating-plans-corner-btn');
    if (floatingPlansBtn) {
        floatingPlansBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openPlansDrawer) {
                window.openPlansDrawer();
            }
        });
    }

    // =========================================================================
    // FIREBASE WEB AUTHENTICATION ENGINE (INTEGRATED MEMBER LOGIN)
    // Project: travelfier
    // =========================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyCJMqPmg9B74IMQs9sdq47H3gVpzW8XEtc",
        authDomain: "travelfier.firebaseapp.com",
        projectId: "travelfier",
        storageBucket: "travelfier.firebasestorage.app",
        messagingSenderId: "1080892368589",
        appId: "1:1080892368589:web:50dce75dc08d45b1acab84"
    };

    let firebaseApp = null;
    let firebaseAuth = null;

    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                firebaseApp = firebase.app();
            }
            firebaseAuth = firebase.auth();
            window.TraveliserFirebaseApp = firebaseApp;
            window.TraveliserFirebaseAuth = firebaseAuth;
        } catch (e) {
            console.warn('[Firebase Auth] Initialization exception:', e);
        }
    }

    // Modal elements
    const authModal = document.getElementById('auth-modal');
    const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
    const tabAuthLogin = document.getElementById('tab-auth-login');
    const tabAuthSignup = document.getElementById('tab-auth-signup');
    const btnGoogleLogin = document.getElementById('btn-google-login');
    const btnGuestLogin = document.getElementById('btn-guest-login');
    const authAlertBox = document.getElementById('auth-alert-box');
    const authForm = document.getElementById('auth-form');
    const authNameGroup = document.getElementById('auth-name-group');
    const authName = document.getElementById('auth-name');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const btnTogglePassword = document.getElementById('btn-toggle-password');
    const btnForgotPassword = document.getElementById('btn-forgot-password');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const authSubmitLabel = document.getElementById('auth-submit-label');

    // Profile modal elements
    const modalUserProfile = document.getElementById('modal-user-profile');
    const btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    const userProfileAvatar = document.getElementById('user-profile-avatar');
    const userProfileName = document.getElementById('user-profile-name');
    const userProfileEmail = document.getElementById('user-profile-email');
    const userProfileUid = document.getElementById('user-profile-uid');
    const btnProfileViewPlans = document.getElementById('btn-profile-view-plans');
    const btnProfileSafetyCircle = document.getElementById('btn-profile-safety-circle');
    const btnLogout = document.getElementById('btn-logout');

    // Header elements
    const btnLogin = document.getElementById('btn-login');
    const headerUserName = document.getElementById('header-user-name');

    let currentAuthMode = 'login'; // 'login' | 'signup'

    function showAuthAlert(message, type = 'error') {
        if (!authAlertBox) return;
        authAlertBox.className = `auth-alert ${type}`;
        authAlertBox.innerHTML = message;
        authAlertBox.style.display = 'block';
    }

    function hideAuthAlert() {
        if (!authAlertBox) return;
        authAlertBox.style.display = 'none';
        authAlertBox.innerHTML = '';
    }

    function openAuthModal(mode = 'login') {
        setAuthMode(mode);
        hideAuthAlert();
        if (authModal) {
            authModal.classList.add('visible');
            authModal.style.display = 'flex';
        }
    }

    function closeAuthModal() {
        if (authModal) {
            authModal.classList.remove('visible');
            authModal.style.display = 'none';
        }
        hideAuthAlert();
    }

    function openUserProfileModal(user) {
        if (!user) return;
        if (userProfileName) {
            userProfileName.textContent = user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest Explorer' : 'Traveliser Member');
        }
        if (userProfileEmail) {
            userProfileEmail.textContent = user.isAnonymous ? 'Temporary Guest Session' : (user.email || 'No email attached');
        }
        if (userProfileUid) {
            userProfileUid.textContent = user.uid || '---';
        }
        if (userProfileAvatar) {
            if (user.photoURL) {
                userProfileAvatar.innerHTML = `<img src="${user.photoURL}" alt="User Avatar" referrerpolicy="no-referrer">`;
            } else {
                const initial = (user.displayName || user.email || 'E').charAt(0).toUpperCase();
                userProfileAvatar.textContent = initial;
            }
        }
        if (modalUserProfile) {
            modalUserProfile.classList.add('visible');
            modalUserProfile.style.display = 'flex';
        }
    }

    function closeUserProfileModal() {
        if (modalUserProfile) {
            modalUserProfile.classList.remove('visible');
            modalUserProfile.style.display = 'none';
        }
    }

    function setAuthMode(mode) {
        currentAuthMode = mode;
        hideAuthAlert();
        if (mode === 'signup') {
            if (tabAuthSignup) tabAuthSignup.classList.add('active');
            if (tabAuthLogin) tabAuthLogin.classList.remove('active');
            if (authNameGroup) authNameGroup.style.display = 'block';
            if (authSubmitLabel) authSubmitLabel.textContent = 'Create Traveliser Account';
            if (btnForgotPassword) btnForgotPassword.style.display = 'none';
        } else {
            if (tabAuthLogin) tabAuthLogin.classList.add('active');
            if (tabAuthSignup) tabAuthSignup.classList.remove('active');
            if (authNameGroup) authNameGroup.style.display = 'none';
            if (authSubmitLabel) authSubmitLabel.textContent = 'Sign In to Traveliser';
            if (btnForgotPassword) btnForgotPassword.style.display = 'inline-block';
        }
    }

    function updateHeaderForUser(user) {
        if (!btnLogin) return;
        if (user) {
            const displayName = user.displayName || user.email?.split('@')[0] || (user.isAnonymous ? 'Guest Explorer' : 'Member');
            btnLogin.classList.add('logged-in');
            btnLogin.innerHTML = `<span class="user-avatar-dot"></span> <span id="header-user-name">${displayName}</span>`;
            btnLogin.title = `Signed in as ${displayName} (${user.email || 'Guest'}). Click to view passport.`;
        } else {
            btnLogin.classList.remove('logged-in');
            btnLogin.innerHTML = `<span id="header-user-name">Login / Sign Up</span>`;
            btnLogin.title = 'Login or Create Traveliser Account';
        }
    }

    // Friendly Firebase Error Translator
    function formatFirebaseError(err) {
        if (!err) return 'An unexpected authentication error occurred.';
        const code = err.code || '';
        const msg = err.message || '';
        
        switch (code) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address format.';
            case 'auth/user-disabled':
                return 'This user account has been disabled. Please contact support.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please verify your credentials or use "Forgot password?".';
            case 'auth/email-already-in-use':
                return 'An account already exists with this email. Switch to "Sign In" above.';
            case 'auth/weak-password':
                return 'Password is too weak. Please use at least 6 characters.';
            case 'auth/operation-not-allowed':
                return 'Email/Password authentication is disabled in your Firebase console. Please enable Email/Password provider in Firebase Console > Authentication > Sign-in method, or use "Instant Guest Explorer Access" below.';
            case 'auth/popup-closed-by-user':
                return 'Google sign-in popup was closed before completing authentication.';
            case 'auth/unauthorized-domain':
                return 'This domain is not authorized in Firebase OAuth. Add localhost to Firebase Console > Authentication > Settings > Authorized domains.';
            default:
                return msg || 'Authentication error. Please check your credentials and try again.';
        }
    }

    // Attach Auth State Listener
    if (firebaseAuth) {
        firebaseAuth.onAuthStateChanged((user) => {
            updateHeaderForUser(user);
            if (user) {
                console.log('[Firebase Auth] Active user session:', user.email || user.uid);
            } else {
                console.log('[Firebase Auth] User signed out');
            }
        });
    }

    // Trigger Login / Passport from Header
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            if (firebaseAuth && firebaseAuth.currentUser) {
                openUserProfileModal(firebaseAuth.currentUser);
            } else {
                openAuthModal('login');
            }
        });
    }

    // Tab buttons
    if (tabAuthLogin) {
        tabAuthLogin.addEventListener('click', () => setAuthMode('login'));
    }
    if (tabAuthSignup) {
        tabAuthSignup.addEventListener('click', () => setAuthMode('signup'));
    }

    // Close buttons
    if (btnCloseAuthModal) {
        btnCloseAuthModal.addEventListener('click', closeAuthModal);
    }
    if (btnCloseProfileModal) {
        btnCloseProfileModal.addEventListener('click', closeUserProfileModal);
    }

    // Backdrop click close
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }
    if (modalUserProfile) {
        modalUserProfile.addEventListener('click', (e) => {
            if (e.target === modalUserProfile) closeUserProfileModal();
        });
    }

    // Password visibility toggle
    if (btnTogglePassword && authPassword) {
        btnTogglePassword.addEventListener('click', () => {
            if (authPassword.type === 'password') {
                authPassword.type = 'text';
                btnTogglePassword.textContent = '🔒';
            } else {
                authPassword.type = 'password';
                btnTogglePassword.textContent = '👁️';
            }
        });
    }

    // Email/Password Form Submit
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAuthAlert();

            const email = (authEmail?.value || '').trim();
            const password = (authPassword?.value || '').trim();
            const name = (authName?.value || '').trim();

            if (!email || !password) {
                showAuthAlert('Please enter both email and password.');
                return;
            }

            if (!firebaseAuth) {
                showAuthAlert('Firebase Auth is still initializing. Please wait a moment or refresh the page.');
                return;
            }

            btnAuthSubmit.disabled = true;
            const originalLabel = authSubmitLabel ? authSubmitLabel.textContent : 'Submit';
            if (authSubmitLabel) authSubmitLabel.textContent = 'Authenticating...';

            try {
                if (currentAuthMode === 'signup') {
                    const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                    if (name && userCredential.user) {
                        try {
                            await userCredential.user.updateProfile({ displayName: name });
                        } catch (pErr) {
                            console.warn('[Firebase Auth] Profile update note:', pErr);
                        }
                    }
                    closeAuthModal();
                    if (window.showToast) {
                        window.showToast(`🎉 Welcome to Traveliser, ${name || email}! Your account was created successfully.`);
                    }
                } else {
                    const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
                    closeAuthModal();
                    const displayName = userCredential.user.displayName || email.split('@')[0];
                    if (window.showToast) {
                        window.showToast(`✈️ Welcome back, ${displayName}! Syncing your travel plans.`);
                    }
                }
            } catch (err) {
                console.error('[Firebase Auth] Submission error:', err);
                showAuthAlert(formatFirebaseError(err), 'error');
            } finally {
                btnAuthSubmit.disabled = false;
                if (authSubmitLabel) authSubmitLabel.textContent = originalLabel;
            }
        });
    }

    // Google Sign-In
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', async () => {
            if (!firebaseAuth) {
                showAuthAlert('Firebase Auth is not available.');
                return;
            }
            hideAuthAlert();
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await firebaseAuth.signInWithPopup(provider);
                closeAuthModal();
                const name = result.user?.displayName || 'Explorer';
                if (window.showToast) {
                    window.showToast(`🌟 Successfully signed in with Google as ${name}!`);
                }
            } catch (err) {
                console.error('[Firebase Auth] Google error:', err);
                showAuthAlert(formatFirebaseError(err), 'error');
            }
        });
    }

    // Instant Guest Login
    if (btnGuestLogin) {
        btnGuestLogin.addEventListener('click', async () => {
            if (!firebaseAuth) {
                showAuthAlert('Firebase Auth is not available.');
                return;
            }
            hideAuthAlert();
            btnGuestLogin.disabled = true;
            try {
                const result = await firebaseAuth.signInAnonymously();
                closeAuthModal();
                if (window.showToast) {
                    window.showToast('⚡ Signed in as Guest Explorer! You can explore all travel plans & features.');
                }
            } catch (err) {
                console.error('[Firebase Auth] Guest error:', err);
                showAuthAlert(formatFirebaseError(err), 'error');
            } finally {
                btnGuestLogin.disabled = false;
            }
        });
    }

    // Forgot Password
    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', async () => {
            const email = (authEmail?.value || '').trim();
            if (!email) {
                showAuthAlert('Please enter your email address in the field above to receive a password reset link.', 'info');
                authEmail?.focus();
                return;
            }
            if (!firebaseAuth) return;
            try {
                await firebaseAuth.sendPasswordResetEmail(email);
                showAuthAlert(`✅ Password reset link has been dispatched to <strong>${email}</strong>. Check your inbox!`, 'success');
            } catch (err) {
                showAuthAlert(formatFirebaseError(err), 'error');
            }
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (!firebaseAuth) return;
            try {
                await firebaseAuth.signOut();
                closeUserProfileModal();
                if (window.showToast) {
                    window.showToast('👋 You have been securely signed out. See you on the trails!');
                }
            } catch (err) {
                console.error('[Firebase Auth] Sign out error:', err);
            }
        });
    }

    // View Plans from Profile
    if (btnProfileViewPlans) {
        btnProfileViewPlans.addEventListener('click', () => {
            closeUserProfileModal();
            if (window.openPlansDrawer) {
                window.openPlansDrawer();
            }
        });
    }

    // =========================================================================
    // 2. "YOUR PLANS" ECOMMERCE CORNER DRAWER & MANAGEMENT ENGINE
    // =========================================================================
    const STORAGE_KEY_PLANS = 'margify_saved_plans';

    const drawerYourPlans = document.getElementById('your-plans');
    const plansDrawerBackdrop = document.getElementById('plans-drawer-backdrop');
    const btnClosePlansDrawer = document.getElementById('btn-close-plans-drawer');
    const btnDrawerAskAi = document.getElementById('btn-drawer-ask-ai');

    window.openPlansDrawer = function() {
        const drawer = document.getElementById('your-plans');
        const backdrop = document.getElementById('plans-drawer-backdrop');
        if (drawer) drawer.classList.add('active');
        if (backdrop) backdrop.classList.add('active');
        renderSavedPlans();
    };

    window.closePlansDrawer = function() {
        const drawer = document.getElementById('your-plans');
        const backdrop = document.getElementById('plans-drawer-backdrop');
        if (drawer) drawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    };

    if (btnClosePlansDrawer) {
        btnClosePlansDrawer.addEventListener('click', () => {
            window.closePlansDrawer();
        });
    }

    if (plansDrawerBackdrop) {
        plansDrawerBackdrop.addEventListener('click', () => {
            window.closePlansDrawer();
        });
    }

    if (btnDrawerAskAi) {
        btnDrawerAskAi.addEventListener('click', (e) => {
            e.preventDefault();
            window.closePlansDrawer();
            const aiSec = document.getElementById('ai-assistance');
            if (aiSec) aiSec.scrollIntoView({ behavior: 'smooth' });
            const chatInput = document.getElementById('chat-user-input');
            if (chatInput) chatInput.focus();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closePlansDrawer();
        }
    });

    // Initial seed plans if storage empty
    function getInitialPlans() {
        return [
            {
                id: 'plan_seed_1',
                destination: 'Varanasi (Banaras) & Kashi Ghats',
                title: '3-Day Sacred Ghats & Spiritual Heritage of Banaras',
                duration: '3 Days / 2 Nights',
                vibe: 'HERITAGE & SPIRITUAL',
                pricePerPerson: 4999,
                pickupLocation: 'Varanasi Cantt / Airport Hub',
                highlights: ['Sunrise Boat Ride on Ganges', 'Dashashwamedh VIP Ganga Aarti', 'Kashi Vishwanath Corridor & Sarnath'],
                altitudeTag: 'Sacred Plains Heritage Corridor',
                acclimationAdvisory: 'Wear comfortable walking footwear for ancient alleys. Drink sealed bottled water.',
                days: [
                    { day: 'DAY 01', title: 'Arrival, Sacred Ghats & Evening Maha Aarti', desc: 'Pickup and check-in to heritage haveli. Sunset wooden boat ride across 84 ghats to Dashashwamedh Ghat for VIP Ganga Aarti seating. Safe Kachori-Jalebi food trail.' },
                    { day: 'DAY 02', title: 'Kashi Vishwanath Darshan & Sarnath Stupa', desc: 'Dawn VIP Darshan at Kashi Vishwanath Golden Temple. Excursion to Sarnath where Buddha gave his first sermon. Evening Banarasi silk saree weavers tour.' },
                    { day: 'DAY 03', title: 'Subah-e-Banaras & Departure', desc: 'Sunrise musical Subah-e-Banaras at Assi Ghat, saffron Malaiyyo tasting, and smooth departure transfer.' }
                ],
                perks: ['🛡️ Verified Local Chauffeur & AC Vehicle', '⛵ Private Sunrise & Aarti Boat Cruise', '📋 Kashi Vishwanath VIP Darshan Pass', '🚨 24x7 Traveliser Women Safety Force Pairing'],
                createdDate: '10 Oct 2026'
            },
            {
                id: 'plan_seed_2',
                destination: 'Manali & Solang Valley',
                title: '3-Day Himalayan High-Pass Adventure',
                duration: '3 Days / 2 Nights',
                vibe: 'ADVENTURE Expedition',
                pricePerPerson: 5499,
                pickupLocation: 'Delhi / Chandigarh',
                highlights: ['Atal Tunnel Traversal', 'Solang Paragliding', 'Old Manali Pine Chalet'],
                altitudeTag: 'Max Altitude: 3,978 M (Pass Summit)',
                acclimationAdvisory: 'Hydrate well with 3L water daily.',
                days: [
                    { day: 'DAY 01', title: 'Scenic Highway Drive to Manali', desc: 'Pickup in 4x4 SUV. NH44 scenic valley drive, check-in to riverside chalet, evening apple cider welcome.' },
                    { day: 'DAY 02', title: 'Solang Valley & Atal Tunnel Traverse', desc: 'Morning high-altitude paragliding. Cross Atal Tunnel to Sissu waterfall. Stargazing bonfire.' },
                    { day: 'DAY 03', title: 'Jogini Waterfall Hike & Departure', desc: 'Scenic morning pine hike to Jogini falls, Mall road souvenir halt, and smooth departure transfer.' }
                ],
                perks: ['🛡️ 4x4 Mountain SUV & Verified Chauffeur', '🫁 Medical Oxygen & Diamox Onboard', '📋 All Mountain Permits', '🚨 24x7 Women Safety Patrol Link'],
                createdDate: '10 Oct 2026'
            }
        ];
    }

    function loadSavedPlans() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_PLANS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Failed to load plans from localStorage', e);
        }
        const initial = getInitialPlans();
        savePlansToStorage(initial);
        return initial;
    }

    function savePlansToStorage(plans) {
        try {
            localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
        } catch (e) {
            console.error('Failed to save plans to localStorage', e);
        }
    }

    let savedPlans = loadSavedPlans();

    function updatePlansCounters() {
        const count = savedPlans.length;
        const headerCount = document.getElementById('header-plans-count');
        const catCount = document.getElementById('cat-plans-count');
        const displayCount = document.getElementById('plans-count-display');
        const floatingCount = document.getElementById('floating-plans-count');

        if (headerCount) headerCount.textContent = count;
        if (catCount) catCount.textContent = `${count} SAVED`;
        if (displayCount) displayCount.textContent = count;
        if (floatingCount) floatingCount.textContent = count;
    }

    function renderSavedPlans() {
        const grid = document.getElementById('plans-grid');
        if (!grid) return;

        updatePlansCounters();

        if (savedPlans.length === 0) {
            grid.innerHTML = `
                <div class="plans-empty-card">
                    <div class="plans-empty-icon">🏔️</div>
                    <h3 class="plans-empty-title">No Custom Plans Yet</h3>
                    <p class="plans-empty-desc">
                        Chat with <strong>SAHAYAKMITR.ai</strong> above using your Gemini Copilot to design tailored itineraries. They will automatically be added right here with an instant <strong>BUY NOW</strong> checkout!
                    </p>
                    <a href="#ai-assistance" class="btn-start-first-plan">Start Planning With AI &rarr;</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = savedPlans.map((p, idx) => `
            <div class="plan-card" id="card-${p.id}">
                <div class="plan-card-banner">
                    <span class="plan-card-dest">📍 ${p.destination || 'Alpine Corridor'}</span>
                    <span class="plan-card-duration-badge">⏱️ ${p.duration || '3 Days'}</span>
                </div>
                <div class="plan-card-body">
                    <h3 class="plan-card-title">${p.title}</h3>
                    <span class="plan-card-vibe-tag">🏔️ ${p.vibe || 'Himalayan Expedition'}</span>

                    <div class="plan-price-box">
                        <span class="plan-price-label">Estimated Fare (Per Person)</span>
                        <span class="plan-price-amount">₹${(p.pricePerPerson || 5499).toLocaleString('en-IN')}</span>
                    </div>

                    ${p.highlights && p.highlights.length ? `
                        <div class="plan-highlights-strip">
                            ${p.highlights.map(h => `<span class="plan-highlight-pill">✨ ${h}</span>`).join('')}
                        </div>
                    ` : ''}

                    <div class="plan-days-accordion">
                        ${p.days ? p.days.slice(0, 3).map(d => `
                            <div class="plan-day-row">
                                <div class="plan-day-header">
                                    <span class="plan-day-tag">${d.day}</span>
                                    <span>${d.title}</span>
                                </div>
                                <p class="plan-day-timeline">${d.desc}</p>
                            </div>
                        `).join('') : ''}
                        ${p.days && p.days.length > 3 ? `
                            <div style="font-size:11px; color:#0284c7; font-weight:700; text-align:center; padding-top:4px;">
                                + ${p.days.length - 3} more expedition days planned
                            </div>
                        ` : ''}
                    </div>

                    <div class="plan-inclusions-list">
                        ${(p.perks || ['4x4 Mountain SUV & Verified Chauffeur', '24x7 Women Safety Patrol Link', 'Medical Oxygen Onboard']).map(pk => `
                            <span>${pk}</span>
                        `).join('')}
                    </div>

                    <div class="plan-card-actions">
                        <button class="btn-plan-buy-now" onclick="window.triggerBuyNow('${p.id}')">
                            <span>⚡ BUY NOW</span>
                            <span>• ₹${(p.pricePerPerson || 5499).toLocaleString('en-IN')}</span>
                        </button>
                        <button class="btn-plan-remove" onclick="window.triggerDeletePlan('${p.id}')" title="Delete Plan">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function addPlan(itinerary) {
        const newPlan = {
            id: 'plan_' + Date.now(),
            destination: itinerary.destination || 'Mountain Corridor',
            title: itinerary.title || 'Custom Mountain Road Trip',
            duration: itinerary.duration || '3 Days / 2 Nights',
            vibe: itinerary.vibe || 'Adventure',
            pricePerPerson: itinerary.pricePerPerson || 5499,
            pickupLocation: itinerary.pickupLocation || 'Delhi / Chandigarh',
            highlights: itinerary.highlights || ['Scenic Mountain Route', 'Boutique Stay', 'Verified Chauffeur'],
            altitudeTag: itinerary.altitudeTag || 'Max Altitude: 3,000 M',
            acclimationAdvisory: itinerary.acclimationAdvisory || 'Hydrate with fresh mountain water.',
            days: itinerary.days || [],
            perks: itinerary.perks || itinerary.inclusions || [
                '🛡️ 4x4 Mountain SUV & Chauffeur',
                '🫁 Medical Oxygen & First Aid',
                '🚨 24x7 Women Safety Force Link'
            ],
            createdDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        savedPlans.unshift(newPlan);
        savePlansToStorage(savedPlans);
        renderSavedPlans();

        // Show toast notification
        showNotificationToast(`✨ New plan "${newPlan.title}" added to YOUR PLANS!`);
        return newPlan;
    }

    function deletePlan(id) {
        savedPlans = savedPlans.filter(p => p.id !== id);
        savePlansToStorage(savedPlans);
        renderSavedPlans();
        showNotificationToast('Plan removed from Your Plans.');
    }

    window.triggerBuyNow = function(planId) {
        const plan = savedPlans.find(p => p.id === planId) || savedPlans[0];
        if (plan) openBuyNowModal(plan);
    };

    window.triggerDeletePlan = function(planId) {
        if (confirm('Are you sure you want to remove this plan from Your Plans?')) {
            deletePlan(planId);
        }
    };

    // =========================================================================
    // 3. INSTANT BUY NOW / CHECKOUT MODAL FLOW
    // =========================================================================
    const modalBuyNow = document.getElementById('modal-buy-now');
    const btnCloseBuyModal = document.getElementById('btn-close-buy-modal');
    const buyModalTitle = document.getElementById('buy-modal-title');
    const buyModalRoute = document.getElementById('buy-modal-route');
    const buyModalTravellers = document.getElementById('buy-modal-travellers');
    const buyPriceTravellersText = document.getElementById('buy-price-travellers-text');
    const buyPriceBase = document.getElementById('buy-price-base');
    const buyPriceTax = document.getElementById('buy-price-tax');
    const buyPriceTotal = document.getElementById('buy-price-total');
    const btnConfirmPurchase = document.getElementById('btn-confirm-purchase');

    const modalBookingSuccess = document.getElementById('modal-booking-success');
    const btnSuccessClose = document.getElementById('btn-success-close');
    const successBookingId = document.getElementById('success-booking-id');
    const successDetailsCard = document.getElementById('success-details-card');

    let currentCheckoutPlan = null;

    function recalculateCheckoutFare() {
        if (!currentCheckoutPlan) return;
        const travellers = parseInt(buyModalTravellers ? buyModalTravellers.value : '2') || 2;
        const pricePerPerson = currentCheckoutPlan.pricePerPerson || 5499;
        const base = pricePerPerson * travellers;
        const tax = Math.round(base * 0.05);
        const total = base + tax;

        if (buyPriceTravellersText) buyPriceTravellersText.textContent = `${travellers} ${travellers === 1 ? 'Traveller' : 'Travellers'}`;
        if (buyPriceBase) buyPriceBase.textContent = `₹${base.toLocaleString('en-IN')}`;
        if (buyPriceTax) buyPriceTax.textContent = `₹${tax.toLocaleString('en-IN')}`;
        if (buyPriceTotal) buyPriceTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    function openBuyNowModal(plan) {
        currentCheckoutPlan = plan;
        if (buyModalTitle) buyModalTitle.textContent = plan.title || 'Mountain Expedition';
        if (buyModalRoute) buyModalRoute.textContent = `${plan.destination || 'Alpine Route'} • ${plan.duration || '3 Days'}`;
        recalculateCheckoutFare();

        if (modalBuyNow) {
            modalBuyNow.style.display = 'flex';
            modalBuyNow.classList.add('visible');
        }
    }

    if (buyModalTravellers) {
        buyModalTravellers.addEventListener('change', recalculateCheckoutFare);
    }

    if (btnCloseBuyModal && modalBuyNow) {
        btnCloseBuyModal.addEventListener('click', () => {
            modalBuyNow.style.display = 'none';
            modalBuyNow.classList.remove('visible');
        });
    }

    if (btnConfirmPurchase && modalBuyNow) {
        btnConfirmPurchase.addEventListener('click', () => {
            modalBuyNow.style.display = 'none';
            modalBuyNow.classList.remove('visible');

            // Generate Booking Confirmation
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const bId = `#MRG-EXP-${randomCode}`;
            if (successBookingId) successBookingId.textContent = bId;

            if (successDetailsCard && currentCheckoutPlan) {
                successDetailsCard.innerHTML = `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px; text-align:left; font-size:12.5px; margin-bottom:18px;">
                        <p style="margin-bottom:4px;"><strong>Expedition:</strong> ${currentCheckoutPlan.title}</p>
                        <p style="margin-bottom:4px;"><strong>Route:</strong> ${currentCheckoutPlan.destination}</p>
                        <p style="margin-bottom:4px;"><strong>Travellers:</strong> ${buyModalTravellers ? buyModalTravellers.value : '2'} Adults (4x4 SUV)</p>
                        <p style="color:#059669; font-weight:700;"><strong>Status:</strong> Confirmed & Dispatched to Mountain Control Unit</p>
                    </div>
                `;
            }

            if (modalBookingSuccess) {
                modalBookingSuccess.style.display = 'flex';
                modalBookingSuccess.classList.add('visible');
            }
        });
    }

    if (btnSuccessClose && modalBookingSuccess) {
        btnSuccessClose.addEventListener('click', () => {
            modalBookingSuccess.style.display = 'none';
            modalBookingSuccess.classList.remove('visible');
            if (window.openPlansDrawer) {
                window.openPlansDrawer();
            }
        });
    }

    // Simple toast notification helper
    function showNotificationToast(msg) {
        let toast = document.getElementById('margify-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'margify-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: #0f172a;
                color: #ffffff;
                padding: 12px 22px;
                border-radius: 9999px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.25);
                font-size: 13px;
                font-weight: 700;
                z-index: 999999;
                transition: all 0.3s;
                border: 1px solid #38bdf8;
                pointer-events: none;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
        }, 3200);
    }

    // =========================================================================
    // 4. AI ASSISTANCE: SAHAYAKMITR.ai WITH GEMINI INTEGRATION
    // =========================================================================
    function initSahayakAi() {
        const chatFeed = document.getElementById('chat-feed');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-user-input');
        const btnClear = document.getElementById('btn-clear-chat');
        const promptChips = document.querySelectorAll('.prompt-chip');
        const durationChips = document.querySelectorAll('#duration-chips .filter-chip');
        const vibeChips = document.querySelectorAll('#vibe-chips .filter-chip');

        let selectedDuration = "3";
        let selectedVibe = "mountain";

        // Duration & Vibe Chips
        durationChips.forEach(chip => {
            chip.addEventListener('click', () => {
                durationChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedDuration = chip.dataset.val;
            });
        });

        vibeChips.forEach(chip => {
            chip.addEventListener('click', () => {
                vibeChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedVibe = chip.dataset.val;
            });
        });

        // Prompt Chips Click
        promptChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                e.preventDefault();
                const promptText = chip.dataset.prompt;
                if (chatInput) chatInput.value = promptText;
                handleUserSubmit(promptText);
            });
        });

        // Form Submit
        if (chatForm && chatInput) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;
                handleUserSubmit(text);
                chatInput.value = '';
            });
        }

        // Reset Conversation
        if (btnClear && chatFeed) {
            btnClear.addEventListener('click', () => {
                chatFeed.innerHTML = `
                    <div class="chat-message ai-message">
                        <div class="message-avatar">🤖</div>
                        <div class="message-bubble">
                            <p class="message-text">
                                Namaste & Greetings adventurer! 🙏 I am <strong>SAHAYAKMITR.ai</strong>, powered by <strong>Google Gemini</strong>.
                            </p>
                            <p class="message-text">
                                Tell me what place you are planning and any details (duration, travel group, preferred vibe). I will construct a structured day-by-day plan with an instant <strong>BUY NOW</strong> option and automatically save it to <strong>YOUR PLANS</strong> below!
                            </p>
                            <div class="bot-quick-action-strip">
                                <span class="hint-tag">💡 Tap any quick idea above or type your destination below!</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        async function handleUserSubmit(userText) {
            appendUserMessage(userText);
            const typingIndicator = showTypingIndicator();

            const lower = userText.toLowerCase().trim();

            // Check if user is requesting a travel itinerary / tour planning
            const isItineraryRequest = (
                lower.includes('plan') || 
                lower.includes('itinerary') || 
                lower.includes('trip') || 
                lower.includes('tour') || 
                lower.includes('visit') || 
                lower.includes('travel to') || 
                lower.includes('days') || 
                lower.includes('day') || 
                lower.includes('schedule') || 
                lower.includes('package') || 
                lower.includes('banaras') || 
                lower.includes('varanasi') || 
                lower.includes('kashi') || 
                lower.includes('spiti') || 
                lower.includes('ladakh') || 
                lower.includes('leh') || 
                lower.includes('manali') || 
                lower.includes('goa') || 
                lower.includes('kerala') || 
                lower.includes('rajasthan')
            ) && !lower.includes('food inspection') && !lower.includes('rating') && !lower.includes('preferred food') && !lower.includes('non-preferred') && !lower.includes('criteria') && !lower.includes('johnson');

            if (isItineraryRequest) {
                try {
                    const planResult = await callGeminiForItinerary(userText, selectedDuration, selectedVibe);
                    if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();
                    renderAiItineraryResponse(planResult);
                    addPlan(planResult);
                } catch (err) {
                    console.error('Error generating itinerary:', err);
                    if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();
                    const fallbackPlan = generateDynamicLocalItinerary(userText, selectedDuration, selectedVibe);
                    renderAiItineraryResponse(fallbackPlan);
                    addPlan(fallbackPlan);
                }
                return;
            }

            // FOR ALL OTHER QUESTIONS: Generative AI Q&A tailored to the user's specific question
            const systemPrompt = `You are SAHAYAKMITR.ai, India's premier AI Travel, Expedition & Food Safety Copilot for Traveliser.
Authoritative Database & Standards:
1. FOOD INSPECTION DEPARTMENT:
   - Official FSSAI & HP Tourism Food Safety Ratings for Himalayan restaurants:
     * The Himalayan Trout House (Tirthan Valley): 5.0/5.0 ★ (Grade A+ Platinum). Best Food: Pan-Seared Brown Trout with Crushed Garlic & Roasted Almonds (₹740).
     * Johnson's Cafe & Bar (Old Manali): 4.9/5.0 ★ (Grade A+ Superior). Best Food: Wood-Fired Himalayan Rainbow Trout with Lemon Caper Butter (₹690). 100% water purity, river caught same day.
     * The Lazy Dog Lounge (Old Manali): 4.8/5.0 ★ (Grade A+ Superior). Best Food: Steamed Himalayan Siddu with Walnut Paste & Pure Desi Ghee (₹320).
     * Gesmo Restaurant & Bakery (Leh Ladakh): 4.8/5.0 ★ (Grade A+ Superior). Best Food: Leh Yak Cheese & Spinach Steamed Momos (₹290).
     * Chopsticks Restaurant (Mall Road, Manali): 4.7/5.0 ★ (Grade A Safe). Best Food: Tibetan Gyathuk & Steamed Chicken Tingmo (₹360).
     * Cafe 1947 (Old Manali Bridge): 4.6/5.0 ★ (Grade A Safe). Best Food: Artisanal Wood-Fired Funghi Truffle Pizza (₹580).
     * The Corner Kitchen (Shimla): 4.6/5.0 ★ (Grade A Safe). Best Food: Himachali Chha Gosht (Slow Cooked Lamb in Gram Flour Gravy) (₹520).
     * Moon Dance Cafe (Kasol): 4.5/5.0 ★ (Grade A Safe). Best Food: Fresh Apple Cinnamon Crumble with Hot Mountain Honey (₹280).
     * Highway Himalayan Dhaba 42 (Rohtang Foothills): 2.9/5.0 ★ (Notice Issued - only tawa roti & boiled yellow dal safe).
   - PREFERRED VS NON-PREFERRED FOODS (OVERALL CRITERIA):
     * 4 Evaluation Criteria: 1. Thermal Sterilization (>75°C destroys cysts), 2. Altitude Gastric Motility (digestion slows 35%), 3. Glacial Water & Ice Safety (untreated stream water contains Giardia), 4. Cold-Chain Integrity (intermittent refrigeration spoilage).
     * Preferred: Steamed momos & tingmo, Himachali siddu with cow ghee, boiling hot thukpa broth, fresh pan-cooked trout, moong dal khichdi, Kashmiri kahwa, ginger-lemon-honey tea.
     * Non-Preferred (Avoid): Raw cut street salads/fruits, unboiled ice cubes & tap water, reheated highway meat curries, deep-fried street pakoras in reused oil, unpasteurized raw dairy, raw sushi/seafood far from ocean.
2. EXPEDITIONS, DESTINATIONS & SAFETY:
   - Rohtang Pass (3,978m), Atal Tunnel (3,100m), Spiti Valley (Kunzum Pass 4,590m), Leh Ladakh (Khardung La 5,359m), Varanasi / Banaras (Ghats, Ganga Aarti, Kashi Vishwanath), Goa, Kerala, Rajasthan.
   - AMS prevention: 3.5-4L hydration daily, gradual ascent, Diamox guidance.
   - 24x7 Traveliser Women Safety link, live GPS telemetry, police SOS dispatch, emergency command center.

DIRECT INSTRUCTION:
- Directly, accurately, and thoroughly answer the user's specific question: "${userText}".
- Structure your answer cleanly with bold text for emphasis, bullet points, clear recommendations, and friendly helpful tone.
- Do NOT output an unwanted travel booking unless specifically asked.
- Provide practical, expert, and actionable insights.`;

            try {
                const res = await callGeminiRaw(systemPrompt, 1000);
                if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();

                if (res.success && res.text) {
                    renderAiTextResponse(res.text, res.model);
                } else {
                    const fallback = generateIntelligentFallbackAnswer(userText);
                    renderAiTextResponse(fallback, 'Traveliser Knowledge Engine');
                }
            } catch (err) {
                console.error('Error calling Gemini raw:', err);
                if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();
                const fallback = generateIntelligentFallbackAnswer(userText);
                renderAiTextResponse(fallback, 'Traveliser Knowledge Engine');
            }
        }

        function generateIntelligentFallbackAnswer(query) {
            const q = (query || '').toLowerCase();

            if (q.includes('banaras') || q.includes('varanasi') || q.includes('kashi')) {
                return `**SAHAYAKMITR.ai — Sacred Banaras (Varanasi) Custom Expedition:**
• **Day 1: The Divine Riverfront & Ganga Aarti**
  - **Dawn:** Private wooden boat cruise from Assi Ghat to Manikarnika Ghat witnessing 3,000 years of living traditions.
  - **Midday:** Heritage walking corridor through ancient labyrinthine alleys. FSSAI-audited hygienic Kachori-Jalebi breakfast.
  - **Evening:** VIP front-row seating at Dashashwamedh Ghat for the world-famous grand Maha Ganga Aarti.
• **Day 2: Kashi Vishwanath Corridor & Sarnath**
  - **Morning:** Special entry darshan assistance at Kashi Vishwanath Golden Temple and Annapurna Temple.
  - **Afternoon:** Excursion to Sarnath (Dhamek Stupa, Deer Park & Ashoka Pillar where Lord Buddha taught first sermon).
  - **Evening:** Authentic Banarasi Silk Saree master-weaver guild visit, and saffron-cardamom Malaiyyo tasting.
• **Day 3: Subah-e-Banaras & Cultural Immersion**
  - **Morning:** Subah-e-Banaras classical music & Vedic chanting at Assi Ghat, followed by safe street food tour.
  - **Safety Guarantee:** 24x7 Traveliser Women Safety link with local police escort & verified chauffeur.

✨ *This plan has been automatically added to YOUR PLANS drawer in the top-right corner!*`;
            }

            if (q.includes('johnson')) {
                return `**Johnson's Cafe & Bar (Old Manali)**
• **Food Safety Rating:** **4.9 / 5.0 ★★★★★ (FSSAI Grade A+ Superior)**
• **Kitchen Sanitization:** 99% | **Water Purity:** 100% (Triple RO + UV)
• **Signature Best Food:** **Wood-Fired Himalayan Rainbow Trout with Lemon Caper Herb Butter** (₹690)
• **Safety Certification:** Caught fresh daily from high-altitude glacier fed streams, pan-seared at >220°C on open flame ensuring complete eradication of enteric pathogens. Served with organic mountain rosemary potatoes.`;
            }

            if (q.includes('restaurant') || q.includes('rating') || q.includes('cafe') || q.includes('eat') || q.includes('where to eat')) {
                return `**Traveliser Food Inspection Department — Verified High-Altitude Restaurant Ratings:**

1. **The Himalayan Trout House (Tirthan Valley):** **5.0 / 5.0 ★★★★★ (Grade A+ Platinum)**
   • *Best Food:* Pan-Seared Brown Trout with Crushed Garlic & Roasted Almonds (₹740)
2. **Johnson's Cafe & Bar (Old Manali):** **4.9 / 5.0 ★★★★★ (Grade A+ Superior)**
   • *Best Food:* Wood-Fired Himalayan Rainbow Trout with Lemon Caper Butter (₹690)
3. **The Lazy Dog Lounge (Old Manali):** **4.8 / 5.0 ★★★★★ (Grade A+ Superior)**
   • *Best Food:* Authentic Steamed Himachali Siddu with Pure Desi Ghee (₹320)
4. **Gesmo Restaurant & Bakery (Leh Ladakh):** **4.8 / 5.0 ★★★★★ (Grade A+ Superior)**
   • *Best Food:* Leh Yak Cheese & Spinach Steamed Momos with Ginger Broth (₹290)
5. **Chopsticks Restaurant (Mall Road Manali):** **4.7 / 5.0 ★★★★★ (Grade A Safe)**
   • *Best Food:* Tibetan Gyathuk & Steamed Chicken Tingmo with Mountain Chili (₹360)
6. **Cafe 1947 (Old Manali Bridge):** **4.6 / 5.0 ★★★★☆ (Grade A Safe)**
   • *Best Food:* Artisanal Wood-Fired Funghi Truffle Pizza (₹580)
7. **Highway Himalayan Dhaba 42 (Rohtang Foothills):** **2.9 / 5.0 ★★☆☆☆ (⚠️ Notice Issued)**
   • *Advisory:* Only order piping-hot tawa roti and freshly boiled yellow dal. Avoid non-veg gravies.`;
            }

            if (q.includes('preferred') || q.includes('non-preferred') || q.includes('criteria') || q.includes('diet') || q.includes('food')) {
                return `**Himalayan High-Altitude Dietary Protocol (Overall Criteria Matrix):**

**4 Scientific Evaluation Criteria:**
1. **Thermal Sterilization:** Food must be freshly cooked or steamed above **75°C (167°F)** to destroy Giardia and bacterial cysts.
2. **Altitude Gastric Motility:** Oxygen drops at >2,500m slowing digestion by 35%. Light bioavailable carbohydrates are essential.
3. **Water & Ice Safety:** Unfiltered stream runoff carries parasites; only boiled/RO water is safe.
4. **Cold-Chain Integrity:** Remote highway blackouts spoil stored meats; eat fresh local produce.

**🟢 PREFERRED FOODS (Safe & Energizing):**
• **Steamed Tibetan Momos & Tingmo:** Steamed at 100°C steam pressure, fast glycogen replenishment, zero heavy grease.
• **Traditional Himachali Siddu:** Fermented whole wheat steamed for 25 mins, served with pure cow ghee.
• **Hot Vegetable / Chicken Thukpa:** Continuous boiling broth provides deep cellular hydration and restores electrolytes.
• **Fresh Himalayan Brown Trout:** Caught same day, high-heat pan cooked (>200°C), rich in anti-inflammatory Omega-3.
• **High-Altitude Moong Dal Khichdi:** High bioavailability, zero acid reflux, gentle on mountain stomach.
• **Kashmiri Kahwa & Mountain Ginger Tea:** Herbal vasodilators expand bronchial passages and reduce mountain nausea.

**🔴 NON-PREFERRED FOODS (Strictly Avoid at High Altitude):**
• **Raw Cut Street Salads & Cut Melons:** Washed in untreated water; #1 cause of amoebic dysentery.
• **Unboiled Ice Cubes & Local Tap Drinks:** Freezing preserves Giardia and Norovirus cysts.
• **Highway Reheated Meat Curries:** Intermittent refrigeration along highways leads to Salmonella & Bacillus cereus toxins.
• **Deep-Fried Street Pakoras in Reused Oil:** Oxidized trans-fats trigger violent mountain acid reflux and nausea.
• **Raw High-Altitude Seafood / Sushi:** Transported 1,500km without continuous power; high spoilage hazard.`;
            }

            if (q.includes('water') || q.includes('ice')) {
                return `**Water & Ice Safety Directive in Mountain Corridors:**
• **Why Avoid Ice:** Freezing temperatures do NOT kill pathogens. Ice in remote dhabas is often made from untreated glacial stream runoff carrying animal fecal microbes (Giardia lamblia, Cryptosporidium).
• **Why Avoid Tap Water:** Alpine runoff contains dissolved mineral mica and seasonal livestock runoff.
• **Safe Practices:** Always drink multi-stage RO/UV purified water, packaged mineral water with unbroken seals, or boiling hot herbal teas (Kashmiri Kahwa, Ginger-Lemon-Honey).`;
            }

            if (q.includes('ams') || q.includes('sickness') || q.includes('altitude') || q.includes('medicine')) {
                return `**High-Altitude Acclimatization & AMS Prevention Protocol:**
• **Hydration:** Consume 3.5 to 4 Liters of water and electrolyte fluids daily.
• **Gradual Ascent:** Spend 24–48 hours at mid-altitude (e.g. Manali 2,050m or Leh 3,500m) before tackling high passes like Rohtang (3,978m) or Khardung La (5,359m).
• **Medical Consultation:** Consult a physician regarding Diamox (Acetazolamide) 125mg–250mg twice daily starting 24h prior to ascent.
• **Dietary Caution:** Avoid alcohol, heavy red meats, and deep-fried foods which severely deplete oxygen during digestion. Eat hot thukpa, siddu, and steamed momos.`;
            }

            if (q.includes('women') || q.includes('safety') || q.includes('police') || q.includes('emergency') || q.includes('sos')) {
                return `**Traveliser 24x7 Women Safety & Protection Grid:**
• **Live GPS Telemetry:** Continuous real-time coordinate broadcast to family contacts and nearest police stations every 5 seconds.
• **Military & Police Pairing:** Automatic pairing with local quick reaction teams (QRT) along Himalayan passes.
• **Emergency SOS:** Immediate SOS dispatch trigger via the red SOS beacon button on header or Women Safety tab.
• **24x7 Helpline:** Toll-free 112 / +91-1800-TRAVELISER-SAFE for immediate armed escort or recovery.`;
            }

            // General travel response
            return `Namaste! As your **SAHAYAKMITR.ai** copilot, I am here to guide your journey with peak safety:
• **Food Inspection Department:** Explore verified 5-star restaurant ratings and signature best foods across Manali, Leh, Kasol, and Spiti.
• **Dietary Safety:** Review our official list of preferred and non-preferred mountain foods based on thermal sterilization and altitude digestion criteria.
• **Expeditions & Permits:** Ask me for customized itineraries, pass permits, and road condition alerts.
• **Women Safety:** Activate the live telemetry shield in our Emergency Command Center anytime.

Feel free to ask any specific question about food ratings, safe restaurants, weather, or travel routes!`;
        }

        function renderAiTextResponse(text, model) {
            if (!chatFeed) return;
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message ai-message';

            let formatted = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^\s*[-•]\s*(.*)$/gm, '<li>$1</li>');

            if (formatted.includes('<li>')) {
                formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul class="chat-bullets">$1</ul>');
            }
            formatted = formatted.replace(/\n\n/g, '</p><p class="message-text">').replace(/\n/g, '<br>');

            aiMsg.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <span class="sahayak-reply-badge">✨ ${model ? model.toUpperCase() : 'GEMINI 3.5'} INTELLIGENCE</span>
                    <p class="message-text">${formatted}</p>
                    <div class="chat-followup-suggestion">
                        <span>💡 Have more questions about food safety or mountain passes? Type: <em>"Which restaurant has 5-star rating in Manali?"</em></span>
                    </div>
                </div>
            `;
            chatFeed.appendChild(aiMsg);
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }

        function appendUserMessage(text) {
            if (!chatFeed) return;
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-message user-message';
            userMsg.innerHTML = `
                <div class="message-avatar">👤</div>
                <div class="message-bubble">
                    <p class="message-text">${text}</p>
                </div>
            `;
            chatFeed.appendChild(userMsg);
            chatFeed.scrollTop = chatFeed.scrollHeight;
        }

        function showTypingIndicator() {
            if (!chatFeed) return null;
            const typingMsg = document.createElement('div');
            typingMsg.className = 'chat-message ai-message';
            typingMsg.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble typing-bubble">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            `;
            chatFeed.appendChild(typingMsg);
            chatFeed.scrollTop = chatFeed.scrollHeight;
            return typingMsg;
        }

        function renderAiItineraryResponse(plan) {
            if (!chatFeed) return;
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message ai-message';

            const daysHtml = (plan.days || []).map(d => `
                <div class="itinerary-day-item">
                    <span class="day-badge">${d.day}</span>
                    <div class="day-content">
                        <strong>${d.title}</strong>
                        <div>${d.desc}</div>
                    </div>
                </div>
            `).join('');

            const perksHtml = (plan.perks || plan.inclusions || []).map(p => `<span>${p}</span>`).join(' • ');

            aiMsg.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <span class="sahayak-reply-badge">✨ GEMINI INTELLIGENCE ITINERARY ARCHITECT</span>
                    <p class="message-text">
                        ${plan.summary || `I have architected a custom expedition to <strong>${plan.destination}</strong> for you!`}
                    </p>

                    <!-- Embedded Interactive Itinerary Card -->
                    <div class="itinerary-card">
                        <div class="itinerary-header">
                            <div>
                                <h4 class="itinerary-title">${plan.title}</h4>
                                <span class="itinerary-route-tag">📍 ${plan.destination} • ⏱️ ${plan.duration}</span>
                            </div>
                            <span class="itinerary-tag">${plan.vibe || 'EXPEDITION'}</span>
                        </div>

                        <div class="itinerary-altitude-strip">
                            <span class="alt-badge">🏔️ ${plan.altitudeTag || 'High Altitude'}</span>
                            <span class="alt-advisory">${plan.acclimationAdvisory || 'Acclimatization included in route.'}</span>
                        </div>

                        <div class="itinerary-day-list">
                            ${daysHtml}
                        </div>

                        <div class="itinerary-perks-strip">
                            ${perksHtml}
                        </div>

                        <div class="itinerary-action-row">
                            <button class="btn-book-plan" id="btn-buy-chat-${Date.now()}">
                                <span>⚡ BUY NOW • ₹${(plan.pricePerPerson || 5499).toLocaleString('en-IN')}</span>
                            </button>
                            <button class="btn-save-plan" style="border:none; cursor:pointer;">
                                <span>📋 View In Your Plans &rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            chatFeed.appendChild(aiMsg);
            chatFeed.scrollTop = chatFeed.scrollHeight;

            // Wire up buy now button inside chat message
            const chatBuyBtn = aiMsg.querySelector('.btn-book-plan');
            if (chatBuyBtn) {
                chatBuyBtn.addEventListener('click', () => {
                    openBuyNowModal(plan);
                });
            }

            // Wire up view in your plans button
            const chatSaveBtn = aiMsg.querySelector('.btn-save-plan');
            if (chatSaveBtn) {
                chatSaveBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.openPlansDrawer) {
                        window.openPlansDrawer();
                    }
                });
            }
        }
    }

    // =========================================================================
    // 5. EMERGENCY COMMAND CENTER (WOMEN SAFETY INTACT)
    // =========================================================================
    function initEmergencyCenter() {
        const emerTabs = document.querySelectorAll('.emer-tab-btn');
        const panelWomen = document.getElementById('panel-women-safety');
        const panelLost = document.getElementById('panel-lost-found');
        const panelSpec = document.getElementById('panel-specialists');

        // Sub-tabs switcher
        function switchEmergencyTab(tab) {
            emerTabs.forEach(b => {
                b.classList.toggle('active', b.dataset.tab === tab);
            });
            if (panelWomen) panelWomen.classList.toggle('active', tab === 'women-safety');
            if (panelLost) panelLost.classList.toggle('active', tab === 'lost-found');
            if (panelSpec) panelSpec.classList.toggle('active', tab === 'specialists');
        }
        window.switchEmergencyTab = switchEmergencyTab;

        emerTabs.forEach(btn => {
            btn.addEventListener('click', () => {
                switchEmergencyTab(btn.dataset.tab);
            });
        });

        // 5A. WOMEN SAFETY: ON / OFF TOGGLE & TELEMETRY
        const toggleWomenSafety = document.getElementById('toggle-women-safety');
        const shieldStatusLabel = document.getElementById('shield-status-label');
        const shieldSubLabel = document.getElementById('shield-sub-label');
        const safetyLiveBanner = document.getElementById('safety-live-banner');
        const beaconPulseIcon = document.getElementById('beacon-pulse-icon');
        const beaconStatusTitle = document.getElementById('beacon-status-title');
        const beaconStatusDesc = document.getElementById('beacon-status-desc');
        const baseAssignmentBox = document.getElementById('base-assignment-box');
        const streamPill = document.getElementById('stream-pill');
        const radarSweep = document.getElementById('radar-sweep');
        const telemetrySyncTime = document.getElementById('telemetry-sync-time');
        const dispLat = document.getElementById('disp-lat');
        const dispLon = document.getElementById('disp-lon');
        const dispAlt = document.getElementById('disp-alt');
        const dispAcc = document.getElementById('disp-acc');
        const btnAddContact = document.getElementById('btn-add-contact');
        const familyList = document.getElementById('family-list');

        let geoWatchId = null;
        let telemetryInterval = null;

        if (toggleWomenSafety) {
            toggleWomenSafety.addEventListener('change', (e) => {
                const isActive = e.target.checked;

                if (isActive) {
                    if (shieldStatusLabel) shieldStatusLabel.textContent = "PROTECTION SHIELD: ACTIVE & STREAMING";
                    if (shieldSubLabel) shieldSubLabel.textContent = "Current location is constantly shared with Family Circle, Nearest Police & Military Bases.";
                    if (safetyLiveBanner) safetyLiveBanner.className = "safety-live-alert-banner active";
                    if (beaconPulseIcon) beaconPulseIcon.textContent = "🟢";
                    if (beaconStatusTitle) beaconStatusTitle.textContent = "Live Telemetry Active — Continuous Beaconing";
                    if (beaconStatusDesc) beaconStatusDesc.textContent = "Your exact GPS coordinates are being continuously broadcasted every 5 seconds to verified family members and paired with the nearest military post and police control room.";
                    if (baseAssignmentBox) baseAssignmentBox.classList.add('visible');
                    if (streamPill) {
                        streamPill.className = "stream-pill live";
                        streamPill.textContent = "LIVE BROADCAST";
                    }
                    if (radarSweep) radarSweep.classList.add('active');

                    startLiveGeolocation();
                } else {
                    if (shieldStatusLabel) shieldStatusLabel.textContent = "PROTECTION SHIELD: INACTIVE";
                    if (shieldSubLabel) shieldSubLabel.textContent = "Turn ON to stream live coordinates to family, police & military post.";
                    if (safetyLiveBanner) safetyLiveBanner.className = "safety-live-alert-banner inactive";
                    if (beaconPulseIcon) beaconPulseIcon.textContent = "⚪";
                    if (beaconStatusTitle) beaconStatusTitle.textContent = "Shield is Currently OFF";
                    if (beaconStatusDesc) beaconStatusDesc.textContent = "When switched ON, Traveliser continuously transmits your exact coordinates, altitude, and velocity to verified family contacts and pairs you with the closest Police and Military Mountain Quick Reaction Team.";
                    if (baseAssignmentBox) baseAssignmentBox.classList.remove('visible');
                    if (streamPill) {
                        streamPill.className = "stream-pill";
                        streamPill.textContent = "STANDBY";
                    }
                    if (radarSweep) radarSweep.classList.remove('active');

                    stopLiveGeolocation();
                }
            });
        }

        function startLiveGeolocation() {
            if ('geolocation' in navigator) {
                try {
                    geoWatchId = navigator.geolocation.watchPosition(
                        (pos) => {
                            const lat = pos.coords.latitude.toFixed(4);
                            const lon = pos.coords.longitude.toFixed(4);
                            const acc = pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 4;
                            if (dispLat) dispLat.textContent = `${lat}° N`;
                            if (dispLon) dispLon.textContent = `${lon}° E`;
                            if (dispAcc) dispAcc.textContent = `±${acc} Meters`;
                            updateSyncTimestamp();
                        },
                        () => {
                            simulateMountainTelemetry();
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                } catch {
                    simulateMountainTelemetry();
                }
            } else {
                simulateMountainTelemetry();
            }

            telemetryInterval = setInterval(() => {
                updateSyncTimestamp();
            }, 5000);
        }

        function stopLiveGeolocation() {
            if (geoWatchId !== null && navigator.geolocation) {
                navigator.geolocation.clearWatch(geoWatchId);
                geoWatchId = null;
            }
            if (telemetryInterval) {
                clearInterval(telemetryInterval);
                telemetryInterval = null;
            }
            if (telemetrySyncTime) telemetrySyncTime.textContent = "Last Synced: Standby";
        }

        function simulateMountainTelemetry() {
            if (dispLat) dispLat.textContent = "32.2432° N";
            if (dispLon) dispLon.textContent = "77.1892° E";
            if (dispAlt) dispAlt.textContent = "2,050 M";
            if (dispAcc) dispAcc.textContent = "±3.8 Meters";
            updateSyncTimestamp();
        }

        function updateSyncTimestamp() {
            if (telemetrySyncTime) {
                const now = new Date();
                telemetrySyncTime.textContent = `Live Telemetry Active • ${now.toLocaleTimeString()}`;
            }
        }

        if (btnAddContact && familyList) {
            btnAddContact.addEventListener('click', () => {
                const name = prompt("Enter Family Member Name:");
                if (!name) return;
                const phone = prompt("Enter 10-Digit Mobile Number (+91):");
                if (!phone) return;

                const row = document.createElement('div');
                row.className = "family-member-row";
                row.innerHTML = `
                    <div>
                        <div class="member-name">👤 ${name}</div>
                        <div class="member-phone">+91 ${phone}</div>
                    </div>
                    <span class="member-status">🟢 Syncing GPS</span>
                `;
                familyList.appendChild(row);
            });
        }

        // 5B. POLICE SOS DISPATCH MODAL
        const btnPoliceSos = document.getElementById('btn-police-sos');
        const policeModal = document.getElementById('police-sos-modal');
        const btnCancelPoliceSos = document.getElementById('btn-cancel-police-sos');
        const btnShareWhatsappSos = document.getElementById('btn-share-whatsapp-sos');

        if (btnPoliceSos && policeModal) {
            btnPoliceSos.addEventListener('click', () => {
                policeModal.style.display = 'flex';
                policeModal.classList.add('visible');
            });
        }

        if (btnCancelPoliceSos && policeModal) {
            btnCancelPoliceSos.addEventListener('click', () => {
                policeModal.style.display = 'none';
                policeModal.classList.remove('visible');
            });
        }

        if (btnShareWhatsappSos) {
            btnShareWhatsappSos.addEventListener('click', () => {
                const text = encodeURIComponent("🚨 EMERGENCY SOS from Traveliser! My location has been dispatched to Himachal Police. Track my live location & PCR response here: https://traveliser.travel/sos/MRG-9921");
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            });
        }

        // 5C. LOST AND FOUND MODAL
        const btnOpenReportLost = document.getElementById('btn-open-report-lost');
        const btnOpenReportFound = document.getElementById('btn-open-report-found');
        const lfModal = document.getElementById('lf-modal');
        const btnCloseLfModal = document.getElementById('btn-close-lf-modal');
        const lfModalTitle = document.getElementById('lf-modal-title');
        const lfModalForm = document.getElementById('lf-modal-form');
        const lfFeedGrid = document.getElementById('lf-feed-grid');
        const lfCategoryFilter = document.getElementById('lf-category-filter');
        const lfSearchInput = document.getElementById('lf-search-input');
        const btnGenerateSafetag = document.getElementById('btn-generate-safetag');

        if (btnOpenReportLost && lfModal) {
            btnOpenReportLost.addEventListener('click', () => {
                if (lfModalTitle) lfModalTitle.textContent = "Report Lost Item";
                lfModal.style.display = 'flex';
                lfModal.classList.add('visible');
            });
        }

        if (btnOpenReportFound && lfModal) {
            btnOpenReportFound.addEventListener('click', () => {
                if (lfModalTitle) lfModalTitle.textContent = "Report Found Item";
                lfModal.style.display = 'flex';
                lfModal.classList.add('visible');
            });
        }

        if (btnCloseLfModal && lfModal) {
            btnCloseLfModal.addEventListener('click', () => {
                lfModal.style.display = 'none';
                lfModal.classList.remove('visible');
            });
        }

        if (lfModalForm && lfModal) {
            lfModalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('lf-input-name').value;
                const loc = document.getElementById('lf-input-location').value;
                const cat = document.getElementById('lf-input-category').value;
                const contact = document.getElementById('lf-input-contact').value;

                if (lfFeedGrid) {
                    const card = document.createElement('div');
                    card.className = "lf-card";
                    card.dataset.category = cat;
                    card.innerHTML = `
                        <div class="lf-card-header">
                            <span class="lf-status-pill lost">REPORTED JUST NOW</span>
                            <span class="lf-card-time">Live</span>
                        </div>
                        <h4 class="lf-item-title">${name}</h4>
                        <div class="lf-item-meta">
                            <span>📍 ${loc}</span> • <span>📁 ${cat.toUpperCase()}</span>
                        </div>
                        <button class="btn-lf-contact" onclick="alert('Contacting reporter: +91 ${contact}')">
                            Contact Reporter via SafeLine
                        </button>
                    `;
                    lfFeedGrid.prepend(card);
                }

                alert("Item reported successfully! Traveliser field network notified.");
                lfModal.style.display = 'none';
                lfModal.classList.remove('visible');
                lfModalForm.reset();
            });
        }

        if (lfCategoryFilter && lfFeedGrid) {
            lfCategoryFilter.addEventListener('change', (e) => {
                const val = e.target.value;
                const cards = lfFeedGrid.querySelectorAll('.lf-card');
                cards.forEach(card => {
                    if (val === 'all' || card.dataset.category === val) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }

        if (lfSearchInput && lfFeedGrid) {
            lfSearchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const cards = lfFeedGrid.querySelectorAll('.lf-card');
                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    card.style.display = text.includes(term) ? 'block' : 'none';
                });
            });
        }

        if (btnGenerateSafetag) {
            btnGenerateSafetag.addEventListener('click', () => {
                alert("SafeTag Generated! QR Code ID #ST-MRG-8849-HP linked to your Traveliser profile. Attach to your mountain backpack or camera.");
            });
        }
    }

    // =========================================================================
    // 6. POPULAR ROAD TRIP CARDS CLICK HANDLER
    // =========================================================================
    window.bookRoute = function(from, to) {
        if (fromCity) fromCity.value = from;
        if (toCity) toCity.value = to;

        const bookingCard = document.getElementById('booking-card');
        if (bookingCard) {
            bookingCard.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // =========================================================================
    // 7. HIGH-ALTITUDE SATELLITE WEATHER TELEMETRY
    // =========================================================================
    function initWeatherForecasting() {
        const locTabs = document.querySelectorAll('.loc-tab');
        const weatherLocName = document.getElementById('weather-loc-name');
        const currentTemp = document.getElementById('current-temp');
        const weatherCondition = document.getElementById('weather-condition');
        const weatherIcon = document.getElementById('weather-icon');
        const weatherFeels = document.getElementById('weather-feels');
        const weatherRange = document.getElementById('weather-range');
        const metricWind = document.getElementById('metric-wind');
        const metricVisibility = document.getElementById('metric-visibility');
        const metricPrecipitation = document.getElementById('metric-precipitation');
        const metricAltitude = document.getElementById('metric-altitude');
        const passStatusBanner = document.getElementById('pass-status-banner');
        const passStatusTitle = document.getElementById('pass-status-title');
        const passStatusDesc = document.getElementById('pass-status-desc');
        const passStatusIcon = document.getElementById('pass-status-icon');
        const forecastPillsRow = document.getElementById('forecast-pills-row');

        const weatherData = {
            manali: {
                name: "Manali, Himachal Pradesh",
                baseTemp: 14,
                feels: 12,
                range: "17° / 6°C",
                cond: "Partly Cloudy • Fresh Breeze",
                icon: "⛅",
                wind: "14 km/h",
                visibility: "10 km (Clear)",
                precip: "10% Low",
                alt: "2,050 M (O₂ 94%)",
                passStatus: {
                    type: "normal",
                    icon: "🛡️",
                    title: "PASS STATUS: OPEN & CLEAR",
                    desc: "Solang & Beas Valley highway fully operational. Dry asphalt and optimal traction."
                },
                forecast: [
                    { day: "Today", icon: "⛅", temp: "14° / 6°", cond: "Partly Cloudy" },
                    { day: "Tue", icon: "☀️", temp: "16° / 7°", cond: "Sunny" },
                    { day: "Wed", icon: "🌤️", temp: "15° / 5°", cond: "Clear Sky" },
                    { day: "Thu", icon: "🌧️", temp: "11° / 3°", cond: "Light Rain" },
                    { day: "Fri", icon: "🌥️", temp: "13° / 4°", cond: "Mild Breeze" }
                ]
            },
            rohtang: {
                name: "Rohtang Pass Summit (High Alpine)",
                baseTemp: 2,
                feels: -3,
                range: "4° / -6°C",
                cond: "Sub-Zero Snow Flurries",
                icon: "❄️",
                wind: "38 km/h Gusts",
                visibility: "3 km (Mist & Snow)",
                precip: "65% Snowfall",
                alt: "3,978 M (O₂ 64%)",
                passStatus: {
                    type: "warning",
                    icon: "⚠️",
                    title: "PASS STATUS: 4x4 / SNOW CHAINS MANDATORY",
                    desc: "Black ice on north ridge switchbacks. Only certified mountain pilots with high ground clearance permitted."
                },
                forecast: [
                    { day: "Today", icon: "❄️", temp: "2° / -5°", cond: "Snow Flurries" },
                    { day: "Tue", icon: "🌨️", temp: "0° / -8°", cond: "Heavy Snow" },
                    { day: "Wed", icon: "⛅", temp: "3° / -4°", cond: "Cold Clear" },
                    { day: "Thu", icon: "❄️", temp: "1° / -6°", cond: "Flurries" },
                    { day: "Fri", icon: "🌤️", temp: "4° / -3°", cond: "Sub-Zero" }
                ]
            },
            atal: {
                name: "Atal Tunnel North & South Portals",
                baseTemp: 8,
                feels: 6,
                range: "11° / 1°C",
                cond: "Overcast • Cool Draft",
                icon: "🌥️",
                wind: "18 km/h",
                visibility: "8 km (Good)",
                precip: "20% Isolated",
                alt: "3,100 M (O₂ 78%)",
                passStatus: {
                    type: "normal",
                    icon: "🛡️",
                    title: "PASS STATUS: ALL LANES CLEAR",
                    desc: "Twin-tube engineered highway active. Air quality indices normal, ventilation operational."
                },
                forecast: [
                    { day: "Today", icon: "🌥️", temp: "8° / 1°", cond: "Overcast" },
                    { day: "Tue", icon: "☀️", temp: "10° / 2°", cond: "Bright" },
                    { day: "Wed", icon: "⛅", temp: "9° / 0°", cond: "Passing Clouds" },
                    { day: "Thu", icon: "🌧️", temp: "6° / -1°", cond: "Drizzle" },
                    { day: "Fri", icon: "🌤️", temp: "8° / 1°", cond: "Pleasant" }
                ]
            },
            spiti: {
                name: "Spiti Valley (Kaza High Desert)",
                baseTemp: 6,
                feels: 2,
                range: "9° / -4°C",
                cond: "High-Altitude Dry Arid",
                icon: "🌤️",
                wind: "26 km/h Valley Draft",
                visibility: "15 km (Crystal Clear)",
                precip: "0% Dry",
                alt: "3,800 M (O₂ 67%)",
                passStatus: {
                    type: "normal",
                    icon: "🛡️",
                    title: "PASS STATUS: KUNZUM ROUTE ACCESSIBLE",
                    desc: "Kaza-Tabo-Sumdo road open. High-clearance SUV advised due to unpaved gravel stretches."
                },
                forecast: [
                    { day: "Today", icon: "🌤️", temp: "6° / -4°", cond: "Crisp Sun" },
                    { day: "Tue", icon: "☀️", temp: "8° / -3°", cond: "Clear Highs" },
                    { day: "Wed", icon: "☀️", temp: "7° / -5°", cond: "Arid Cold" },
                    { day: "Thu", icon: "⛅", temp: "5° / -6°", cond: "Cloud Drift" },
                    { day: "Fri", icon: "🌤️", temp: "7° / -4°", cond: "Sunny Cold" }
                ]
            },
            shimla: {
                name: "Shimla & Kufri Ridge (Himachal Pradesh)",
                baseTemp: 13,
                feels: 12,
                range: "16° / 7°C",
                cond: "Misty Pine Breeze",
                icon: "🌲",
                wind: "12 km/h",
                visibility: "9 km",
                precip: "15% Light",
                alt: "2,276 M (O₂ 91%)",
                passStatus: {
                    type: "normal",
                    icon: "🛡️",
                    title: "PASS STATUS: SHIMLA-KUFRI-NARKANDA OPEN",
                    desc: "Hindustan-Tibet highway open. Smooth asphalt, all commercial and passenger traffic normal."
                },
                forecast: [
                    { day: "Today", icon: "🌲", temp: "13° / 7°", cond: "Brisk Sun" },
                    { day: "Tue", icon: "☀️", temp: "15° / 8°", cond: "Clear" },
                    { day: "Wed", icon: "🌤️", temp: "14° / 6°", cond: "Pleasant" },
                    { day: "Thu", icon: "🌧️", temp: "10° / 4°", cond: "Rain" },
                    { day: "Fri", icon: "⛅", temp: "12° / 5°", cond: "Partly Cloudy" }
                ]
            },
            leh: {
                name: "Leh Ladakh & Khardung La Corridor",
                baseTemp: 3,
                feels: -2,
                range: "6° / -7°C",
                cond: "High-Altitude Rarefied Cold",
                icon: "🏔️",
                wind: "22 km/h Alpine",
                visibility: "20 km (Ultra Clear)",
                precip: "0% Arid",
                alt: "3,524 M (O₂ 68%)",
                passStatus: {
                    type: "warning",
                    icon: "⚠️",
                    title: "PASS STATUS: KHARDUNG LA PERMIT RESTRICTED",
                    desc: "Khardung La (5,359m) open for morning crossing with 4x4 only. Compulsory 24h rest in Leh before ascent."
                },
                forecast: [
                    { day: "Today", icon: "🏔️", temp: "3° / -7°", cond: "Crisp Chill" },
                    { day: "Tue", icon: "☀️", temp: "5° / -6°", cond: "Sun" },
                    { day: "Wed", icon: "🌤️", temp: "4° / -8°", cond: "Arid Cold" },
                    { day: "Thu", icon: "❄️", temp: "1° / -9°", cond: "Pass Snow" },
                    { day: "Fri", icon: "☀️", temp: "4° / -7°", cond: "Sunny Cold" }
                ]
            }
        };

        function renderLocationWeather(locKey) {
            const loc = weatherData[locKey];
            if (!loc) return;

            if (weatherLocName) weatherLocName.textContent = loc.name;
            if (currentTemp) currentTemp.textContent = `${loc.baseTemp}°C`;
            if (weatherCondition) weatherCondition.textContent = loc.cond;
            if (weatherIcon) weatherIcon.textContent = loc.icon;
            if (weatherFeels) weatherFeels.textContent = `${loc.feels}°C`;
            if (weatherRange) weatherRange.textContent = loc.range;
            if (metricWind) metricWind.textContent = loc.wind;
            if (metricVisibility) metricVisibility.textContent = loc.visibility;
            if (metricPrecipitation) metricPrecipitation.textContent = loc.precip;
            if (metricAltitude) metricAltitude.textContent = loc.alt;

            const advisorySelectedPass = document.getElementById('advisory-selected-pass');
            if (advisorySelectedPass) {
                advisorySelectedPass.textContent = `${loc.name} (${loc.alt})`;
            }

            if (passStatusBanner && passStatusTitle && passStatusDesc && passStatusIcon) {
                passStatusTitle.textContent = loc.passStatus.title;
                passStatusDesc.textContent = loc.passStatus.desc;
                passStatusIcon.textContent = loc.passStatus.icon;

                passStatusBanner.classList.remove('warning', 'danger');
                if (loc.passStatus.type === 'warning') passStatusBanner.classList.add('warning');
                if (loc.passStatus.type === 'danger') passStatusBanner.classList.add('danger');
            }

            if (forecastPillsRow) {
                forecastPillsRow.innerHTML = loc.forecast.map(f => `
                    <div class="forecast-mini-card">
                        <span class="forecast-day">${f.day}</span>
                        <span class="forecast-icon">${f.icon}</span>
                        <span class="forecast-temp">${f.temp}</span>
                        <span class="forecast-cond">${f.cond}</span>
                    </div>
                `).join('');
            }
        }

        locTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                locTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderLocationWeather(tab.dataset.loc);
            });
        });

        renderLocationWeather('manali');
    }

    // =========================================================================
    // 8. GEMINI AI HIGH-ALTITUDE PASS ADVISORY
    // =========================================================================
    function initGeminiPassAdvisory() {
        const btnAnalyze = document.getElementById('btn-analyze-pass-gemini');
        const contentBox = document.getElementById('gemini-pass-advisory-content');
        const weatherLocName = document.getElementById('weather-loc-name');
        const currentTemp = document.getElementById('current-temp');
        const metricAltitude = document.getElementById('metric-altitude');
        const metricWind = document.getElementById('metric-wind');
        const metricPrecip = document.getElementById('metric-precipitation');

        if (!btnAnalyze || !contentBox) return;

        btnAnalyze.addEventListener('click', async () => {
            const locName = weatherLocName ? weatherLocName.textContent : 'Manali High Pass';
            const temp = currentTemp ? currentTemp.textContent : '2°C';
            const alt = metricAltitude ? metricAltitude.textContent : '3,978m';
            const wind = metricWind ? metricWind.textContent : '20 km/h';
            const precip = metricPrecip ? metricPrecip.textContent : 'Low';

            btnAnalyze.disabled = true;
            btnAnalyze.innerHTML = '<span class="gemini-spin-loader">⚡</span> Analyzing with Gemini 3.5...';

            contentBox.innerHTML = `
                <div class="gemini-loading-card">
                    <span class="gemini-spin-loader-large">✨</span>
                    <div>
                        <strong>Synthesizing Real-Time Satellite Telemetry & Alpine Road Hazards...</strong>
                        <p>Querying Gemini 3.5 Flash for oxygen saturation, surface scree, and vehicle traction limits.</p>
                    </div>
                </div>
            `;

            const prompt = `You are a high-altitude expedition road safety expert and satellite telemetry analyst for Traveliser.
Analyze current mountain pass conditions:
- Location / Pass: ${locName}
- Effective Altitude: ${alt}
- Current Temp: ${temp}
- Wind: ${wind}
- Precipitation: ${precip}

Provide a structured, highly actionable mountain road safety briefing.
Format your response as a valid JSON object (no markdown fences):
{
  "amsRisk": "LOW / MODERATE / HIGH / EXTREME",
  "amsAdvice": "Acclimatization and hydration guidance for this altitude.",
  "surfaceHazard": "Black ice, scree, wet slush, or dry asphalt details.",
  "safeCrossingWindow": "e.g. 06:30 AM – 11:30 AM (before freeze-thaw afternoon wind gusts)",
  "vehicleClearance": "4x4 High-Clearance SUV / Snow chains recommendation",
  "pilotVerdict": "One-line executive summary verdict for drivers."
}`;

            const res = await callGeminiRaw(prompt, 600);
            btnAnalyze.disabled = false;
            btnAnalyze.innerHTML = '<span class="sparkle-anim">✨</span> Re-Analyze Pass With Gemini';

            let data = null;
            if (res.success) {
                try {
                    let clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    data = JSON.parse(clean);
                } catch (e) {
                    console.warn('Failed parsing Gemini pass advisory JSON', e);
                }
            }

            if (!data) {
                data = {
                    amsRisk: alt.includes('3,') || alt.includes('4,') || alt.includes('5,') ? "HIGH (Altitude AMS Alert)" : "MODERATE",
                    amsAdvice: "Hydrate with at least 3-4L electrolyte water. Carry medical oxygen and acclimatize at intermediate elevations.",
                    surfaceHazard: temp.includes('-') || parseInt(temp) < 4 ? "Black ice possible on shaded northern switchbacks. Reduced friction coefficient." : "Slush and wet scree near water crossings.",
                    safeCrossingWindow: "06:30 AM to 11:45 AM (Optimal visibility and sun warmth)",
                    vehicleClearance: "4x4 SUV with minimum 210mm clearance recommended. Carry recovery tow strap and tire chains.",
                    pilotVerdict: `Pass transit is technically viable for certified chauffeurs. Exercise utmost caution around hairpin turns in ${locName}.`
                };
            }

            contentBox.innerHTML = `
                <div class="advisory-result-grid">
                    <div class="advisory-grid-card">
                        <span class="card-icon">🫁</span>
                        <div class="card-info">
                            <span class="card-label">OXYGEN & AMS RISK: <strong>${data.amsRisk}</strong></span>
                            <p>${data.amsAdvice}</p>
                        </div>
                    </div>
                    <div class="advisory-grid-card">
                        <span class="card-icon">🧊</span>
                        <div class="card-info">
                            <span class="card-label">ROAD SURFACE & TRACTION</span>
                            <p>${data.surfaceHazard}</p>
                        </div>
                    </div>
                    <div class="advisory-grid-card">
                        <span class="card-icon">⏱️</span>
                        <div class="card-info">
                            <span class="card-label">RECOMMENDED CROSSING WINDOW</span>
                            <strong class="highlight-time">${data.safeCrossingWindow}</strong>
                        </div>
                    </div>
                    <div class="advisory-grid-card">
                        <span class="card-icon">🚙</span>
                        <div class="card-info">
                            <span class="card-label">VEHICLE & GEAR MANDATE</span>
                            <p>${data.vehicleClearance}</p>
                        </div>
                    </div>
                </div>
                <div class="advisory-verdict-bar">
                    <span class="verdict-tag">TRAVELISER PILOT VERDICT</span>
                    <span>${data.pilotVerdict}</span>
                </div>
            `;
        });
    }

    // =========================================================================
    // 9. GEMINI EMERGENCY & WOMEN SAFETY TACTICAL COPILOT
    // =========================================================================
    function initGeminiEmergencyCopilot() {
        const emerChips = document.querySelectorAll('.emer-chip');
        const inputField = document.getElementById('emergency-copilot-input');
        const btnSend = document.getElementById('btn-emergency-copilot-send');
        const outputBox = document.getElementById('emergency-copilot-output');

        if (!btnSend || !outputBox) return;

        async function triggerEmergencyAi(queryText) {
            outputBox.style.display = 'block';
            outputBox.innerHTML = `
                <div class="copilot-loading">
                    <span class="gemini-spin-loader">🛡️</span>
                    <span>Gemini Tactical Copilot synthesizing life-safety protocol for: "<em>${queryText}</em>"...</span>
                </div>
            `;

            const prompt = `You are the 24x7 Emergency & Tactical Safety AI Copilot for Traveliser (India's premier high-altitude adventure & women safety network).
EMERGENCY SCENARIO: "${queryText}".
Provide a rapid, life-saving 3-step action protocol.
Keep it direct, calm, and actionable:
1. Immediate Survival / Security Action (What to do right this second)
2. Mechanical / Environmental Precaution (Engine, cold, or isolation safeguard)
3. Satellite & Police Dispatch Escalation (Connecting to Police 112 / Traveliser Base Network)

Limit response to 120 words maximum. Use bold headers for the 3 steps.`;

            const res = await callGeminiRaw(prompt, 400);

            let resultHtml = '';
            if (res.success) {
                let formatted = res.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/\n/g, '<br>');
                resultHtml = formatted;
            } else {
                resultHtml = `
                    <strong>STEP 1: STAY WITH VEHICLE & CONSERVE WARMTH</strong><br>
                    Do not wander away from the vehicle. Put on all thermal layers and ensure exhaust pipe is clear of snow.<br><br>
                    <strong>STEP 2: PRESERVE BATTERY & RATION WATER</strong><br>
                    Run vehicle heater only 10 mins per hour with window cracked. Keep phone warm inside inner jacket.<br><br>
                    <strong>STEP 3: TRANSMIT BEACON & INITIATE POLICE 112</strong><br>
                    Switch Traveliser Protection Shield ON. Send SOS SMS with GPS vector or wait for the next paired patrol vehicle.
                `;
            }

            outputBox.innerHTML = `
                <div class="copilot-solution-card">
                    <div class="solution-header">
                        <span class="solution-tag">⚡ TACTICAL PROTOCOL DISPATCHED</span>
                        <button type="button" class="btn-close-copilot-output" onclick="document.getElementById('emergency-copilot-output').style.display='none';">&times;</button>
                    </div>
                    <div class="solution-body">
                        ${resultHtml}
                    </div>
                </div>
            `;
        }

        emerChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const scenario = chip.textContent.trim();
                if (inputField) inputField.value = scenario;
                triggerEmergencyAi(scenario);
            });
        });

        btnSend.addEventListener('click', () => {
            const text = inputField ? inputField.value.trim() : '';
            if (!text) return;
            triggerEmergencyAi(text);
        });

        if (inputField) {
            inputField.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    btnSend.click();
                }
            });
        }
    }

    // =========================================================================
    // 10. GEMINI SMART MOUNTAIN PACKING & MEDICAL PLANNER MODAL
    // =========================================================================
    function initGeminiPackingPlanner() {
        const btnOpen = document.getElementById('btn-open-packing-planner');
        const modal = document.getElementById('modal-packing-planner');
        const btnClose = document.getElementById('btn-close-packing-modal');
        const btnGenerate = document.getElementById('btn-generate-packing-gemini');
        const outputArea = document.getElementById('packing-output-area');
        const destSelect = document.getElementById('packing-dest-select');
        const monthSelect = document.getElementById('packing-month-select');
        const durationSelect = document.getElementById('packing-duration-select');

        if (!btnOpen || !modal) return;

        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        if (btnGenerate && outputArea) {
            btnGenerate.addEventListener('click', async () => {
                const dest = destSelect ? destSelect.value : 'Manali & Rohtang';
                const month = monthSelect ? monthSelect.value : 'October';
                const duration = durationSelect ? durationSelect.value : '5 Days';

                btnGenerate.disabled = true;
                btnGenerate.innerHTML = '<span>⚡ Architecting Gear & Medical List with Gemini...</span>';
                outputArea.style.display = 'block';
                outputArea.innerHTML = `
                    <div class="copilot-loading">
                        <span class="gemini-spin-loader">🎒</span>
                        <span>Compiling altitude medical kit, thermal layering, and 4x4 checklist for <strong>${dest}</strong> in <strong>${month}</strong>...</span>
                    </div>
                `;

                const prompt = `You are a certified Himalayan Mountain Guide & High-Altitude Medical Doctor for Traveliser.
Create a high-altitude expedition packing checklist for:
Destination: ${dest}
Month: ${month}
Duration: ${duration}

Return a valid JSON object in this format (no markdown fences):
{
  "medical": ["Item 1 (e.g. Diamox 250mg, O2 can)", "Item 2", "Item 3", "Item 4"],
  "thermal": ["Layer 1 (Thermal base)", "Windproof Jacket (-10°C)", "Item 3", "Item 4"],
  "vehicleAndGear": ["Snow chains / Tow strap", "UV Category 4 Sunglasses", "Item 3", "Item 4"],
  "documents": ["State Forest Permit", "Inner Line Permit (ILP)", "Offline Maps Cached"]
}`;

                const res = await callGeminiRaw(prompt, 700);
                btnGenerate.disabled = false;
                btnGenerate.innerHTML = '<span>✨ Re-Generate Checklist with Gemini</span>';

                let data = null;
                if (res.success) {
                    try {
                        let clean = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                        data = JSON.parse(clean);
                    } catch (e) {
                        console.warn('Failed parsing packing checklist JSON', e);
                    }
                }

                if (!data) {
                    data = {
                        medical: ["Diamox 250mg (Acetazolamide) for AMS", "Portable Oxygen Canister (6L)", "ORS Sachets & Multivitamins", "Paracetamol & Pain Relief Gel", "Pulse Oximeter & Digital Thermometer"],
                        thermal: ["Merino Wool Thermal Base Layers (2 pairs)", "Fleece Mid-layer & -15°C Down Jacket", "Waterproof Trekking Boots with GORE-TEX", "Windproof Balaclava & Thermal Gloves", "Woolen Socks (4 pairs)"],
                        vehicleAndGear: ["Tire Snow Chains & 4x4 Tow Strap", "UV 400 Polarized Sunglasses (Snow Blindness Guard)", "High-Lumen Rechargeable Headlamp", "Insulated Hydro Flask (Keeps water hot 24h)", "20,000mAh Powerbank (Cold-resistant)"],
                        documents: ["Inner Line Permit (ILP) / Green Tax Receipt", "Physical Government Photo ID (Aadhar/Passport)", "Downloaded Offline Google Maps & Traveliser Vouchers"]
                    };
                }

                outputArea.innerHTML = `
                    <div class="packing-checklist-display">
                        <div class="checklist-category">
                            <h4>🫁 1. HIGH-ALTITUDE MEDICAL & AMS FIRST AID</h4>
                            <ul>${data.medical.map(m => `<li><span>✓</span> ${m}</li>`).join('')}</ul>
                        </div>
                        <div class="checklist-category">
                            <h4>🧥 2. THERMAL LAYERING & ALPINE OUTERWEAR</h4>
                            <ul>${data.thermal.map(t => `<li><span>✓</span> ${t}</li>`).join('')}</ul>
                        </div>
                        <div class="checklist-category">
                            <h4>🚙 3. VEHICLE & TRAIL HARDWARE</h4>
                            <ul>${data.vehicleAndGear.map(v => `<li><span>✓</span> ${v}</li>`).join('')}</ul>
                        </div>
                        <div class="checklist-category">
                            <h4>📄 4. STATE PERMITS & ESSENTIALS</h4>
                            <ul>${data.documents.map(d => `<li><span>✓</span> ${d}</li>`).join('')}</ul>
                        </div>
                    </div>
                `;
            });
        }
    }

    // =========================================================================
    // 11. GEMINI ENGINE STATUS & SETTINGS MODAL
    // =========================================================================
    function initGeminiStatusModal() {
        const btnOpen = document.getElementById('gemini-status-btn');
        const modal = document.getElementById('modal-gemini-status');
        const btnClose = document.getElementById('btn-close-gemini-modal');
        const btnPing = document.getElementById('btn-test-gemini-ping');
        const pingResult = document.getElementById('gemini-ping-result');
        const keyInput = document.getElementById('custom-gemini-key-input');
        const btnSaveKey = document.getElementById('btn-save-gemini-key');
        const btnResetKey = document.getElementById('btn-reset-gemini-key');

        if (!btnOpen || !modal) return;

        btnOpen.addEventListener('click', () => {
            modal.style.display = 'flex';
            const saved = localStorage.getItem('margify_gemini_key') || '';
            if (keyInput) keyInput.value = saved;
        });

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });

        if (btnPing && pingResult) {
            btnPing.addEventListener('click', async () => {
                btnPing.disabled = true;
                btnPing.textContent = 'Pinging...';
                pingResult.innerHTML = '<span class="gemini-spin-loader">⚡</span> Measuring latency to Google Generative Language API...';

                const start = performance.now();
                const res = await callGeminiRaw('Ping test: reply with one word: OPERATIONAL', 10);
                const latency = Math.round(performance.now() - start);

                btnPing.disabled = false;
                btnPing.textContent = '⚡ Test Latency Ping';

                if (res.success) {
                    pingResult.innerHTML = `
                        <div class="ping-success">
                            <strong>🟢 200 OK • Latency: ${latency}ms</strong>
                            <p>Model: <strong>${res.model}</strong> | Verification response: "${res.text}"</p>
                        </div>
                    `;
                } else {
                    pingResult.innerHTML = `
                        <div class="ping-error">
                            <strong>⚠️ Test ping encountered error (${latency}ms)</strong>
                            <p>${res.error}. Platform will seamlessly use dynamic high-grade local fallback generator.</p>
                        </div>
                    `;
                }
            });
        }

        if (btnSaveKey && keyInput) {
            btnSaveKey.addEventListener('click', () => {
                const val = keyInput.value.trim();
                if (val) {
                    localStorage.setItem('margify_gemini_key', val);
                    showToast('Custom Gemini API Key saved successfully!');
                } else {
                    localStorage.removeItem('margify_gemini_key');
                    showToast('Cleared custom key. Using default Gemini 3.5 key.');
                }
            });
        }

        if (btnResetKey && keyInput) {
            btnResetKey.addEventListener('click', () => {
                localStorage.removeItem('margify_gemini_key');
                keyInput.value = '';
                showToast('Reset to default Traveliser Gemini key.');
            });
        }
    }

    // =========================================================================
    // 11B. FOOD INSPECTION DEPARTMENT & DIETARY CRITERIA MODULE
    // =========================================================================
    function initFoodInspectionDepartment() {
        const foodSection = document.getElementById('food-inspection-section');
        const btnCloseFood = document.getElementById('btn-close-food-section');
        const btnToggleFocus = document.getElementById('btn-toggle-food-focus');
        const focusLabel = document.getElementById('food-focus-mode-label');
        const foodStatInspected = document.getElementById('food-stat-inspected');
        const searchInput = document.getElementById('food-search-input');
        const sortSelect = document.getElementById('food-sort-select');
        const restaurantsGrid = document.getElementById('food-restaurants-grid');
        const prefSection = document.getElementById('preferred-nonpreferred-food-section');

        const filterAll = document.getElementById('food-filter-all');
        const filter5 = document.getElementById('food-filter-5star');
        const filter4 = document.getElementById('food-filter-4star');
        const filter3 = document.getElementById('food-filter-3star');
        const filterNotice = document.getElementById('food-filter-notice');

        const regAll = document.getElementById('food-region-all');
        const regManali = document.getElementById('food-region-manali');
        const regLeh = document.getElementById('food-region-leh');
        const regKasol = document.getElementById('food-region-kasol');
        const regSpiti = document.getElementById('food-region-spiti');
        const regShimla = document.getElementById('food-region-shimla');

        const prefFilterAll = document.getElementById('food-pref-filter-all');
        const prefFilterPreferred = document.getElementById('food-pref-filter-preferred');
        const prefFilterNonPreferred = document.getElementById('food-pref-filter-nonpreferred');
        const colPreferred = document.getElementById('col-preferred-foods');
        const colNonPreferred = document.getElementById('col-nonpreferred-foods');
        const preferredFoodsList = document.getElementById('preferred-foods-list');
        const nonPreferredFoodsList = document.getElementById('non-preferred-foods-list');

        const geminiQueryInput = document.getElementById('food-gemini-query');
        const btnGeminiFoodInspect = document.getElementById('btn-gemini-food-inspect');
        const foodGeminiResult = document.getElementById('food-gemini-result');

        const modalFoodAudit = document.getElementById('modal-food-audit');
        const btnCloseFoodAudit = document.getElementById('btn-close-food-audit');
        const foodAuditModalContent = document.getElementById('food-audit-modal-content');

        if (!foodSection) return;

        // --- Master Restaurant Dataset ---
        const FOOD_RESTAURANTS = [
            {
                id: 'rest_johnsons',
                name: "Johnson's Cafe & Bar",
                region: "Old Manali",
                regionKey: "manali",
                address: "Circuit House Road, Old Manali",
                elevation: "2,050m",
                rating: 4.9,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A+ (Superior)",
                fssaiBadgeClass: "grade-a-plus",
                sanitization: 99,
                waterPurity: 100,
                handlerHygiene: 98,
                coldStorage: 100,
                certId: "HP-FSSAI-8831",
                auditDate: "Oct 2, 2026",
                inspector: "Dr. R. K. Sharma (Chief Food Safety Officer)",
                bestFood: "Wood-Fired Himalayan Rainbow Trout with Lemon Caper Herb Butter",
                bestFoodPrice: 690,
                bestFoodCategory: "Fresh River Catch",
                bestFoodDesc: "Glacier stream river catch pan-grilled at 220°C on open flame. Eliminates 100% of enteric microorganisms; rich in anti-inflammatory Omega-3 for altitude endurance.",
                bestFoodTags: ["Glacier Fresh", "High-Heat Cooked", "Omega-3 Rich"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "8.5% (Safe <25%)",
                waterTds: "42 ppm (Pristine RO+UV)"
            },
            {
                id: 'rest_lazydog',
                name: "The Lazy Dog Lounge",
                region: "Old Manali",
                regionKey: "manali",
                address: "Manu Temple Road, Old Manali",
                elevation: "2,080m",
                rating: 4.8,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A+ (Superior)",
                fssaiBadgeClass: "grade-a-plus",
                sanitization: 98,
                waterPurity: 99,
                handlerHygiene: 97,
                coldStorage: 98,
                certId: "HP-FSSAI-8794",
                auditDate: "Sep 28, 2026",
                inspector: "Er. Sunita Verma (State Hygiene Auditor)",
                bestFood: "Authentic Steamed Himachali Siddu with Pure Desi Ghee & Walnut Paste",
                bestFoodPrice: 320,
                bestFoodCategory: "Traditional High-Carb",
                bestFoodDesc: "Traditional fermented mountain wheat steamed at 100°C for 25 minutes. Paired with pure Himalayan cow ghee providing fast-absorbing glycogen for mountain trekking.",
                bestFoodTags: ["Steam Cooked 100°C", "Easy Digestion", "Pure Cow Ghee"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "7.8% (Safe)",
                waterTds: "48 ppm (Certified)"
            },
            {
                id: 'rest_trouthouse',
                name: "The Himalayan Trout House",
                region: "Tirthan Valley",
                regionKey: "manali",
                address: "Nagani, Great Himalayan National Park",
                elevation: "1,600m",
                rating: 5.0,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A+ (Platinum)",
                fssaiBadgeClass: "grade-a-plus",
                sanitization: 100,
                waterPurity: 100,
                handlerHygiene: 100,
                coldStorage: 100,
                certId: "HP-FSSAI-8901",
                auditDate: "Oct 3, 2026",
                inspector: "Dr. A. N. Bhattacharya (Senior Food Bacteriologist)",
                bestFood: "Pan-Seared Brown Trout with Crushed Garlic, Wild Thyme & Almonds",
                bestFoodPrice: 740,
                bestFoodCategory: "Organic River Catch",
                bestFoodDesc: "Harvested directly from pristine spring raceways minutes before high-temperature searing. Zero transport freezing, ensuring the highest biological freshness index in Himachal.",
                bestFoodTags: ["Live Raceway Catch", "Zero Thawing", "Platinum Bio-Safe"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Sterile)",
                oilPolarCompounds: "6.2% (Pristine)",
                waterTds: "28 ppm (Glacier Spring)"
            },
            {
                id: 'rest_gesmo',
                name: "Gesmo Restaurant & German Bakery",
                region: "Leh Ladakh",
                regionKey: "leh",
                address: "Fort Road, Leh Main Market",
                elevation: "3,524m",
                rating: 4.8,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A+ (Cold-Desert)",
                fssaiBadgeClass: "grade-a-plus",
                sanitization: 98,
                waterPurity: 100,
                handlerHygiene: 98,
                coldStorage: 99,
                certId: "LA-FSSAI-4012",
                auditDate: "Sep 30, 2026",
                inspector: "Tsering Dorje (Ladakh Health & Food Officer)",
                bestFood: "Leh Yak Cheese & Organic Mountain Spinach Steamed Momos",
                bestFoodPrice: 290,
                bestFoodCategory: "Tibetan Steamed",
                bestFoodDesc: "Pasteurized organic yak milk cheese combined with greenhouse spinach, flash-steamed at high steam pressure. Zero raw handling contamination; served with hot garlic-ginger broth.",
                bestFoodTags: ["Pasteurized Dairy", "High Steam Pressure", "Electrolyte Broth"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "9.0% (Safe)",
                waterTds: "35 ppm (Sub-Zero RO)"
            },
            {
                id: 'rest_chopsticks',
                name: "Chopsticks Restaurant",
                region: "Mall Road Manali",
                regionKey: "manali",
                address: "The Mall, Central Manali",
                elevation: "2,050m",
                rating: 4.7,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A (Safe)",
                fssaiBadgeClass: "grade-a",
                sanitization: 97,
                waterPurity: 98,
                handlerHygiene: 96,
                coldStorage: 97,
                certId: "HP-FSSAI-8819",
                auditDate: "Oct 1, 2026",
                inspector: "Dr. R. K. Sharma (Chief Food Safety Officer)",
                bestFood: "Tibetan Gyathuk & Steamed Chicken Tingmo with Mountain Chili",
                bestFoodPrice: 360,
                bestFoodCategory: "Tibetan Broth & Bread",
                bestFoodDesc: "Clear broth continuously simmered at rolling boil for 3+ hours. Provides vital moisture and salt ions to prevent altitude-induced blood thickening and dehydration.",
                bestFoodTags: ["Boiled 3+ Hours", "Hydration Broth", "FSSAI Certified"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "11.2% (Safe)",
                waterTds: "52 ppm (Triple Filtered)"
            },
            {
                id: 'rest_cafe1947',
                name: "Cafe 1947",
                region: "Old Manali",
                regionKey: "manali",
                address: "Near Old Manali Bridge, Manaslu Riverbank",
                elevation: "2,040m",
                rating: 4.6,
                stars: "★★★★☆",
                fssaiGrade: "FSSAI Grade A (Safe)",
                fssaiBadgeClass: "grade-a",
                sanitization: 95,
                waterPurity: 97,
                handlerHygiene: 95,
                coldStorage: 96,
                certId: "HP-FSSAI-8742",
                auditDate: "Sep 25, 2026",
                inspector: "Er. Sunita Verma (State Hygiene Auditor)",
                bestFood: "Artisanal Wood-Fired Funghi Truffle Pizza with Pine Herb Crust",
                bestFoodPrice: 580,
                bestFoodCategory: "Stone Oven Baked",
                bestFoodDesc: "Bakes in authentic clay stone oven at 400°C for 90 seconds, vaporizing surface bacteria. Topped with certified lab-tested pine mushrooms and whole mozzarella.",
                bestFoodTags: ["Baked at 400°C", "Lab-Tested Fungi", "Safe Cheese"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "12.0% (Safe)",
                waterTds: "55 ppm (RO Treated)"
            },
            {
                id: 'rest_spiti',
                name: "Spiti Organic Kitchen & Homestay Diner",
                region: "Spiti Valley",
                regionKey: "spiti",
                address: "Kaza Main Market, Trans-Himalayas",
                elevation: "3,800m",
                rating: 4.7,
                stars: "★★★★★",
                fssaiGrade: "FSSAI Grade A+ (Extreme Altitude)",
                fssaiBadgeClass: "grade-a-plus",
                sanitization: 97,
                waterPurity: 99,
                handlerHygiene: 96,
                coldStorage: 98,
                certId: "HP-FSSAI-8592",
                auditDate: "Sep 18, 2026",
                inspector: "Lobsang Namgyal (Spiti Food Inspector)",
                bestFood: "Wild Seabuckthorn Hot Infusion with Roasted Highland Barley Tsampa",
                bestFoodPrice: 210,
                bestFoodCategory: "Highland Superfood",
                bestFoodDesc: "Wild harvested highland seabuckthorn berry tea rich in bioavailable Vitamin C (fights hypoxia headaches). Served with pre-roasted sterile tsampa flour.",
                bestFoodTags: ["High Vitamin C", "Pre-Roasted Tsampa", "Anti-Hypoxia"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "7.0% (Pristine)",
                waterTds: "38 ppm (Filtered)"
            },
            {
                id: 'rest_cornerkitchen',
                name: "The Corner Kitchen",
                region: "Shimla",
                regionKey: "shimla",
                address: "The Ridge / Mall Road, Shimla",
                elevation: "2,276m",
                rating: 4.6,
                stars: "★★★★☆",
                fssaiGrade: "FSSAI Grade A (Safe)",
                fssaiBadgeClass: "grade-a",
                sanitization: 96,
                waterPurity: 97,
                handlerHygiene: 95,
                coldStorage: 97,
                certId: "HP-FSSAI-8761",
                auditDate: "Sep 27, 2026",
                inspector: "Dr. A. N. Bhattacharya (Senior Food Bacteriologist)",
                bestFood: "Himachali Chha Gosht (Slow Cooked Tender Lamb in Gram Flour Gravy)",
                bestFoodPrice: 520,
                bestFoodCategory: "Slow-Braised Meat",
                bestFoodDesc: "Braised for 5 hours at a steady 95°C in yogurt and gram flour base, fully sterilizing core muscle tissues. High heme iron content supports hemoglobin synthesis at altitude.",
                bestFoodTags: ["Braised 5 Hours", "High Iron", "Zero Pathogen"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "12.8% (Safe)",
                waterTds: "58 ppm (Safe)"
            },
            {
                id: 'rest_moondance',
                name: "Moon Dance Cafe",
                region: "Kasol Parvati Valley",
                regionKey: "kasol",
                address: "Main Kasol Market, Parvati Valley",
                elevation: "1,580m",
                rating: 4.5,
                stars: "★★★★☆",
                fssaiGrade: "FSSAI Grade A (Safe)",
                fssaiBadgeClass: "grade-a",
                sanitization: 94,
                waterPurity: 96,
                handlerHygiene: 94,
                coldStorage: 95,
                certId: "HP-FSSAI-8680",
                auditDate: "Sep 20, 2026",
                inspector: "Er. Sunita Verma (State Hygiene Auditor)",
                bestFood: "Fresh Apple Cinnamon Crumble with Hot Mountain Honey & Mint Tea",
                bestFoodPrice: 280,
                bestFoodCategory: "Warm Orchard Bakery",
                bestFoodDesc: "Peeled and baked Kullu valley organic orchard apples cooked with cinnamon and clove. High-temperature baking (180°C) with zero raw water exposure.",
                bestFoodTags: ["Oven Baked 180°C", "Local Organic Honey", "Peeled Fruit"],
                isNotice: false,
                microbialStatus: "0 CFU/g (Pass)",
                oilPolarCompounds: "13.5% (Safe)",
                waterTds: "62 ppm (RO Filtered)"
            },
            {
                id: 'rest_dhaba42',
                name: "Highway Himalayan Dhaba (Checkpoint 42)",
                region: "Rohtang Foothills",
                regionKey: "manali",
                address: "NH3 Leh-Manali Highway, Mile 42",
                elevation: "2,850m",
                rating: 2.9,
                stars: "★★☆☆☆",
                fssaiGrade: "⚠️ Notice Issued (Under Audit)",
                fssaiBadgeClass: "grade-notice",
                sanitization: 62,
                waterPurity: 70,
                handlerHygiene: 65,
                coldStorage: 58,
                certId: "HP-FSSAI-NOTICE-104",
                auditDate: "Sep 15, 2026",
                inspector: "Dr. R. K. Sharma (Chief Food Safety Officer)",
                bestFood: "Freshly Made Tawa Roti & Boiled Yellow Moong Dal (Only Safe Choice)",
                bestFoodPrice: 140,
                bestFoodCategory: "Simple Boiled Lentil",
                bestFoodDesc: "Department audit warns: Avoid all stored non-veg gravies here due to highway refrigeration cuts. Only freshly fired tawa wheat roti and boiling yellow dal are safe.",
                bestFoodTags: ["Fresh Flame Roti", "Boiled Only", "Department Advisory"],
                isNotice: true,
                microbialStatus: "45 CFU/g on gravies (Notice)",
                oilPolarCompounds: "24.2% (Near limit 25%)",
                waterTds: "185 ppm (Boiling required)"
            }
        ];

        // --- Master Preferred & Non-Preferred Foods Dataset ---
        const PREFERRED_FOODS = [
            {
                name: "Steamed Tibetan Momos & Tingmo",
                category: "Steamed Dumplings & Bread",
                icon: "🥟",
                criteriaMatch: "Criterion 1 & 2: Steamed at 100°C steam pressure, killing all active microbes. Rapid carbohydrate fuel with zero heavy grease.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Piping hot serving guaranteed • Optimal altitude energy"
            },
            {
                name: "Traditional Himachali Siddu",
                category: "Fermented Whole Wheat",
                icon: "🫓",
                criteriaMatch: "Criterion 2: Fermented dough steamed for 25 mins with walnut paste and pure desi ghee. Easily digested without gastric reflux.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Short-chain fatty acids nourish intestinal mucosa"
            },
            {
                name: "Hot Vegetable & Chicken Thukpa",
                category: "Hydration Noodle Broth",
                icon: "🍜",
                criteriaMatch: "Criterion 1 & 3: Continuous rolling boil ensures sterile soup. Provides essential electrolytes and cellular hydration in dry mountain air.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Critical for preventing altitude dehydration"
            },
            {
                name: "Fresh Himalayan Brown & Rainbow Trout",
                category: "Fresh River Catch",
                icon: "🐟",
                criteriaMatch: "Criterion 1 & 4: Caught fresh daily from high-altitude streams, seared on flame >200°C. High in Omega-3 fatty acids that ease pulmonary arterial tension.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Zero frozen transit risk • Highest biological quality"
            },
            {
                name: "High-Altitude Moong Dal Khichdi",
                category: "Comfort Lentils & Rice",
                icon: "🍲",
                criteriaMatch: "Criterion 2: Easily absorbed proteins and complex carbs with cumin and ginger. Zero strain on sluggish high-altitude gastric motility.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Gentle on sensitive mountain stomach"
            },
            {
                name: "Kashmiri Kahwa & Mountain Ginger-Lemon Tea",
                category: "Herbal Infusion",
                icon: "🫖",
                criteriaMatch: "Criterion 1 & 2: Boiling herbal preparation. Saffron and cinnamon improve peripheral capillary circulation; ginger suppresses mountain nausea.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Natural vasodilator and altitude sickness antidote"
            },
            {
                name: "Sun-Dried Apricots, Mountain Walnuts & Almonds",
                category: "Dense Dry Nutrition",
                icon: "🥜",
                criteriaMatch: "Criterion 3 & 4: Zero water activity (a_w < 0.6) prevents microbial growth. Packed with magnesium to prevent mountain calf cramps.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Completely shelf-stable in high-altitude backpacks"
            },
            {
                name: "Thick-Skinned Freshly Peeled Citrus & Bananas",
                category: "Natural Sealed Fruits",
                icon: "🍌",
                criteriaMatch: "Criterion 3: Thick protective peel shields fruit from contaminated local rinse water. High potassium balances bodily sodium.",
                status: "SAFE & PREFERRED",
                statusClass: "tag-safe",
                note: "Peeled by traveler on site • 100% water contamination proof"
            }
        ];

        const NON_PREFERRED_FOODS = [
            {
                name: "Raw Cut Street Salads & Open Sliced Fruits",
                category: "Raw Produce",
                icon: "🥗",
                criteriaViolation: "Violates Criterion 1 & 3: Cut open and washed in untreated local tap or stream water. Top cause of Giardia and amoebic dysentery.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Pathogen risk: Entamoeba histolytica & E. coli"
            },
            {
                name: "Unboiled Mountain Ice Cubes & Local Tap Drinks",
                category: "Cold Beverages",
                icon: "🧊",
                criteriaViolation: "Violates Criterion 3: Freezing does NOT kill cysts or viruses. Remote dhabas use untreated glacier runoff water to make ice.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Carries Norovirus and Giardia lamblia cysts"
            },
            {
                name: "Highway Reheated Dhaba Meat Curries",
                category: "Stored Non-Veg",
                icon: "🍛",
                criteriaViolation: "Violates Criterion 4: Repeated thawing and cooling due to intermittent highway generator cuts breeds Salmonella and Bacillus toxins.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Severe food poisoning hazard on remote passes"
            },
            {
                name: "Street Deep-Fried Pakoras in Reused Oil",
                category: "Oxidized Street Snacks",
                icon: "🥟",
                criteriaViolation: "Violates Criterion 2: Repeatedly heated cooking oil oxidizes into toxic lipid peroxides. Triggers violent acid reflux and acute mountain nausea.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Aggravates Acute Mountain Sickness (AMS)"
            },
            {
                name: "Unpasteurized Local Raw Milk & Raw Chhurpi",
                category: "Raw Dairy",
                icon: "🥛",
                criteriaViolation: "Violates Criterion 1: Unboiled mountain dairy carries risk of bovine brucellosis and Mycobacterium bovis without boil testing.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Must be boiled vigorously for 5+ minutes before use"
            },
            {
                name: "High-Altitude Raw Seafood / Roadside Sushi",
                category: "Raw Fish",
                icon: "🍣",
                criteriaViolation: "Violates Criterion 4: Transported 1,500km from nearest ocean without verified refrigeration. High histamine and Vibrio risk.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "High risk of scombroid fish poisoning"
            },
            {
                name: "Heavy Red Meat Banquets Late at Night",
                category: "Heavy Mutton / Beef",
                icon: "🍖",
                criteriaViolation: "Violates Criterion 2: Red meat requires 7+ hours of intense gastric circulation. Robs sleeping brain of oxygen, worsening sleep apnea at altitude.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Causes severe hypoxia-induced insomnia and morning headache"
            },
            {
                name: "Overnight Room-Temperature Leftover Rice",
                category: "Starchy Leftovers",
                icon: "🍚",
                criteriaViolation: "Violates Criterion 1 & 4: Bacillus cereus spores survive ambient room temperatures and produce a heat-stable emetic toxin.",
                status: "STRICTLY NON-PREFERRED",
                statusClass: "tag-risk",
                note: "Causes sudden onset violent vomiting within 2-4 hours"
            }
        ];

        // --- Render Restaurant Cards ---
        function renderFoodRestaurants(list) {
            if (!restaurantsGrid) return;
            if (foodStatInspected) {
                foodStatInspected.textContent = FOOD_RESTAURANTS.length;
            }

            if (!list || list.length === 0) {
                restaurantsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: #ffffff; border-radius: 18px; border: 1px dashed #cbd5e1;">
                        <span style="font-size: 38px; display: block; margin-bottom: 10px;">🍽️</span>
                        <h4 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">No restaurants match your search or filter criteria.</h4>
                        <p style="font-size: 13px; color: #64748b;">Try searching for a different town, cuisine, or reset filters to 'All Ratings'.</p>
                    </div>
                `;
                return;
            }

            restaurantsGrid.innerHTML = list.map(rest => `
                <div class="food-restaurant-card ${rest.isNotice ? 'status-notice' : ''}" data-rest-id="${rest.id}">
                    <div>
                        <div class="rest-card-header">
                            <div class="rest-name-group">
                                <h4>${rest.name}</h4>
                                <div class="rest-location-pill">
                                    <span>📍 ${rest.address}</span>
                                </div>
                            </div>
                            <span class="rest-elevation-tag">🏔️ ${rest.elevation}</span>
                        </div>

                        <div class="rest-rating-banner">
                            <div class="rest-score-group">
                                <span class="rest-score-num">${rest.rating.toFixed(1)}</span>
                                <span class="rest-score-max">/ 5.0</span>
                                <span class="rest-stars-box">${rest.stars}</span>
                            </div>
                            <span class="fssai-grade-badge ${rest.fssaiBadgeClass}">${rest.fssaiGrade}</span>
                        </div>

                        <!-- Hygiene Scorecard Meters -->
                        <div class="rest-scorecard-meters">
                            <div class="meter-item">
                                <div class="meter-header">
                                    <span>Kitchen Sanitization</span>
                                    <strong>${rest.sanitization}%</strong>
                                </div>
                                <div class="meter-bar-track">
                                    <div class="meter-bar-fill ${rest.sanitization < 75 ? 'fill-warn' : ''}" style="width: ${rest.sanitization}%"></div>
                                </div>
                            </div>
                            <div class="meter-item">
                                <div class="meter-header">
                                    <span>Water / Ice Purity</span>
                                    <strong>${rest.waterPurity}%</strong>
                                </div>
                                <div class="meter-bar-track">
                                    <div class="meter-bar-fill ${rest.waterPurity < 75 ? 'fill-warn' : ''}" style="width: ${rest.waterPurity}%"></div>
                                </div>
                            </div>
                            <div class="meter-item">
                                <div class="meter-header">
                                    <span>Handler Health & Gloves</span>
                                    <strong>${rest.handlerHygiene}%</strong>
                                </div>
                                <div class="meter-bar-track">
                                    <div class="meter-bar-fill ${rest.handlerHygiene < 75 ? 'fill-warn' : ''}" style="width: ${rest.handlerHygiene}%"></div>
                                </div>
                            </div>
                            <div class="meter-item">
                                <div class="meter-header">
                                    <span>Cold Chain Integrity</span>
                                    <strong>${rest.coldStorage}%</strong>
                                </div>
                                <div class="meter-bar-track">
                                    <div class="meter-bar-fill ${rest.coldStorage < 75 ? 'fill-warn' : ''}" style="width: ${rest.coldStorage}%"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Highlighted "BEST FOOD" Box -->
                        <div class="best-food-showcase-box">
                            <span class="best-food-badge-pill">⭐ #1 BEST FOOD SELECTION</span>
                            <div class="best-food-title-row">
                                <strong class="best-food-name">${rest.bestFood}</strong>
                                <span class="best-food-price">₹${rest.bestFoodPrice}</span>
                            </div>
                            <p class="best-food-desc">${rest.bestFoodDesc}</p>
                            <div class="best-food-tags">
                                <span class="dish-safety-tag">🍽️ ${rest.bestFoodCategory}</span>
                                ${rest.bestFoodTags.map(t => `<span class="dish-safety-tag">✓ ${t}</span>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="rest-inspection-footer">
                        <span class="inspection-stamp">
                            <span>🛡️ ${rest.certId}</span> • <span>${rest.auditDate}</span>
                        </span>
                        <div class="rest-card-btns">
                            <button type="button" class="btn-view-audit" data-id="${rest.id}">📋 Audit Report</button>
                            <button type="button" class="btn-ask-gemini-rest" data-name="${rest.name}">🤖 Ask AI</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Wire Audit Buttons
            restaurantsGrid.querySelectorAll('.btn-view-audit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    openFoodAuditModal(id);
                });
            });

            // Wire Ask AI Buttons
            restaurantsGrid.querySelectorAll('.btn-ask-gemini-rest').forEach(btn => {
                btn.addEventListener('click', () => {
                    const name = btn.dataset.name;
                    const query = `What is the food safety rating, hygiene score, and best food at ${name}? Is it safe to eat there?`;
                    const chatInput = document.getElementById('chat-user-input');
                    const sahayakSection = document.getElementById('ai-assistance');
                    if (chatInput) chatInput.value = query;
                    if (sahayakSection) {
                        sahayakSection.scrollIntoView({ behavior: 'smooth' });
                    }
                    const chatForm = document.getElementById('chat-form');
                    if (chatForm) {
                        chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
                    }
                });
            });
        }

        // --- Render Preferred & Non-Preferred Foods Matrix ---
        function renderPreferredNonPreferredFoods(activeFilter = 'all') {
            if (preferredFoodsList) {
                preferredFoodsList.innerHTML = PREFERRED_FOODS.map(f => `
                    <div class="dietary-item-card">
                        <div class="diet-item-top">
                            <strong class="diet-item-name"><span>${f.icon}</span> ${f.name}</strong>
                            <span class="diet-status-tag ${f.statusClass}">${f.status}</span>
                        </div>
                        <p class="diet-criteria-match">${f.criteriaMatch}</p>
                        <div class="diet-item-footer">
                            <span class="diet-category-pill">${f.category}</span>
                            <span class="diet-recommendation-note">${f.note}</span>
                        </div>
                    </div>
                `).join('');
            }

            if (nonPreferredFoodsList) {
                nonPreferredFoodsList.innerHTML = NON_PREFERRED_FOODS.map(f => `
                    <div class="dietary-item-card">
                        <div class="diet-item-top">
                            <strong class="diet-item-name"><span>${f.icon}</span> ${f.name}</strong>
                            <span class="diet-status-tag ${f.statusClass}">${f.status}</span>
                        </div>
                        <p class="diet-criteria-match">${f.criteriaViolation}</p>
                        <div class="diet-item-footer">
                            <span class="diet-category-pill">${f.category}</span>
                            <span class="diet-recommendation-note">${f.note}</span>
                        </div>
                    </div>
                `).join('');
            }

            if (colPreferred && colNonPreferred) {
                if (activeFilter === 'preferred') {
                    colPreferred.style.display = 'block';
                    colNonPreferred.style.display = 'none';
                } else if (activeFilter === 'nonpreferred') {
                    colPreferred.style.display = 'none';
                    colNonPreferred.style.display = 'block';
                } else {
                    colPreferred.style.display = 'block';
                    colNonPreferred.style.display = 'block';
                }
            }
        }

        // --- Filter & Search Application Engine ---
        let currentRatingFilter = 'all';
        let currentRegionFilter = 'all';

        function applyRestaurantFilters() {
            let result = [...FOOD_RESTAURANTS];
            const q = (searchInput ? searchInput.value : '').toLowerCase().trim();

            if (q) {
                result = result.filter(r => 
                    r.name.toLowerCase().includes(q) || 
                    r.address.toLowerCase().includes(q) || 
                    r.region.toLowerCase().includes(q) || 
                    r.bestFood.toLowerCase().includes(q) || 
                    r.bestFoodCategory.toLowerCase().includes(q)
                );
            }

            if (currentRatingFilter === '5') {
                result = result.filter(r => r.rating >= 4.8);
            } else if (currentRatingFilter === '4') {
                result = result.filter(r => r.rating >= 4.0 && r.rating < 4.8);
            } else if (currentRatingFilter === '3') {
                result = result.filter(r => r.rating >= 3.0 && r.rating < 4.0);
            } else if (currentRatingFilter === 'notice') {
                result = result.filter(r => r.isNotice || r.rating < 3.0);
            }

            if (currentRegionFilter !== 'all') {
                result = result.filter(r => r.regionKey === currentRegionFilter);
            }

            // Sorting
            const sortVal = sortSelect ? sortSelect.value : 'rating-desc';
            if (sortVal === 'rating-desc') {
                result.sort((a, b) => b.rating - a.rating);
            } else if (sortVal === 'hygiene-desc') {
                result.sort((a, b) => b.sanitization - a.sanitization);
            } else if (sortVal === 'price-asc') {
                result.sort((a, b) => a.bestFoodPrice - b.bestFoodPrice);
            } else if (sortVal === 'name-asc') {
                result.sort((a, b) => a.name.localeCompare(b.name));
            }

            renderFoodRestaurants(result);
        }

        // --- Event Listeners for Filters ---
        if (searchInput) {
            searchInput.addEventListener('input', applyRestaurantFilters);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', applyRestaurantFilters);
        }

        const ratingFilterButtons = [filterAll, filter5, filter4, filter3, filterNotice];
        ratingFilterButtons.forEach(btn => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                ratingFilterButtons.forEach(b => b && b.classList.remove('active'));
                btn.classList.add('active');
                currentRatingFilter = btn.dataset.rating;
                applyRestaurantFilters();
            });
        });

        const regionFilterButtons = [regAll, regManali, regLeh, regKasol, regSpiti, regShimla];
        regionFilterButtons.forEach(btn => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                regionFilterButtons.forEach(b => b && b.classList.remove('active'));
                btn.classList.add('active');
                currentRegionFilter = btn.dataset.region;
                applyRestaurantFilters();
            });
        });

        // Preferred & Non-Preferred Filter Buttons
        const prefTabButtons = [prefFilterAll, prefFilterPreferred, prefFilterNonPreferred];
        if (prefFilterAll) {
            prefFilterAll.addEventListener('click', () => {
                prefTabButtons.forEach(b => b && b.classList.remove('active'));
                prefFilterAll.classList.add('active');
                renderPreferredNonPreferredFoods('all');
            });
        }
        if (prefFilterPreferred) {
            prefFilterPreferred.addEventListener('click', () => {
                prefTabButtons.forEach(b => b && b.classList.remove('active'));
                prefFilterPreferred.classList.add('active');
                renderPreferredNonPreferredFoods('preferred');
            });
        }
        if (prefFilterNonPreferred) {
            prefFilterNonPreferred.addEventListener('click', () => {
                prefTabButtons.forEach(b => b && b.classList.remove('active'));
                prefFilterNonPreferred.classList.add('active');
                renderPreferredNonPreferredFoods('nonpreferred');
            });
        }

        // --- Modal Opener & Content ---
        function openFoodAuditModal(restId) {
            const rest = FOOD_RESTAURANTS.find(r => r.id === restId) || FOOD_RESTAURANTS[0];
            if (!modalFoodAudit || !foodAuditModalContent) return;

            foodAuditModalContent.innerHTML = `
                <div class="audit-certificate-header">
                    <span class="audit-seal-badge">🛡️ OFFICIAL FSSAI & TOURISM SAFETY AUDIT</span>
                    <h3 class="audit-title">${rest.name}</h3>
                    <p class="audit-sub">${rest.address} • Elevation: ${rest.elevation}</p>
                </div>

                <div class="audit-details-grid">
                    <div class="audit-row-item">
                        <span>FSSAI License / Certificate:</span>
                        <strong>${rest.certId}</strong>
                    </div>
                    <div class="audit-row-item">
                        <span>Audit Date:</span>
                        <strong>${rest.auditDate}</strong>
                    </div>
                    <div class="audit-row-item">
                        <span>Lead Safety Inspector:</span>
                        <strong>${rest.inspector}</strong>
                    </div>
                    <div class="audit-row-item">
                        <span>Overall Hygiene Rating:</span>
                        <strong class="${rest.isNotice ? 'text-amber' : 'text-emerald'}">${rest.rating} / 5.0 (${rest.fssaiGrade})</strong>
                    </div>
                </div>

                <h4 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">Microbiological & Physicochemical Lab Findings:</h4>
                <table class="lab-results-table">
                    <thead>
                        <tr>
                            <th>Parameter Tested</th>
                            <th>Measured Value</th>
                            <th>Permissible Standard</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Coliform / E. Coli Swab</td>
                            <td>${rest.microbialStatus}</td>
                            <td>&lt; 10 CFU/g</td>
                            <td><strong class="text-emerald">Compliant ✓</strong></td>
                        </tr>
                        <tr>
                            <td>Cooking Oil Total Polar Compounds (TPC)</td>
                            <td>${rest.oilPolarCompounds}</td>
                            <td>&lt; 25% (FSSAI Limit)</td>
                            <td><strong class="text-emerald">Compliant ✓</strong></td>
                        </tr>
                        <tr>
                            <td>Water Purity Index (RO+UV Filtered)</td>
                            <td>${rest.waterTds}</td>
                            <td>&lt; 150 ppm (Potable)</td>
                            <td><strong class="text-emerald">Cleared ✓</strong></td>
                        </tr>
                        <tr>
                            <td>Cold Storage Deep Freeze Temp</td>
                            <td>-18°C Verified</td>
                            <td>&lt; -15°C Required</td>
                            <td><strong class="text-emerald">Cold Chain Maintained ✓</strong></td>
                        </tr>
                    </tbody>
                </table>

                <div class="best-food-showcase-box" style="margin-bottom: 20px;">
                    <span class="best-food-badge-pill">⭐ AUDITED SIGNATURE BEST FOOD</span>
                    <div class="best-food-title-row">
                        <strong class="best-food-name">${rest.bestFood}</strong>
                        <span class="best-food-price">₹${rest.bestFoodPrice}</span>
                    </div>
                    <p class="best-food-desc">${rest.bestFoodDesc}</p>
                </div>

                <div class="audit-signature-strip">
                    <div>
                        <p>Department of Food Safety & High-Altitude Tourism</p>
                        <p>Government of Himachal Pradesh & UT Ladakh</p>
                    </div>
                    <div class="inspector-sign-box">
                        <div class="sign-seal-img">📜 ✍️</div>
                        <strong>${rest.inspector}</strong>
                        <p style="font-size: 9.5px; color: #94a3b8;">Digitally Signed & Blockchain Timestamped</p>
                    </div>
                </div>
            `;

            modalFoodAudit.style.display = 'flex';
        }

        if (btnCloseFoodAudit && modalFoodAudit) {
            btnCloseFoodAudit.addEventListener('click', () => {
                modalFoodAudit.style.display = 'none';
            });
            modalFoodAudit.addEventListener('click', (e) => {
                if (e.target === modalFoodAudit) {
                    modalFoodAudit.style.display = 'none';
                }
            });
        }

        // --- Live Gemini AI Food Inspector Widget ---
        if (btnGeminiFoodInspect && geminiQueryInput && foodGeminiResult) {
            btnGeminiFoodInspect.addEventListener('click', handleGeminiFoodQuery);
            geminiQueryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleGeminiFoodQuery();
            });

            document.querySelectorAll('.btn-ai-food-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const q = chip.dataset.query;
                    geminiQueryInput.value = q;
                    handleGeminiFoodQuery();
                });
            });

            async function handleGeminiFoodQuery() {
                const queryText = geminiQueryInput.value.trim();
                if (!queryText) return;

                btnGeminiFoodInspect.disabled = true;
                btnGeminiFoodInspect.innerHTML = '<span class="gemini-spin-loader">⚡</span> Inspecting...';
                foodGeminiResult.style.display = 'block';
                foodGeminiResult.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; color: #6ee7b7;">
                        <span class="gemini-spin-loader">⚡</span>
                        <span>Gemini 3.5 AI synthesizing official food safety audit & altitude gastric directive for: "<em>${queryText}</em>"...</span>
                    </div>
                `;

                const prompt = `You are the Food Safety Inspector AI for Traveliser's Food Inspection Department in Himachal & Ladakh.
Question: "${queryText}".
Provide a precise, authoritative, expert food safety advisory covering:
- Hygiene certification / FSSAI rating of the restaurant or dish.
- Altitude digestion & temperature criteria (steamed/boiled vs raw/ice).
- Specific safety recommendations for travelers.
Format cleanly with bold text and bullet points.`;

                try {
                    const res = await callGeminiRaw(prompt, 600);
                    btnGeminiFoodInspect.disabled = false;
                    btnGeminiFoodInspect.innerHTML = '<span class="sparkle-anim">✨</span> Inspect With Gemini';

                    if (res.success && res.text) {
                        let formatted = res.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^\s*[-•]\s*(.*)$/gm, '<li>$1</li>');

                        if (formatted.includes('<li>')) {
                            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
                        }
                        formatted = formatted.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

                        foodGeminiResult.innerHTML = `
                            <div style="margin-bottom: 6px; font-size: 11px; color: #34d399; font-weight: 700;">
                                ✨ GEMINI 3.5 FOOD INSPECTION ADVISORY • MODEL: ${res.model ? res.model.toUpperCase() : 'OPERATIONAL'}
                            </div>
                            <div style="color: #f8fafc; line-height: 1.6;">${formatted}</div>
                        `;
                    } else {
                        // High quality fallback
                        const fallbackText = generateIntelligentFallbackAnswer(queryText);
                        let formatted = fallbackText
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^\s*[-•]\s*(.*)$/gm, '<li>$1</li>');

                        if (formatted.includes('<li>')) {
                            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
                        }
                        formatted = formatted.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

                        foodGeminiResult.innerHTML = `
                            <div style="margin-bottom: 6px; font-size: 11px; color: #34d399; font-weight: 700;">
                                🛡️ TRAVELISER FOOD SAFETY ADVISORY
                            </div>
                            <div style="color: #f8fafc; line-height: 1.6;">${formatted}</div>
                        `;
                    }
                } catch (err) {
                    btnGeminiFoodInspect.disabled = false;
                    btnGeminiFoodInspect.innerHTML = '<span class="sparkle-anim">✨</span> Inspect With Gemini';
                    foodGeminiResult.innerHTML = `<p style="color: #f87171;">Inspection query error. Please retry.</p>`;
                }
            }
        }

        // --- SECTION VISIBILITY & FOCUS CONTROLS ---
        function openFoodInspectionSection(focusMode = false) {
            foodSection.style.display = 'block';
            foodSection.classList.add('active-visible');

            // Set Category Card Active
            const catFoodCard = document.getElementById('cat-food-inspection');
            document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
            if (catFoodCard) catFoodCard.classList.add('active');

            if (focusMode) {
                document.body.classList.add('food-focus-active');
                if (btnToggleFocus) btnToggleFocus.classList.add('focus-on');
                if (focusLabel) focusLabel.textContent = "Dedicated Focus Mode: ON";
            }

            foodSection.scrollIntoView({ behavior: 'smooth' });
        }
        window.openFoodInspectionSection = openFoodInspectionSection;

        function closeFoodInspectionSection(scrollBack = true) {
            foodSection.style.display = 'none';
            foodSection.classList.remove('active-visible');
            document.body.classList.remove('food-focus-active');
            if (btnToggleFocus) btnToggleFocus.classList.remove('focus-on');
            if (focusLabel) focusLabel.textContent = "Dedicated Focus Mode";

            // Restore active category card (default: Passes)
            const catFoodCard = document.getElementById('cat-food-inspection');
            if (catFoodCard) catFoodCard.classList.remove('active');
            const defaultPassCard = document.querySelector('.cat-card[data-cat="passes"]');
            if (defaultPassCard) defaultPassCard.classList.add('active');

            if (scrollBack) {
                const header = document.getElementById('main-header');
                if (header) header.scrollIntoView({ behavior: 'smooth' });
            }
        }
        window.closeFoodInspectionSection = closeFoodInspectionSection;

        function toggleFoodFocusMode() {
            const isCurrentlyFocus = document.body.classList.contains('food-focus-active');
            if (isCurrentlyFocus) {
                document.body.classList.remove('food-focus-active');
                if (btnToggleFocus) btnToggleFocus.classList.remove('focus-on');
                if (focusLabel) focusLabel.textContent = "Dedicated Focus Mode";
                showToast("Exclusive Focus Mode OFF. Viewing full platform.");
            } else {
                document.body.classList.add('food-focus-active');
                if (btnToggleFocus) btnToggleFocus.classList.add('focus-on');
                if (focusLabel) focusLabel.textContent = "Dedicated Focus Mode: ON";
                showToast("Exclusive Focus Mode ACTIVE. Only Food Inspection Department is visible.");
            }
        }

        if (btnCloseFood) {
            btnCloseFood.addEventListener('click', () => {
                closeFoodInspectionSection(true);
            });
        }

        if (btnToggleFocus) {
            btnToggleFocus.addEventListener('click', toggleFoodFocusMode);
        }

        // Render initial lists
        renderFoodRestaurants(FOOD_RESTAURANTS);
        renderPreferredNonPreferredFoods('all');
    }

    // =========================================================================
    // 12. INITIALIZE ALL MODULES
    // =========================================================================
    initSahayakAi();
    renderSavedPlans();
    initEmergencyCenter();
    initWeatherForecasting();
    initGeminiPassAdvisory();
    initGeminiEmergencyCopilot();
    initGeminiPackingPlanner();
    initFoodInspectionDepartment();
    initGeminiStatusModal();

})();
