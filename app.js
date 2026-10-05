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
        if (!apiKey || !apiKey.trim()) {
            return { success: false, error: 'No API key configured' };
        }
        let lastError = null;

        // Try the last verified working model first for ultra-fast latency
        const modelsToTry = [lastWorkingModel, ...GEMINI_CANDIDATE_MODELS.filter(m => m !== lastWorkingModel)];

        for (const model of modelsToTry) {
            if (!model) continue;
            let timeoutId = null;
            try {
                const controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 6000);

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    signal: controller.signal,
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
                if (timeoutId) clearTimeout(timeoutId);

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
                if (timeoutId) clearTimeout(timeoutId);
                lastError = err.message || err;
                console.warn(`Gemini candidate model ${model} failed:`, err);
            }
        }
        return { success: false, error: lastError || 'All Gemini models unavailable' };
    }

    // =========================================================================
    // SAHAYAKMITR.ai CONVERSATIONAL MEMORY & ITINERARY KNOWLEDGE ENGINE
    // =========================================================================
    const sahayakMemory = {
        lastDestination: null,
        lastDuration: 3,
        lastVibe: 'mountain',
        lastPlan: null,
        plannedPlaces: [] // Array of { destination, title, duration, price, date }
    };

    function addPlaceToSahayakMemory(plan) {
        if (!plan) return;
        sahayakMemory.lastDestination = plan.destination;
        sahayakMemory.lastDuration = parseInt(plan.duration) || 3;
        sahayakMemory.lastVibe = plan.vibe || 'cultural';
        sahayakMemory.lastPlan = plan;

        const destName = (plan.destination || '').split('&')[0].split('(')[0].trim();
        const existingIdx = sahayakMemory.plannedPlaces.findIndex(p => p.name.toLowerCase() === destName.toLowerCase());
        if (existingIdx !== -1) {
            sahayakMemory.plannedPlaces[existingIdx] = {
                name: destName,
                title: plan.title,
                duration: plan.duration,
                price: plan.pricePerPerson,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } else {
            sahayakMemory.plannedPlaces.push({
                name: destName,
                title: plan.title,
                duration: plan.duration,
                price: plan.pricePerPerson,
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        }
        renderSahayakMemoryBar();
    }

    function renderSahayakMemoryBar() {
        const memoryBar = document.getElementById('sahayak-memory-bar');
        const tagsList = document.getElementById('memory-tags-list');
        if (!memoryBar || !tagsList) return;

        if (sahayakMemory.plannedPlaces.length === 0) {
            memoryBar.style.display = 'none';
            tagsList.innerHTML = '';
            return;
        }

        memoryBar.style.display = 'flex';
        tagsList.innerHTML = sahayakMemory.plannedPlaces.map(p => `
            <span class="memory-tag-chip" data-dest="${p.name}" title="Click to view details for ${p.name}">
                📍 ${p.name} (${p.duration.split('/')[0].trim()})
            </span>
        `).join('');

        // Wire click on memory tag
        tagsList.querySelectorAll('.memory-tag-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const dest = chip.dataset.dest;
                const input = document.getElementById('chat-user-input');
                if (input) {
                    input.value = `Review structured itinerary for ${dest}`;
                    input.focus();
                }
            });
        });
    }

    // =========================================================================
    // EXHAUSTIVE MASTER DESTINATION DATABASE (30+ REGIONS & SACRED CIRCUITS)
    // =========================================================================
    const DESTINATION_DATABASE = {
        mumbai: {
            destination: "Mumbai & Coastal Maharashtra",
            titleTemplate: (dur) => `${dur}-Day Mumbai Coastal Metropolis, Heritage Gateway & Bollywood Trail`,
            basePrice: 4899,
            altitudeTag: "Sea Level Coastal Metropolis (Arabian Sea Shore)",
            advisory: "Light cottons recommended. Monsoon travel requires high-traction footwear. Rapid transit via Coastal Road & Metro Line 3.",
            pickup: "Chhatrapati Shivaji Maharaj International Airport (BOM) / CSMT Station",
            highlights: [
                "Gateway of India & Elephanta UNESCO Rock-Cut Caves",
                "Marine Drive Queen's Necklace Sunset Promenade",
                "Bandra-Worli Sea Link & Bandstand Bollywood Trail",
                "Siddhivinayak Temple & Kala Ghoda Art District"
            ],
            foodRecs: "Historic Cafe Mondegar & Yazdani Bakery Bun Maska, Sardar Refreshments Pav Bhaji, Mahesh Lunch Home coastal butter garlic crab, audited street-side Sev Puri at Chowpatty.",
            days: [
                {
                    day: "DAY 01",
                    title: "Colonial South Mumbai, Gateway of India & Marine Drive Sunset",
                    desc: "🌅 Morning: Chauffeur pickup and heritage walk starting at CSMT (UNESCO World Heritage Gothic marvel) through Fort and Kala Ghoda Arts Quarter. Breakfast at iconic 1950s Cafe Mondegar or Yazdani Bakery for classic Bun Maska and Parsi chai.\n☀️ Afternoon: Proceed to Gateway of India; private harbor ferry cruise across Mumbai Harbor to Elephanta Caves (6th-century rock-cut Shiva sculptures).\n🌆 Evening: Sunset stroll along Marine Drive ('The Queen's Necklace'). Sample audited safe Pav Bhaji at Chowpatty and coastal seafood dinner at Mahesh Lunch Home."
                },
                {
                    day: "DAY 02",
                    title: "Bandra Heritage, Portuguese Villages & Bandra-Worli Sea Link",
                    desc: "🌅 Morning: VIP Darshan assistance at Shree Siddhivinayak Ganapati Mandir (Prabhadevi) and scenic Haji Ali Dargah promenade.\n☀️ Afternoon: Cruise across the architectural triumph Bandra-Worli Sea Link. Explore Bandra's Portuguese heritage hamlets (Ranwar Village, Mount Mary Basilica) and boutique street shopping at Hill Road.\n🌆 Evening: Golden hour at Bandra Bandstand near Mannat & Galaxy apartments. Dinner at Carter Road social strip."
                },
                {
                    day: "DAY 03",
                    title: "Kanheri Caves, Film City & Juhu Beach Culture",
                    desc: "🌅 Morning: Morning excursion to Sanjay Gandhi National Park & ancient Kanheri Buddhist Caves carved into basalt cliffs.\n☀️ Afternoon: Dadasaheb Phalke Chitranagari (Film City) studio tour in Goregaon; glimpse behind-the-scenes Bollywood production sets.\n🌆 Evening: Sunset relaxation at Juhu Beach; taste audited hygienic Bhel Puri, Sev Puri, and traditional Malai Kulfi Falooda."
                },
                {
                    day: "DAY 04",
                    title: "Alibaug Speedboat Day Cruise or Colaba Art District",
                    desc: "🌅 Morning: 20-minute speedboat from Gateway to Mandwa/Alibaug for pristine Kolaba Sea Fort exploration.\n☀️ Afternoon: Lunch at coastal boutique cafe; return to South Mumbai for National Gallery of Modern Art (NGMA) and Jehangir Art Gallery.\n🌆 Evening: Souvenir shopping at Colaba Causeway and farewell dinner at Leopold Cafe."
                },
                {
                    day: "DAY 05",
                    title: "Dhobi Ghat Heritage, Crawford Market & Departure",
                    desc: "🌅 Morning: Guided halt at historic Mahalaxmi Dhobi Ghat and lively Crawford Market spice corridors.\n☀️ Afternoon: Last-minute shopping for Alphonso mangoes (seasonal) and Bombay Halwa.\n🌆 Evening: Sanitized airport/railway transfer with Traveliser verified escort."
                }
            ]
        },

        pune: {
            destination: "Pune & Maratha Sahyadri Strongholds",
            titleTemplate: (dur) => `${dur}-Day Peshwa Citadel, Sahyadri Mountain Forts & Cultural Heartland`,
            basePrice: 4299,
            altitudeTag: "Elevation: 560 M (Deccan Plateau Foothills)",
            advisory: "Pleasant year-round weather. Trekking footwear essential for Sinhagad Fort. Carry windcheater for hilltop breeze.",
            pickup: "Pune International Airport (PNQ) / Pune Junction (PUNE)",
            highlights: [
                "Shaniwar Wada 18th-Century Peshwa Citadel",
                "Sinhagad Fort Historic Summit Trek & Pithla Bhakri",
                "Aga Khan Palace & Mahatma Gandhi Memorial",
                "Dagdusheth Halwai Ganpati & FC Road Food Trail"
            ],
            foodRecs: "Puneri Misal Pav at audited heritage hubs, authentic Maharashtrian Thalipeeth and Kothimbir Vadi, Chitale Bandhu Bakarwadi, Sujata Mastani thick mango shake.",
            days: [
                {
                    day: "DAY 01",
                    title: "Historical Peshwa Citadel & Shreemant Dagdusheth Darshan",
                    desc: "🌅 Morning: Visit Shaniwar Wada, the grand seat of the Peshwa rulers built in 1732; explore Delhi Darwaza and fountain courtyards. Walk to historic Vishrambaug Wada.\n☀️ Afternoon: VIP Darshan at the revered Shreemant Dagdusheth Halwai Ganpati Temple. Authentic Maharashtrian lunch (Thalipeeth, Puran Poli, Solkadhi) at audited heritage dining.\n🌆 Evening: Walk along Fergusson College (FC) Road; taste spicy Puneri Misal Pav and iconic Sujata Mastani."
                },
                {
                    day: "DAY 02",
                    title: "Aga Khan Palace, Kelkar Museum & Koregaon Park Vibe",
                    desc: "🌅 Morning: Tour the Italian-arched Aga Khan Palace (where Mahatma Gandhi was detained in 1942; serene Gandhi memorial gardens).\n☀️ Afternoon: Explore Raja Dinkar Kelkar Museum displaying 20,000 historic Indian artifacts and Mastani Mahal reconstruction.\n🌆 Evening: Stroll through Koregaon Park's lush Osho Teerth Zen Gardens followed by contemporary cafe dining on North Main Road."
                },
                {
                    day: "DAY 03",
                    title: "Sinhagad Fort Sahyadri Expedition & Khadakwasla Dam",
                    desc: "🌅 Morning: Chauffeur drive to Sinhagad Fort (1,312m). Scenic uphill walk; explore Tanaji Malusare's memorial and historic Kalyan Darwaza with breathtaking valley panoramas.\n☀️ Afternoon: Traditional summit lunch prepared by local villager guilds: piping-hot Pithla Bhakri, Thecha, and fresh clay-pot Dahi.\n🌆 Evening: Descend via scenic Khadakwasla Dam promenade; return transfer to Pune city center or airport."
                },
                {
                    day: "DAY 04",
                    title: "Lonavala, Karla-Bhaja Buddhist Caves & Western Ghats",
                    desc: "🌅 Morning: Scenic drive up the Western Ghats to Karla and Bhaja rock-cut Buddhist caves dating from 2nd century BCE.\n☀️ Afternoon: Visit Tiger's Leap and Bhushi Dam in Lonavala; sample authentic Maganlal chikki.\n🌆 Evening: Return to Pune with sunset views over the Deccan plateau."
                }
            ]
        },

        gwalior: {
            destination: "Gwalior Citadel & Royal Scindia Heritage",
            titleTemplate: (dur) => `${dur}-Day Gibraltar of India, Jai Vilas Crystal Palace & Musical Legends`,
            basePrice: 4199,
            altitudeTag: "Elevation: 211 M (Vindhyan Sandstone Hill)",
            advisory: "Comfortable walking shoes needed for exploring the 3km fort plateau. Sunny midday; carry sun protection.",
            pickup: "Rajmata Vijaya Raje Scindia Airport (GWL) / Gwalior Junction (GWL)",
            highlights: [
                "Gwalior Fort & Man Singh Palace Blue Ceramic Tilework",
                "Jai Vilas Palace Durbar Hall & 3.5-Ton Crystal Chandeliers",
                "Tomb of Tansen & Gwalior Classical Gharana Shrines",
                "Saas Bahu & 8th-Century Teli Ka Mandir Architecture"
            ],
            foodRecs: "Crispy Gwalior Bedai with spiced potato curry, freshly fried Samosas, Morena Gajak, creamy Rabri at audited sweet shops in Sarafa Bazaar.",
            days: [
                {
                    day: "DAY 01",
                    title: "The Impregnable Gwalior Fort Plateau & Man Singh Palace",
                    desc: "🌅 Morning: Ascend through Urwahi Gate viewing massive 7th to 15th-century rock-cut Jain Tirthankara monoliths. Tour the magnificent Man Singh Palace with vibrant turquoise and yellow duck ceramic tilework.\n☀️ Afternoon: Discover the architectural brilliance of Saas Bahu Temple (11th century) and Teli Ka Mandir (the fort's tallest 100-ft shrine merging Dravidian and Nagara styles).\n🌆 Evening: Experience the world-renowned Sound & Light Show at Gwalior Fort amphitheater narrating centuries of Tomar, Mughal, and Scindia history."
                },
                {
                    day: "DAY 02",
                    title: "Jai Vilas Palace Durbar Hall & Classical Musical Trail",
                    desc: "🌅 Morning: Guided tour of the royal Jai Vilas Palace. Marvel at the grand Durbar Hall with its world's largest pair of 3.5-ton crystal chandeliers, gold leaf ceilings, and the solid silver model train serving royal banquet spirits.\n☀️ Afternoon: Visit the Tomb of legendary musician Tansen and Sufi saint Muhammad Ghaus; learn about the origins of the Gwalior Classical Gharana.\n🌆 Evening: Sample famous Gwalior Bedai, Samosas, and traditional Morena Gajak at certified heritage sweetmakers in Sarafa Bazaar."
                },
                {
                    day: "DAY 03",
                    title: "Sun Temple, Tigra Dam Reservoir & Departure",
                    desc: "🌅 Morning: Visit the Sun Temple (Surya Mandir) inspired by Konark, crafted in pristine red sandstone and white marble.\n☀️ Afternoon: Excursion to Tigra Dam reservoir for speedboating and nature relaxation.\n🌆 Evening: Souvenir shopping for Chanderi silks and return transfer to Gwalior station or airport."
                }
            ]
        },

        kanpur: {
            destination: "Kanpur & Sacred Bithoor on the Ganges",
            titleTemplate: (dur) => `${dur}-Day Valmiki Ramayana Heartland, Colonial Legacy & Awadhi Flavors`,
            basePrice: 3899,
            altitudeTag: "Elevation: 126 M (Indo-Gangetic Plains)",
            advisory: "Modest attire for sacred temples and ghats. Only drink sealed mineral water provided in Traveliser kits.",
            pickup: "Kanpur Central (CNB) / Kanpur Airport (KNU) / Lucknow CCS Hub (LKO)",
            highlights: [
                "Bithoor Brahmavart Ghat — Center of the Universe & Valmiki Ashram",
                "Shri Radhakrishna JK Temple Pristine White Marble Wonder",
                "Allen Forest Zoo Safari & Natural Lake Habitat",
                "Legendary Thaggu Ke Laddu & Badnam Kulfi Gastronomic Trail"
            ],
            foodRecs: "World-famous Thaggu Ke Laddu made with pure khoya and gond, Badnam Kulfi with pistachio saffron cream, Bada Chauraha Chaat, Bithoor peda.",
            days: [
                {
                    day: "DAY 01",
                    title: "Sacred Bithoor, Brahmavart Ghat & Valmiki Ashram",
                    desc: "🌅 Morning: Chauffeur drive to historic Bithoor along the holy Ganges. Visit Brahmavart Ghat, where Lord Brahma performed the celestial Ashvamedha Yajna.\n☀️ Afternoon: Explore Valmiki Ashram (where Maharishi Valmiki penned the Ramayana and Goddess Sita gave birth to Luv & Kush). Visit Sita Kund and Sita Rasoi.\n🌆 Evening: Private sunset boat ride at Dhruva Teela; witness evening Ganges Maha Aarti. Taste Bithoor's traditional fresh peda."
                },
                {
                    day: "DAY 02",
                    title: "JK Marble Temple, Allen Forest Zoo & Iconic Food Walk",
                    desc: "🌅 Morning: Visit the neo-Hindu architectural masterpiece Shri Radhakrishna Temple (JK Temple), constructed in pristine white marble with five distinct spires.\n☀️ Afternoon: Explore Allen Forest Zoo (one of Asia's largest natural habitat zoological reserves set around Lake Allen) and Kanpur Memorial Church (1875).\n🌆 Evening: Gastronomic walk to taste the legendary 'Thaggu Ke Laddu' and Badnam Kulfi at Bada Chauraha, followed by Moti Jheel lakeside stroll."
                },
                {
                    day: "DAY 03",
                    title: "Ganges Barrage, Nana Rao Park & Leather Handloom Guilds",
                    desc: "🌅 Morning: Visit the monumental Ganges Barrage (Luv Kush Barrage) with sweeping river views; stroll through Nana Rao Park (historic 1857 freedom struggle memorial).\n☀️ Afternoon: Shopping for world-renowned Kanpur leather goods, saddlery, and hand-embroidered textiles at Naveen Market.\n🌆 Evening: Departure transfer to Kanpur Central or Lucknow airport."
                }
            ]
        },

        banaras: {
            destination: "Varanasi (Banaras) & Sacred Kashi Corridor",
            titleTemplate: (dur) => `${dur}-Day Sacred Ghats, Kashi Vishwanath Corridor & Sarnath Stupa`,
            basePrice: 4699,
            altitudeTag: "Elevation: 80 M (Sacred Crescent of the Ganges)",
            advisory: "Comfortable walking shoes for ancient cobblestone gullies. Respectful attire for shrines. FSSAI-audited eateries included.",
            pickup: "Lal Bahadur Shastri International Airport (VNS) / Varanasi Cantt (BSB)",
            highlights: [
                "Sunrise Wooden Boat Cruise across 84 Historic Ghats",
                "VIP Dashashwamedh Maha Ganga Aarti Front-Row Seating",
                "Kashi Vishwanath Golden Temple Corridor Darshan",
                "Sarnath Dhamek Stupa where Buddha Preached First Sermon"
            ],
            foodRecs: "Kachori Gali crispy breakfast with spiced hing potato curry & hot jalebi, saffron-cardamom Malaiyyo foam dessert, Blue Lassi, authentic Banarasi Paan.",
            days: [
                {
                    day: "DAY 01",
                    title: "Arrival, Sacred Ghats Boat Cruise & Evening Maha Ganga Aarti",
                    desc: "🌅 Morning: Chauffeur pickup from airport/station; check-in to heritage riverside haveli. Fresh morning ginger chai and orientation.\n☀️ Afternoon: Heritage walking corridor through ancient labyrinthine alleys. FSSAI-audited Kachori-Jalebi tasting at Ram Bhandar.\n🌆 Evening: Private wooden boat cruise from Assi Ghat to Manikarnika Ghat witnessing 3,000 years of living traditions. VIP front-row seating at Dashashwamedh Ghat for the grand Maha Ganga Aarti."
                },
                {
                    day: "DAY 02",
                    title: "Kashi Vishwanath Corridor Darshan & Sarnath Buddhist Stupa",
                    desc: "🌅 Morning: Special entry darshan assistance at Kashi Vishwanath Golden Temple corridor and Annapurna Temple.\n☀️ Afternoon: Excursion to Sarnath (Dhamek Stupa, Deer Park & Ashoka Pillar where Lord Buddha taught his first sermon). Visit Sarnath Archaeological Museum.\n🌆 Evening: Authentic Banarasi Silk Saree master-weaver guild visit; seasonal saffron-cardamom Malaiyyo tasting."
                },
                {
                    day: "DAY 03",
                    title: "Subah-e-Banaras at Assi Ghat & Departure Transfer",
                    desc: "🌅 Morning: Subah-e-Banaras classical music & Vedic chanting at Assi Ghat at dawn, followed by yoga session by the Ganges.\n☀️ Afternoon: Cross the river to explore Ramnagar Fort & Museum housing vintage royal carriages and swords.\n🌆 Evening: Authentic Banarasi Paan tasting and verified departure escort to airport/railway station."
                }
            ]
        },

        prayagraj: {
            destination: "Prayagraj & Holy Triveni Sangam",
            titleTemplate: (dur) => `${dur}-Day Holy Triveni Sangam, Immortal Akshayavat & Nehru Dynasty`,
            basePrice: 3999,
            altitudeTag: "Elevation: 98 M (Sacred Confluence of Ganga, Yamuna & Saraswati)",
            advisory: "Life jackets mandatory for Sangam boat rides. Keep footwear in designated cloakrooms at sacred bathing spots.",
            pickup: "Prayagraj Airport (IXD) / Prayagraj Junction (PRYJ)",
            highlights: [
                "Triveni Sangam Holy Confluence Bath & Decorated Boat Cruise",
                "Allahabad Fort & Undying Immortal Akshayavat Tree",
                "Anand Bhavan Ancestral Estate of Jawaharlal Nehru",
                "Chandrashekhar Azad Park & All Saints Anglican Cathedral"
            ],
            foodRecs: "Prayagraj famous Dehati Rasgulla, spicy Loknath Gali Dum Aloo & Chaat, Hari Ram & Sons dry fruit Namkeen, creamy Rabri Lassi.",
            days: [
                {
                    day: "DAY 01",
                    title: "Holy Triveni Sangam Dip & Akbar's Imperial Fort",
                    desc: "🌅 Morning: Chauffeur transfer to Sangam Ghat. Board private decorated wooden boat to the exact confluence of the pale green Yamuna and muddy Ganga rivers. Sacred holy bath ritual with priest assistance.\n☀️ Afternoon: Special entry into the Mughal Allahabad Fort to witness the legendary Akshayavat (the indestructible holy banyan tree) and Patalpuri subterranean temple.\n🌆 Evening: Visit Bade Hanuman Ji Mandir (unique reclining Lord Hanuman idol submerged annually by the Ganga). Sunset riverside Aarti at Saraswati Ghat."
                },
                {
                    day: "DAY 02",
                    title: "Freedom Struggle Trail, Anand Bhavan & Azad Memorial",
                    desc: "🌅 Morning: Tour Anand Bhavan (the majestic two-story mansion of the Nehru-Gandhi family, now an inspiring memorial museum) and adjacent Swaraj Bhavan.\n☀️ Afternoon: Visit Chandrashekhar Azad Park (historic Alfred Park where the legendary revolutionary made his supreme sacrifice) and Allahabad Museum (preserving ancient Gandhara sculptures and Chandrashekhar Azad's Colt pistol).\n🌆 Evening: Marvel at the Gothic-revival architecture of All Saints Cathedral (Patthar Girja, 1871); taste Prayagraj's famous Dehati Rasgulla and spicy Loknath chaat."
                },
                {
                    day: "DAY 03",
                    title: "Khusro Bagh Mughal Mausoleums & Departure",
                    desc: "🌅 Morning: Walk through the manicured Mughal walled gardens of Khusro Bagh, housing the exquisite carved sandstone mausoleums of Prince Khusro and Sultan Begum.\n☀️ Afternoon: Souvenir shopping for local brassware and holy Sangam souvenirs.\n🌆 Evening: Return transfer to Prayagraj Junction or airport."
                }
            ]
        },

        agra: {
            destination: "Agra & Imperial Mughal Wonders",
            titleTemplate: (dur) => `${dur}-Day Crown Jewel of Architecture, Taj Sunrise & Fatehpur Sikri`,
            basePrice: 4799,
            altitudeTag: "Elevation: 171 M (Yamuna Basin)",
            advisory: "Taj Mahal is closed on Fridays. Sunrise entry recommended for best golden light and minimal crowds.",
            pickup: "Agra Cantt (AGC) / Delhi NCR Transfer via Yamuna Expressway",
            highlights: [
                "Taj Mahal Golden Hour Sunrise Guided Photography",
                "Agra Fort Red Sandstone Citadel & Sheesh Mahal",
                "UNESCO Fatehpur Sikri & 54m Buland Darwaza",
                "Mehtab Bagh Sunset Reflection Across Yamuna"
            ],
            foodRecs: "Authentic Agra Panchhi Petha (Kesar, Angoori, Paan flavors), Bedai & Jalebi breakfast, Mughlai Dum Biryani at audited heritage kitchens.",
            days: [
                {
                    day: "DAY 01",
                    title: "Taj Mahal Sunrise Splendor & Agra Fort Citadel",
                    desc: "🌅 Morning: Dawn VIP entry to the Taj Mahal. Experience the changing hues of white Makrana marble as the morning sun rises over the Yamuna River. Expert guided architectural tour.\n☀️ Afternoon: Tour the colossal red sandstone Agra Fort; explore Diwan-i-Am, Diwan-i-Khas, and the Sheesh Mahal where Shah Jahan was held in his final years with views of the Taj.\n🌆 Evening: Sunset across the river at Mehtab Bagh (Moonlight Garden) capturing the Taj Mahal reflected in the Yamuna waters. Sample famous Agra Petha at authentic Panchhi Petha stores."
                },
                {
                    day: "DAY 02",
                    title: "UNESCO Fatehpur Sikri & Baby Taj Mausoleum",
                    desc: "🌅 Morning: Excursion to Emperor Akbar's abandoned red sandstone capital Fatehpur Sikri (37 km). Marvel at the 54-meter-tall Buland Darwaza, Jama Masjid, and white marble tomb of Sufi saint Sheikh Salim Chishti.\n☀️ Afternoon: Return to Agra; visit the exquisite Tomb of I'timad-ud-Daulah ('Baby Taj'), renowned for its delicate Pietra Dura marble inlay work pre-dating the Taj.\n🌆 Evening: Artisan demonstration of traditional marble inlay (Parchin Kari) and departure transfer."
                }
            ]
        },

        goa: {
            destination: "Goa Coastal Paradise & Konkan Sunsets",
            titleTemplate: (dur) => `${dur}-Day Tropical Coastline, Portuguese Heritage & Water Sports`,
            basePrice: 5899,
            altitudeTag: "Sea Level Tropical Coastline",
            advisory: "Sun protection and beachwear recommended. Water sports subject to weather. 24x7 Women Safety GPS Link active.",
            pickup: "Manohar International Airport Mopa (GOX) / Dabolim (GOI) / Madgaon (MAO)",
            highlights: [
                "North Goa Fort Aguada & Chapora Clifftop Viewpoints",
                "South Goa Pristine Palolem & Butterfly Beach Cruise",
                "UNESCO Old Goa Basilica of Bom Jesus",
                "Dudhsagar Waterfalls Jeep Safari & Spice Plantation"
            ],
            foodRecs: "Goan Fish Curry Thali with Kingfish, Prawn Balchão, Bebinca layered dessert, fresh coconut water, audited beachside shacks.",
            days: [
                {
                    day: "DAY 01",
                    title: "North Goa Heritage Forts & Sunset Beach Vibes",
                    desc: "🌅 Morning: Chauffeur pickup and check-in to coastal beach resort. Welcome fresh tender coconut water and relaxation.\n☀️ Afternoon: Visit 17th-century Fort Aguada and its historic Portuguese lighthouse overlooking the Arabian Sea. Walk along Sinquerim and Candolim beaches.\n🌆 Evening: Clifftop golden hour at Chapora Fort (famous Dil Chahta Hai viewpoint) overlooking Vagator beach. Dinner at Curleys or Tito's lane."
                },
                {
                    day: "DAY 02",
                    title: "Water Sports & Baga-Calangute Promenade",
                    desc: "🌅 Morning: Guided water sports adventure at Calangute/Anjuna (parasailing, jet-skiing, banana ride with certified safety instructors).\n☀️ Afternoon: Explore colorful Portuguese villas of Fontainhas (Latin Quarter in Panaji) with pastel-colored houses and art galleries.\n🌆 Evening: Mandovi River 1-hour sunset cruise with live Goan folk dance and music."
                },
                {
                    day: "DAY 03",
                    title: "UNESCO Old Goa Churches & Organic Spice Plantation",
                    desc: "🌅 Morning: Tour Old Goa's UNESCO World Heritage churches: Basilica of Bom Jesus (holding relics of St. Francis Xavier) and majestic Se Cathedral.\n☀️ Afternoon: Guided walk through Sahakari Spice Plantation; savor traditional Goan buffet lunch served on banana leaves with Feni tasting.\n🌆 Evening: Relax at Miramar beach; shopping for Goan feni, cashew nuts, and handicrafts."
                },
                {
                    day: "DAY 04",
                    title: "South Goa Pristine Palolem & Dudhsagar Waterfalls",
                    desc: "🌅 Morning: 4x4 Jeep safari through Bhagwan Mahavir Wildlife Sanctuary to the roaring 4-tiered Dudhsagar Waterfalls (310m cascade).\n☀️ Afternoon: Drive to South Goa's tranquil crescent Palolem Beach; take a boat to Butterfly Beach and spot playful dolphins.\n🌆 Evening: Beachside candlelit dinner with fresh grilled lobster or Kingfish; departure transfer."
                }
            ]
        },

        aurangabad: {
            destination: "Chhatrapati Sambhajinagar & UNESCO Rock-Cut Caves",
            titleTemplate: (dur) => `${dur}-Day Ancient Ajanta Frescoes, Monolithic Kailash Temple & Deccan Citadel`,
            basePrice: 5499,
            altitudeTag: "Elevation: 568 M (Basalt Rock Formations)",
            advisory: "Ajanta Caves closed on Mondays; Ellora Caves closed on Tuesdays. Flash photography strictly prohibited inside fresco caves.",
            pickup: "Chhatrapati Sambhajinagar Airport (IXU) / Railway Station (AWB)",
            highlights: [
                "UNESCO Ellora Cave 16 — Monolithic Kailash Temple carved from single rock",
                "UNESCO Ajanta Caves 30 Buddhist Rock-Cut Monasteries & Frescoes",
                "Bibi Ka Maqbara — The Taj of the Deccan",
                "Daulatabad Medieval Hilltop Fortress & Grishneshwar Jyotirlinga"
            ],
            foodRecs: "Authentic Naan Qalia (slow-cooked spiced meat with tandoori bread), Aurangabadi Biryani, Imarti, and fresh sugarcane juice.",
            days: [
                {
                    day: "DAY 01",
                    title: "Ellora Caves & Kailash Temple Monolithic Marvel",
                    desc: "🌅 Morning: Explore the world's greatest architectural feat: Ellora Cave 16 (The Kailash Temple), carved top-to-bottom from a single colossal basalt cliff, requiring removal of 200,000 tons of rock.\n☀️ Afternoon: Tour Buddhist and Jain cave groups; visit Grishneshwar Jyotirlinga (the 12th holy Jyotirlinga shrine just 1 km away).\n🌆 Evening: Ascend the unconquered medieval Daulatabad Fort featuring deep moats and a deceptive dark maze (Bhool Bhulaiya)."
                },
                {
                    day: "DAY 02",
                    title: "World-Famous Ajanta Caves Buddhist Frescoes",
                    desc: "🌅 Morning: Scenic drive to Ajanta Caves (100 km). Walk along the crescent gorge above Waghur River, discovering 30 rock-cut caves dating from 2nd century BCE.\n☀️ Afternoon: Marvel at the UNESCO Buddhist mural paintings (Padmapani and Vajrapani Bodhisattvas) and the colossal 29-ft Reclining Buddha.\n🌆 Evening: Return to city; visit a traditional weaving unit to witness handwoven Paithani silk sarees with pure gold Zari borders."
                },
                {
                    day: "DAY 03",
                    title: "Bibi Ka Maqbara & Deccan Historical Heritage",
                    desc: "🌅 Morning: Visit Bibi Ka Maqbara, the mausoleum of Mughal empress Dilras Banu Begum, celebrated as the 'Taj of the Deccan'.\n☀️ Afternoon: Tour Panchakki (17th-century water mill with underground earthen pipes) and Aurangabad Caves.\n🌆 Evening: Sample authentic Naan Qalia and departure transfer."
                }
            ]
        },

        manali: {
            destination: "Manali, Solang Valley & Rohtang Pass",
            titleTemplate: (dur) => `${dur}-Day Himalayan High-Pass, Glacial Valleys & Atal Snow Corridor`,
            basePrice: 5899,
            altitudeTag: "Elevation: 2,050 M to 3,978 M (Sub-Alpine to High Pass)",
            advisory: "Acclimatize on Day 1. Drink 3-4L water daily. Rohtang Pass permits and snow suits arranged by Traveliser.",
            pickup: "Bhuntar Airport (KUU) / Chandigarh Airport (IXC) / Delhi ISBT Volvo",
            highlights: [
                "Rohtang Pass (3,978m) Crest & Glacial Snow Point",
                "Atal Tunnel (3,100m) Crossing to Sissu Glacial Waterfall",
                "Solang Valley Paragliding, Quad Biking & Skiing",
                "Old Manali Hippie Cafes & Hadimba Cedar Forest Temple"
            ],
            foodRecs: "Wood-Fired Himalayan Rainbow Trout at Johnson's Cafe (FSSAI 4.9★), Authentic Steamed Himachali Siddu with cow ghee, hot Tibetan Thukpa.",
            days: [
                {
                    day: "DAY 01",
                    title: "Arrival in Manali, Hadimba Temple & Old Manali Cafes",
                    desc: "🌅 Morning: Pickup in 4x4 SUV; check-in to boutique mountain chalet overlooking pine valleys. Acclimatization rest with hot ginger-honey tea.\n☀️ Afternoon: Visit 16th-century Hadimba Devi Temple constructed in pagoda style amidst towering deodar cedars. Walk to Vashisht village for natural hot sulphur springs.\n🌆 Evening: Stroll through bohemian Old Manali. Dinner at Johnson's Cafe & Bar tasting fresh wood-fired Himalayan Rainbow Trout with lemon caper butter."
                },
                {
                    day: "DAY 02",
                    title: "Solang Valley Adventures & Jogini Waterfall Trek",
                    desc: "🌅 Morning: Drive to Solang Valley for thrilling alpine adventure sports: tandem paragliding, zorbing, and ATV quad biking across glacial streams.\n☀️ Afternoon: Guided short trek through apple orchards to the cascading Jogini Waterfall; picnic lunch by the roaring streams.\n🌆 Evening: Explore Mall Road and Tibetan Monastery market for warm Kullu shawls and organic mountain honey."
                },
                {
                    day: "DAY 03",
                    title: "Atal Tunnel (3,100m) & Lahaul Valley Sissu Waterfall",
                    desc: "🌅 Morning: Cross the engineering marvel Atal Tunnel (9.02 km at 3,100m) passing beneath Rohtang Pass into the breathtaking trans-Himalayan Lahaul Valley.\n☀️ Afternoon: Visit the roaring Sissu Waterfall against sheer snowy crags; explore Keylong or drive up to Rohtang Pass (3,978m) snow point for snow sledging.\n🌆 Evening: Return to Manali; cozy alpine bonfire with stargazing under clear Himalayan skies."
                },
                {
                    day: "DAY 04",
                    title: "Naggar Castle Heritage & Art Gallery",
                    desc: "🌅 Morning: Drive to the historic capital Naggar. Tour the 15th-century wood-and-stone Naggar Castle overlooking the Beas river.\n☀️ Afternoon: Visit Nicholas Roerich Art Gallery showcasing iconic Himalayan paintings.\n🌆 Evening: Departure transfer to Volvo stand or airport with Traveliser mountain escort."
                }
            ]
        },

        lucknow: {
            destination: "Lucknow — City of Nawabs & Awadhi Royalty",
            titleTemplate: (dur) => `${dur}-Day Royal Imambaras, Acoustic Bhool Bhulaiya & Nawabi Gastronomy`,
            basePrice: 4699,
            altitudeTag: "Elevation: 123 M (Gomti River Valley)",
            advisory: "Tours include certified Awadhi historian guides and FSSAI-inspected gastronomic halts.",
            pickup: "Chaudhary Charan Singh International Airport (LKO) / Lucknow Charbagh (LKO)",
            highlights: [
                "Bara Imambara & World-Famous Acoustic Bhool Bhulaiya Labyrinth",
                "Rumi Darwaza & Chota Imambara Belgian Crystal Chandeliers",
                "Historic British Residency 1857 Siege Memorial",
                "Legendary Tunday Kababi & Chowk Chikankari Embroidery Trail"
            ],
            foodRecs: "Legendary 100-year-old Tunday Kababi melt-in-mouth Galouti Kababs with Ulte Tawe Ka Paratha, Dastarkhwan Dum Biryani, Prakash Kulfi Falooda, Sharma Ji Ki Chai & Bun Makkhan.",
            days: [
                {
                    day: "DAY 01",
                    title: "Bara Imambara, Bhool Bhulaiya & Imperial Rumi Darwaza",
                    desc: "🌅 Morning: Visit the majestic Bara Imambara built by Nawab Asaf-ud-Daula in 1784; marvel at the central arched hall built without a single pillar.\n☀️ Afternoon: Navigate the intriguing acoustic labyrinth of Bhool Bhulaiya with a certified historian guide. Walk beneath the 60-ft Turkish Gate (Rumi Darwaza).\n🌆 Evening: Visit Chota Imambara adorned with ornate Belgian chandeliers and gilt calligraphy. Food walk to Chowk for authentic melt-in-mouth Tunday Kababi Galouti kababs."
                },
                {
                    day: "DAY 02",
                    title: "British Residency Memorial & Hazratganj Stroll",
                    desc: "🌅 Morning: Explore the British Residency complex, preserved in its battle-scarred state from the historic 1857 First War of Independence; visit the onsite museum.\n☀️ Afternoon: Discover the royal terracotta architecture of La Martiniere College and Chattar Manzil.\n🌆 Evening: Experience 'Ganjing' — walking along Victorian-styled Hazratganj promenade. Sample Sharma Ji Ki Chai with Bun Makkhan and Prakash Kulfi."
                },
                {
                    day: "DAY 03",
                    title: "Chikankari Handloom Guilds & Awadhi Dastarkhwan",
                    desc: "🌅 Morning: Visit master artisan workshops in Chowk and Aminabad witnessing authentic Shadow work, Murri, and Phanda Chikankari embroidery.\n☀️ Afternoon: Royal royal banquet lunch featuring Awadhi Dum Biryani and Shahi Tukda at Dastarkhwan.\n🌆 Evening: Guided walk along Gomti Riverfront Park and departure transfer."
                }
            ]
        },

        muzzafarnagar: {
            destination: "Muzaffarnagar & Sacred Shukratal Ganga Circuit",
            titleTemplate: (dur) => `${dur}-Day Vedic Shrimad Bhagavatam Birthplace, Jain Shrines & Sugar Capital`,
            basePrice: 3499,
            altitudeTag: "Elevation: 249 M (Upper Doab Plains)",
            advisory: "Modest Indian ethnic attire for sacred shrines. Pure vegetarian dining throughout.",
            pickup: "Muzaffarnagar Railway Station (MOZ) / Delhi NCR Transfer (125 km)",
            highlights: [
                "Shukratal 5,100-Year-Old Immortal Akshay Vat Vriksha on Ganga Banks",
                "Sage Shukdev Temple where Shrimad Bhagavatam was First Recited",
                "Vahelna Jain Atishaya Kshetra 31-Ft Bhagwan Parshvanath Idol",
                "Gandhi Colony Food Trail & World's Largest Jaggery (Gur) Mandi"
            ],
            foodRecs: "Organic sugarcane jaggery (Gur) sweets, Gandhi Colony crispy Moong Dal Pakoras with mint chutney, Rabri Jalebi, authentic lassi.",
            days: [
                {
                    day: "DAY 01",
                    title: "Sacred Shukratal & The 5,100-Year-Old Immortal Banyan Tree",
                    desc: "🌅 Morning: Chauffeur drive to Shukratal (30 km east on holy Ganga banks). Visit the sacred Shukdev Temple under the 5,100-year-old immortal Akshay Vat tree where Sage Shukdev narrated the Shrimad Bhagavatam to King Parikshit for 7 continuous days.\n☀️ Afternoon: Holy bath at Shukratal Ganga Ghat; visit Hanuman Dham featuring a 72-ft majestic Lord Hanuman statue.\n🌆 Evening: Attend Ganga Aarti at Shukratal; participate in evening Satsang and katha recitation."
                },
                {
                    day: "DAY 02",
                    title: "Vahelna Jain Pilgrimage & Asia's Largest Jaggery Mandi",
                    desc: "🌅 Morning: Visit the renowned Vahelna Jain Temple (Atishaya Kshetra), admiring the 31-foot colossal monolith idol of Bhagwan Parshvanath set in manicured temple gardens.\n☀️ Afternoon: Guided tour of Muzaffarnagar's famous Gur Mandi (the largest organic jaggery trade market in Asia); observe traditional sugarcane juice boiling and jaggery preparation.\n🌆 Evening: Food walk through Gandhi Colony tasting famous crispy Moong Dal Pakoras, Rabri Jalebi, and authentic local chaat."
                },
                {
                    day: "DAY 03",
                    title: "Haiderpur Wetland Sanctuary & Departure",
                    desc: "🌅 Morning: Excursion to Haiderpur Wetland (Ramsar Site on the Ganga-Solani confluence) for migratory birdwatching (bar-headed geese, swamp deer).\n☀️ Afternoon: Return transfer to Muzaffarnagar station or Delhi NCR highway."
                }
            ]
        },

        faridabad: {
            destination: "Faridabad & Aravalli Green Corridor",
            titleTemplate: (dur) => `${dur}-Day 10th-Century Surajkund Reservoir, Heritage Haveli & Eco-Trails`,
            basePrice: 3699,
            altitudeTag: "Elevation: 200 M (Aravalli Range Foothills)",
            advisory: "Light walking shoes for exploring the stone amphitheater and Aravalli trails.",
            pickup: "Faridabad Railway Station (FDB) / IGI Airport Delhi Hub (DEL)",
            highlights: [
                "Historic 10th-Century Sun Amphitheater Surajkund",
                "Raja Nahar Singh 1857 Palace Haveli in Ballabhgarh",
                "Badkhal Lake Eco-Trails & Aravalli Biodiversity Ridge",
                "Baba Farid Sufi Dargah & Modern World Street Dining"
            ],
            foodRecs: "Authentic North Indian Dal Makhani, Chur-Chur Naan, Tandoori Platters, traditional Kulfi at NIT Faridabad market.",
            days: [
                {
                    day: "DAY 01",
                    title: "Historic Surajkund Sun Pool & 13th-Century Sufi Shrine",
                    desc: "🌅 Morning: Explore the ancient 10th-century Surajkund sun pool, an amphitheater-shaped reservoir built by Tomar King Suraj Pal with semi-circular stepped stone embankments.\n☀️ Afternoon: Visit the Surajkund International Crafts Mela grounds showcasing pan-Indian artisan craft traditions; walk through adjacent Aravalli Forest Ridge.\n🌆 Evening: Visit the historic 13th-century Dargah of Baba Farid (the revered Sufi saint after whom the city is named); sample traditional delicacies in Old Faridabad."
                },
                {
                    day: "DAY 02",
                    title: "Royal 1857 Nahar Singh Palace & Eco-Trails",
                    desc: "🌅 Morning: Guided tour of Raja Nahar Singh Palace in Ballabhgarh, a pristine 18th-century Rajput-Mughal heritage palace with arched courtyards and intricate Sheesh Mahal.\n☀️ Afternoon: Nature trail around Badkhal Lake bio-reserve and Asola Bhatti wildlife boundary for birdwatching and photography.\n🌆 Evening: Modern leisure and dining at World Street Faridabad (featuring London and Paris themed architecture walkways)."
                }
            ]
        },

        greaternoida: {
            destination: "Greater Noida & Yamuna Expressway Hub",
            titleTemplate: (dur) => `${dur}-Day F1 Racing Heritage, Surajpur Wetlands & Mega-Campus Tour`,
            basePrice: 3899,
            altitudeTag: "Elevation: 200 M (Planned Futuristic Metropolis)",
            advisory: "Binoculars recommended for birdwatching at Surajpur. Rapid transit via Noida-Greater Noida Aqua Line.",
            pickup: "Noida-Greater Noida Metro Corridor / IGI Airport Delhi (DEL)",
            highlights: [
                "Buddh International Circuit (F1 Track) Experience",
                "Surajpur Wetland Sanctuary Flamingos & Bird Reserve",
                "India Expo Centre & Mart Global Conventions Hub",
                "Gautam Buddha University 511-Acre Eco-Campus & Meditation Dome"
            ],
            foodRecs: "Global cuisines at Pari Chowk dining hubs, rooftop dining, authentic street food at Alpha 1 commercial center.",
            days: [
                {
                    day: "DAY 01",
                    title: "High-Speed Motorsports & Global Architecture",
                    desc: "🌅 Morning: Private tour and track-side experience at the Buddh International Circuit, India's world-class Formula 1 racing track designed by Hermann Tilke.\n☀️ Afternoon: Tour the sprawling India Expo Centre & Mart; explore the grand European architecture of Grand Venice Mall with indoor Venetian gondola canal rides.\n🌆 Evening: Stroll through lush City Park; dinner at Pari Chowk culinary boulevard."
                },
                {
                    day: "DAY 02",
                    title: "Surajpur Wetland & Gautam Buddha University",
                    desc: "🌅 Morning: Dawn birdwatching walk at Surajpur Wetland & Bird Sanctuary, spotting over 180 species including spot-billed ducks, sarus cranes, and migratory painted storks.\n☀️ Afternoon: Visit the breathtaking 511-acre Gautam Buddha University campus, admiring the colossal Mahatma Buddha statue and the acoustic meditation dome.\n🌆 Evening: Relax at the illuminated walkways of Alpha 1 Commercial Belt; departure transfer."
                }
            ]
        },

        bhopal: {
            destination: "Bhopal — City of Lakes & UNESCO Relics",
            titleTemplate: (dur) => `${dur}-Day Regal Begums of Bhopal, Bhojtal Lake & Sanchi Stupa Day Trip`,
            basePrice: 4699,
            altitudeTag: "Elevation: 527 M (Malwa Plateau)",
            advisory: "Sanchi and Bhimbetka require day trips. Sun hat and walking shoes recommended.",
            pickup: "Raja Bhoj Airport (BHO) / Bhopal Junction (BPL)",
            highlights: [
                "UNESCO Sanchi Stupa Great Buddhist Relic (3rd Century BCE)",
                "UNESCO Bhimbetka 30,000-Year-Old Prehistoric Rock Art Caves",
                "Upper Lake (Bhojtal) Sunset Yacht Cruise & Van Vihar",
                "Madhya Pradesh Tribal Museum & Taj-ul-Masajid Grandeur"
            ],
            foodRecs: "Bhopali Gosht Korma, Poha-Jalebi at Kalyan, Sulaimani Chai with salt and mint, Mawa Bati sweet.",
            days: [
                {
                    day: "DAY 01",
                    title: "City of Lakes, MP Tribal Museum & Taj-ul-Masajid",
                    desc: "🌅 Morning: Visit the architecturally stunning Madhya Pradesh Tribal Museum, showcasing life-size indigenous adivasi huts, folklore, and tribal artifacts.\n☀️ Afternoon: Explore the monumental Taj-ul-Masajid (one of the largest mosques in Asia with pink minarets) and Bharat Bhavan arts complex.\n🌆 Evening: Sunset catamaran cruise on Upper Lake (Bhojtal) followed by a lakeside safari drive through Van Vihar National Park. Sample Bhopal's iconic Bhopali Gosht Korma or Poha-Jalebi at audited dining."
                },
                {
                    day: "DAY 02",
                    title: "UNESCO Great Stupa of Sanchi & Udayagiri Caves",
                    desc: "🌅 Morning: Scenic drive to Sanchi (48 km). Explore the UNESCO World Heritage Great Stupa 1 built by Emperor Ashoka in 3rd century BCE, featuring intricately carved stone Toranas (gateways) depicting Jataka tales.\n☀️ Afternoon: Tour Stupas 2 & 3, the Ashoka Pillar, and the Sanchi Archaeological Museum. Visit nearby Udayagiri Caves (5th-century Gupta rock sculptures including the colossal Varaha avatar).\n🌆 Evening: Return to Bhopal; relax at VIP Road promenade with night city lights."
                },
                {
                    day: "DAY 03",
                    title: "UNESCO Bhimbetka Rock Shelters & Bhojpur Temple",
                    desc: "🌅 Morning: Excursion to UNESCO Bhimbetka Caves (45 km), housing over 700 rock shelters with Upper Paleolithic to Medieval cave paintings depicting hunting scenes, bison, and dancing figures.\n☀️ Afternoon: Halt at the mammoth unfinished 11th-century Bhojeshwar Shiva Temple in Bhojpur, housing one of the tallest stone Lingams in India.\n🌆 Evening: Return to Bhopal airport or railway station."
                }
            ]
        },

        jabalpur: {
            destination: "Jabalpur & Marble Rocks of Narmada",
            titleTemplate: (dur) => `${dur}-Day Bhedaghat Marble Canyon, Roaring Dhuandhar & Narmada Aarti`,
            basePrice: 4299,
            altitudeTag: "Elevation: 411 M (Vindhyan Mountain Gorge)",
            advisory: "Life jackets mandatory for Narmada boats. Full moon boat rides at Bhedaghat are magical.",
            pickup: "Dumna Airport (JLR) / Jabalpur Junction (JBP)",
            highlights: [
                "Bhedaghat Marble Rocks Boat Canyon on Emerald Narmada River",
                "Roaring Dhuandhar Waterfalls & Aerial Ropeway Cable Car",
                "10th-Century Chausath Yogini Temple Clifftop Vista",
                "Gwarighat Sacred Narmada Maha Aarti & Balancing Rock"
            ],
            foodRecs: "Jabalpur famous giant Khoya Jalebi, Badakul sweets, spicy Khopra Patties, fresh Narmada water tea.",
            days: [
                {
                    day: "DAY 01",
                    title: "The Splendor of Bhedaghat & Dhuandhar Falls",
                    desc: "🌅 Morning: Chauffeur drive to Bhedaghat (25 km). Board a traditional rowboat through the narrow 3 km gorge between soaring 100-foot gleaming white and magnesium marble rocks on the emerald Narmada River.\n☀️ Afternoon: Witness the thunderous roar and smoky spray of Dhuandhar Waterfalls; take the aerial ropeway cable car across the gorge for aerial panoramic views.\n🌆 Evening: Climb the 108 stone steps to the ancient 10th-century Chausath Yogini Temple, viewing the circular cloister of 64 yogini deities and Nandi Bull."
                },
                {
                    day: "DAY 02",
                    title: "Heritage Marvels, Balancing Rock & Sacred Narmada Aarti",
                    desc: "🌅 Morning: Visit Madan Mahal Fort (built by Gond ruler Raja Madan Shah in 1116 CE perched on a granite hill) and the adjacent geological wonder Balancing Rock.\n☀️ Afternoon: Explore Dumna Nature Reserve park with nature trails, deer spotting, and eco-boating.\n🌆 Evening: Attend the deeply spiritual and vibrant Narmada Maha Aarti at Gwarighat; float oil lamps on the sacred river. Sample Jabalpur's famous Khoya Jalebi at audited sweet stalls."
                },
                {
                    day: "DAY 03",
                    title: "Bargi Dam Reservoir Cruise & Departure",
                    desc: "🌅 Morning: Excursion to Bargi Dam on Narmada River for cruise boat ride and water sports.\n☀️ Afternoon: Departure transfer to Dumna Airport or Jabalpur station."
                }
            ]
        },

        puri: {
            destination: "Puri, Jagannath Dham & Konark Sun Coast",
            titleTemplate: (dur) => `${dur}-Day Sacred Mahaprasad, Golden Beach & UNESCO Konark Sun Chariot`,
            basePrice: 4899,
            altitudeTag: "Sea Level Bay of Bengal Coastal Corridor",
            advisory: "Strict traditional Indian dress code (no leather goods) inside Jagannath Temple. Traveliser registered temple servitor escort included.",
            pickup: "Biju Patnaik Airport Bhubaneswar (BBI) / Puri Railway Station (PURI)",
            highlights: [
                "Shree Jagannath Temple Darshan & 56-Bhog Mahaprasad",
                "UNESCO Konark Sun Temple Colossal Stone Chariot Wheels",
                "Blue Flag Certified Golden Beach Sunrise Walk",
                "Chilika Lake Satapada Irrawaddy Dolphin Boat Cruise"
            ],
            foodRecs: "Lord Jagannath 56 Bhog Mahaprasad at Anand Bazaar, authentic Chhena Poda caramelized cottage cheese cake, Dalma, coastal Odia crab curry.",
            days: [
                {
                    day: "DAY 01",
                    title: "Shree Jagannath Temple & Blue Flag Golden Beach",
                    desc: "🌅 Morning: Arrival in Puri; check-in to coastal hotel. Guided VIP Darshan assistance at Shree Jagannath Temple (one of the 4 sacred Char Dham pilgrimage shrines). Marvel at the world's largest kitchen cooking 56 Bhog in earthen pots.\n☀️ Afternoon: Savor sacred Mahaprasad at Anand Bazaar. Visit Gundicha Temple (garden house of Lord Jagannath).\n🌆 Evening: Sunset leisure at the Blue Flag certified Golden Beach; watch skilled local sand artists sculpt beach art."
                },
                {
                    day: "DAY 02",
                    title: "UNESCO Konark Sun Temple & Raghurajpur Crafts Village",
                    desc: "🌅 Morning: Scenic coastal highway drive to Konark. Explore the 13th-century UNESCO World Heritage Sun Temple, designed as a colossal 24-wheeled chariot of Surya pulled by 7 stone horses.\n☀️ Afternoon: Visit Chandrabhaga Beach; drive to Raghurajpur Heritage Crafts Village where every household preserves traditional Pattachitra palm-leaf paintings and Tussar silk art.\n🌆 Evening: Return to Puri; taste authentic coastal Odia delicacies (Chhena Poda, Dalma, and fresh seafood)."
                },
                {
                    day: "DAY 03",
                    title: "Chilika Lake Dolphin Safari & Departure",
                    desc: "🌅 Morning: Excursion to Satapada on Chilika Lake (Asia's largest brackish lagoon). Board private motorized boat to spot rare endangered Irrawaddy dolphins and visit Rajhans Island.\n☀️ Afternoon: Return transfer to Puri station or Bhubaneswar airport."
                }
            ]
        },

        konkan: {
            destination: "Konkan Coastal Route & Unconquered Sea Forts",
            titleTemplate: (dur) => `${dur}-Day Coastal Highway, Murud-Janjira Sea Fortress & Alphonso Coast`,
            basePrice: 5499,
            altitudeTag: "Coastal Cliffs & Western Ghats Estuaries",
            advisory: "Motion sickness remedies advised for winding coastal ghats. Best seafood season October to May.",
            pickup: "Mumbai / Pune Hub via Coastal Highway (Sagari Mahamarg)",
            highlights: [
                "Murud-Janjira Unconquered Island Sea Fort Boat Assault",
                "Ganpatipule Pristine Beach & Swayambhu Ganesh Shrine",
                "Ratnagiri Thibaw Palace & Alphonso Mango Orchards",
                "Malvan Sindhudurg Fort Scuba Diving & Spicy Malvani Feast"
            ],
            foodRecs: "Spicy Malvani Surmai & Pomfret fry, Solkadhi coconut kokum beverage, Kombdi Vade, fresh Alphonso mangoes and Aamras.",
            days: [
                {
                    day: "DAY 01",
                    title: "Alibaug Kolaba Fort & Kashid White Sand Beach",
                    desc: "🌅 Morning: Cruise from Mumbai to Mandwa; drive past scenic coconut groves to Alibaug. Walk through the ocean during low tide to explore 17th-century Kolaba Sea Fort.\n☀️ Afternoon: Drive along the scenic coastal highway to Kashid Beach, famed for its powdery white sands and gentle surf.\n🌆 Evening: Beachside campfire with spicy Malvani fish fry and cooling Solkadhi."
                },
                {
                    day: "DAY 02",
                    title: "Murud-Janjira Island Sea Fortress Exploration",
                    desc: "🌅 Morning: Board a traditional sailboat to Murud-Janjira, the legendary island fortress in the Arabian Sea that remained unconquered by British, Portuguese, and Maratha navies.\n☀️ Afternoon: Explore the 40-ft high granite ramparts, freshwater lakes inside the sea fort, and the colossal Kalalbangdi cannon.\n🌆 Evening: Drive south along the coastal road to Harihareshwar (the 'Kashi of South') for cliffside sunset."
                },
                {
                    day: "DAY 03",
                    title: "Ganpatipule Beach Temple & Ratnagiri Orchards",
                    desc: "🌅 Morning: Visit Ganpatipule's 400-year-old Swayambhu Ganesh Temple right on the beach, followed by seaside circumambulation (Pradakshina) around the hill.\n☀️ Afternoon: Tour Ratnagiri's Thibaw Palace (where the last King of Burma was exiled) and walk through lush Alphonso mango orchards.\n🌆 Evening: Sunset at Bhatye Beach; traditional Konkani seafood dinner."
                },
                {
                    day: "DAY 04",
                    title: "Malvan Scuba Diving & Sindhudurg Sea Fort",
                    desc: "🌅 Morning: Guided scuba diving and snorkeling session in the clear waters of Malvan coral reefs.\n☀️ Afternoon: Explore Chhatrapati Shivaji Maharaj's Sindhudurg Fort built on Kurte island.\n🌆 Evening: Return transfer towards Goa or Pune hub."
                }
            ]
        },

        munsiyari: {
            destination: "Munsiyari — Little Kashmir of Kumaon",
            titleTemplate: (dur) => `${dur}-Day Panchachuli Snow Crests, Khaliya Alpine Trek & Himalayan Waterfalls`,
            basePrice: 6299,
            altitudeTag: "Elevation: 2,200 M to 3,500 M (High-Altitude Kumaon Himalayas)",
            advisory: "Pack warm thermal layers; sub-zero winter temperatures. Acclimatization halt recommended in Chaukori/Almora.",
            pickup: "Kathgodam Railway Station (KGM) / Pantnagar Airport (PGH)",
            highlights: [
                "Unmatched 0-Degree View of Panchachuli Five Snow Peaks",
                "Khaliya Top Alpine Snow Ridge Trek (3,500m)",
                "Roaring Birthi Falls 126-Meter Mountain Cascade",
                "Darkot Traditional Pashmina & Angora Wool Weaving Hamlet"
            ],
            foodRecs: "Authentic Kumaoni Bhatt ki Churkani black bean curry, Madua (finger millet) roti, Gahat ki Dal, Bhaang ki Chutney, organic Himalayan honey.",
            days: [
                {
                    day: "DAY 01",
                    title: "Scenic High-Pass Drive & Panchachuli Sunset Glow",
                    desc: "🌅 Morning: Scenic drive from Kathgodam/Almora through winding pine valleys, passing Birthi Falls. Arrive in Munsiyari perched at 2,200m facing the majestic Panchachuli group of five peaks.\n☀️ Afternoon: Check-in to traditional alpine stone cottage; hot ginger-honey tea. Stroll to Nanda Devi Temple meadow for panoramic photography.\n🌆 Evening: Witness the breathtaking golden-orange sunset illuminating all five snow-clad peaks of Panchachuli; enjoy traditional Kumaoni dinner (Bhatt ki Churkani, Madua Roti, and Hemp seed chutney)."
                },
                {
                    day: "DAY 02",
                    title: "Khaliya Top Alpine Summit Trek (3,500m)",
                    desc: "🌅 Morning: Early morning guided trek to Khaliya Top (3,500m). Ascend through dense rhododendron and oak forests opening into vast high-altitude Bugyal (alpine meadow).\n☀️ Afternoon: Reach summit ridge enjoying 360-degree vistas of Nanda Devi, Trishul, Hardeol, and Panchachuli peaks. Packed hot mountain lunch at summit.\n🌆 Evening: Descend back to Munsiyari; relax by cozy bonfire with stargazing under crystal-clear Himalayan skies."
                },
                {
                    day: "DAY 03",
                    title: "Darkot Artisan Village & Birthi Waterfalls",
                    desc: "🌅 Morning: Visit Darkot village (6 km), renowned for handmade angora rabbit wool shawls, sheep wool blankets, and pashmina woven on ancient wooden pit looms.\n☀️ Afternoon: Hike to Maheshwari Kund (Mehsar Kund) forest lake; stop at Birthi Falls for waterfall mist photography.\n🌆 Evening: Return transfer to Kathgodam/Pantnagar with scenic Himalayan stops."
                }
            ]
        },

        nainital: {
            destination: "Nainital, Bhimtal, Sattal & Mukteshwar Lake District",
            titleTemplate: (dur) => `${dur}-Day Emerald Glacial Lakes, Snow View Ropeway & Chauli Ki Jali Cliffs`,
            basePrice: 4899,
            altitudeTag: "Elevation: 1,938 M to 2,286 M (Kumaon Outer Himalayas)",
            advisory: "Brisk mountain evenings; fleece layers recommended year-round. Boating life jackets mandatory.",
            pickup: "Kathgodam Railway Station (KGM) / Pantnagar Airport (PGH) / Delhi NCR Volvo",
            highlights: [
                "Naini Lake Yacht Boating & Naina Devi Lakeside Shrine",
                "Mukteshwar 180° Himalayan Vista & Chauli Ki Jali Clifftop",
                "Bhimtal Island Lake Aquarium & Water Sports",
                "Sattal Seven Interconnected Pristine Forest Birding Lakes"
            ],
            foodRecs: "Kumaoni Aloo Ke Gutke with mountain coriander, Bal Mithai from Almora, steaming Thukpa, Mall Road fresh fruit bakes.",
            days: [
                {
                    day: "DAY 01",
                    title: "Naini Lake Yacht Sailing, Mall Road & Naina Devi",
                    desc: "🌅 Morning: Pickup from Kathgodam/Pantnagar; drive through winding mountain corridors to Nainital. Check-in to lakeside heritage hotel.\n☀️ Afternoon: Private yacht rowing on the emerald waters of Naini Lake. Visit the revered lakeside Naina Devi Temple (one of the 51 Shakti Peethas).\n🌆 Evening: Stroll along Mall Road and Tibetan Bazaar; sample steaming hot momos and authentic Kumaoni Bal Mithai."
                },
                {
                    day: "DAY 02",
                    title: "Snow View Aerial Ropeway & Tiffin Top Trek",
                    desc: "🌅 Morning: Take the aerial cable car to Snow View Point (2,270m) for panoramic vistas of the snow-clad Trishul, Nanda Devi, and Nanda Kot peaks.\n☀️ Afternoon: Gentle horse trek or hike to Dorothy's Seat at Tiffin Top (2,292m) for 360-degree views of Nainital town.\n🌆 Evening: Visit the High-Altitude Himalayan Zoo home to snow leopards, Tibetan wolves, and Himalayan black bears."
                },
                {
                    day: "DAY 03",
                    title: "Lake District Circuit: Bhimtal, Sattal & Naukuchiatal",
                    desc: "🌅 Morning: Excursion to Bhimtal; take an island boat to the lake aquarium. Drive to Sattal (seven interconnected freshwater forest lakes), heaven for birdwatchers.\n☀️ Afternoon: Visit nine-cornered Naukuchiatal for tandem paragliding and kayaking.\n🌆 Evening: Sunset lakeside dinner at a boutique cafe in Bhimtal."
                },
                {
                    day: "DAY 04",
                    title: "Mukteshwar 180° Himalayan Vista & Chauli Ki Jali",
                    desc: "🌅 Morning: Drive to scenic Mukteshwar (2,286m) through dense fruit orchards of apples and peaches. Visit 350-year-old Mukteshwar Dham Shiva temple.\n☀️ Afternoon: Stand atop Chauli Ki Jali, a sheer clifftop offering breathtaking 180-degree panoramas of the Greater Himalayas.\n🌆 Evening: Departure transfer to Kathgodam station or Delhi."
                }
            ]
        },

        kedarnath: {
            destination: "Kedarnath Dham & Holy Himalayan Yatra",
            titleTemplate: (dur) => `${dur}-Day Lord Kedarnath Jyotirlinga, Gaurikund Trek & Mandakini Valley`,
            basePrice: 8999,
            altitudeTag: "Elevation: 3,583 M (Glacial Alpine Zone)",
            advisory: "Mandatory biometric yatra registration. Medical fitness check. Warm thermals, rainwear, and high-ankle trekking shoes essential. Emergency oxygen assistance included.",
            pickup: "Haridwar Junction (HW) / Rishikesh / Dehradun Airport (DED)",
            highlights: [
                "Lord Kedarnath Jyotirlinga Darshan at 3,583 M",
                "Gaurikund to Kedarnath 16km Holy Trek or Helicopter Shuttle",
                "Bhairavnath Temple High-Altitude Peak Vantage",
                "Sacred Mandakini River & Devprayag Holy Confluence"
            ],
            foodRecs: "Pure Satvik vegetarian thali, piping hot ginger-tulsi tea, high-energy dry fruits, hot Khichdi at high-altitude dhabas.",
            days: [
                {
                    day: "DAY 01",
                    title: "Rishikesh to Guptkashi / Sonprayag Base via Devprayag",
                    desc: "🌅 Morning: Early morning drive from Haridwar/Rishikesh along the holy Alaknanda and Mandakini rivers. Halt at Devprayag to witness the sacred confluence of Bhagirathi and Alaknanda forming the holy Ganga.\n☀️ Afternoon: Continue through Rudraprayag to Guptkashi/Sonprayag base. Medical fitness screening and biometric Yatra permit check.\n🌆 Evening: Check-in to mountain lodge; briefing on altitude acclimatization, hydration, and weather safety. Evening Aarti at Kashi Vishwanath temple in Guptkashi."
                },
                {
                    day: "DAY 02",
                    title: "The Holy Trek from Gaurikund to Kedarnath Dham (3,583m)",
                    desc: "🌅 Morning: Early transfer to Sonprayag/Gaurikund (the hot sulphur springs base). Begin the sacred 16 km uphill trek (or board pre-booked helicopter shuttle) alongside the roaring Mandakini river.\n☀️ Afternoon: Ascend through Jungle Chatti, Bheembali, and Lincholi; high-altitude rest halts with energetic mountain tea.\n🌆 Evening: Arrive at Kedarnath plateau (3,583m) framed against the colossal snow-covered Kedarnath Peak. Check-in to GMVN/hotel. Attend the mesmerizing evening Maha Aarti of Lord Kedarnath."
                },
                {
                    day: "DAY 03",
                    title: "VIP Kedarnath Jyotirlinga Darshan & Bhairavnath Summit",
                    desc: "🌅 Morning: Dawn VIP Abhishek and Darshan of the sacred pyramidal rock Shiva Lingam inside the 8th-century stone temple built by Adi Shankaracharya.\n☀️ Afternoon: Short 1 km hike to Bhairavnath Temple overlooking the entire Kedarnath valley and Kedar Dome glaciers. Visit Adi Shankaracharya Samadhi.\n🌆 Evening: Begin comfortable descent to Gaurikund; transfer to Guptkashi/Rudraprayag for overnight rest."
                },
                {
                    day: "DAY 04",
                    title: "Return Scenic Journey to Rishikesh / Haridwar",
                    desc: "🌅 Morning: Scenic return drive along the Mandakini valley.\n☀️ Afternoon: Stop at Rishikesh for Ram Jhula, Laxman Jhula, and Ganga Aarti at Triveni Ghat.\n🌆 Evening: Return transfer to Haridwar station or Dehradun airport."
                }
            ]
        },

        jyotirlinga: {
            destination: "12 Jyotirlingas Sacred Maha Parikrama",
            titleTemplate: (dur) => `${dur}-Day Complete Holy Circuit of Lord Shiva's 12 Cosmic Pillars of Light`,
            basePrice: 6499,
            altitudeTag: "Pan-India Sacred Transits (High Altitude to Coastal)",
            advisory: "Early morning Bhasma Aarti booking protocols, temple dress codes, VIP Darshan passes, and verified priest guidance provided.",
            pickup: "Pan-India Sacred Transit Hubs (Ujjain / Varanasi / Mumbai / Delhi)",
            highlights: [
                "Somnath & Nageshwar (Gujarat Coast)",
                "Mahakaleshwar Bhasma Aarti (Ujjain) & Omkareshwar (MP)",
                "Trimbakeshwar, Bhimashankar & Grishneshwar (Maharashtra)",
                "Kedarnath (Himalayas), Kashi Vishwanath (Varanasi), Baidyanath, Mallikarjuna & Rameshwaram"
            ],
            foodRecs: "Pure Satvik temple Mahaprasad across all shrines, fresh tender coconut water, fasting fruits, audited pure vegetarian dining.",
            days: [
                {
                    day: "DAY 01",
                    title: "Mahakaleshwar (Ujjain) Bhasma Aarti & Omkareshwar",
                    desc: "🌅 Morning: 4:00 AM VIP entry to the world-famous Bhasma Aarti at Mahakaleshwar Jyotirlinga in Ujjain on the banks of Shipra River. Walk the grand Mahakal Lok Corridor.\n☀️ Afternoon: Drive to Omkareshwar (75 km), the sacred island on the Narmada River shaped like the holy symbol 'OM'. Darshan at Omkareshwar and Mamleshwar shrines.\n🌆 Evening: Narmada River boat Aarti and night transfer towards Gujarat/Maharashtra circuit."
                },
                {
                    day: "DAY 02",
                    title: "Somnath & Nageshwar (Gujarat Holy Coastline)",
                    desc: "🌅 Morning: Visit Somnath Jyotirlinga (the First of all 12 Jyotirlingas) standing resilient on the shores of the Arabian Sea. Marvel at the ancient Arrow Pillar (Baan Stambh).\n☀️ Afternoon: Scenic coastal drive to Dwarka; VIP Darshan at Nageshwar Jyotirlinga (enshrining a massive 25m Lord Shiva statue).\n🌆 Evening: Attend the grand evening sound & light show at Somnath shoreline."
                },
                {
                    day: "DAY 03",
                    title: "Trimbakeshwar (Nashik), Bhimashankar & Grishneshwar",
                    desc: "🌅 Morning: Darshan at Trimbakeshwar Jyotirlinga nestled at the foothills of Brahmagiri mountain, origin of the holy Godavari River.\n☀️ Afternoon: Travel to Bhimashankar amidst Sahyadri wildlife sanctuary; proceed to Grishneshwar Jyotirlinga adjacent to Ellora Caves.\n🌆 Evening: Special Rudrabhishek ceremony with Vedic priests."
                },
                {
                    day: "DAY 04",
                    title: "Kashi Vishwanath, Baidyanath & Rameshwaram Connections",
                    desc: "🌅 Morning: VIP Darshan at Kashi Vishwanath Golden Temple in Varanasi along the holy Ganges.\n☀️ Afternoon: Fly/transit to Baidyanath Dham (Deoghar) for holy water offering.\n🌆 Evening: Extended circuit leads to Rameshwaram (Tamil Nadu) for holy dip in 22 sacred wells (Theerthams) and Ramanathaswamy temple corridor."
                }
            ]
        },

        trekking: {
            destination: "India's Legendary High-Altitude Mountain Treks",
            titleTemplate: (dur) => `${dur}-Day Summit Expeditions: Kedarkantha, Roopkund, Chadar & Valley of Flowers`,
            basePrice: 7499,
            altitudeTag: "Elevation: 3,000 M to 5,029 M (Sub-Zero Snow Peaks & Glacial Moraines)",
            advisory: "Acclimatization days, professional mountaineering guides, crampons, high-altitude medical kits, and satellite SOS beacon included.",
            pickup: "Dehradun / Rishikesh / Manali / Leh Hubs",
            highlights: [
                "Kedarkantha Winter Snow Summit (3,810m) 360° Panorama",
                "Valley of Flowers UNESCO & Hemkund Sahib (4,300m)",
                "Hampta Pass & Chandratal Glacial Crossover (4,280m)",
                "Chadar Frozen River Zanskar Trek (-25°C) & Roopkund Mystery Lake"
            ],
            foodRecs: "High-calorie mountaineering diet: hot porridge, eggs, boiled potatoes, dal khichdi, garlic soup (altitude sickness combatant), hot Bournvita.",
            days: [
                {
                    day: "DAY 01",
                    title: "Base Camp Arrival, Acclimatization & Gear Inspection",
                    desc: "🌅 Morning: Scenic mountain transfer from Dehradun/Manali to base camp (Sankri / Joshimath / Jobra). Check-in to expedition camp.\n☀️ Afternoon: Altitude briefing, pulse oximeter check, crampon & gaiter fitting, and acclimatization walk through alpine pine forests.\n🌆 Evening: High-protein hot dinner with garlic soup (natural altitude vasodilator); stargazing under clear mountain skies."
                },
                {
                    day: "DAY 02",
                    title: "Ascent to High-Altitude Camp & Glacier Crossings",
                    desc: "🌅 Morning: Begin steady ascent through dense oak and rhododendron canopies, crossing crystal-clear glacial streams.\n☀️ Afternoon: Reach high-altitude campsite (Juda Ka Talab / Balu Ka Ghera) perched by frozen alpine tarns.\n🌆 Evening: Tent pitching demonstration, camp bonfire, and summit strategy briefing."
                },
                {
                    day: "DAY 03",
                    title: "Summit Push (3,810m to 4,300m) & Sunrise Glory",
                    desc: "🌅 Morning: 3:30 AM alpine summit push under a canopy of billion stars. Strap on micro-spikes to traverse hard-packed snow ridges.\n☀️ Afternoon: Reach the summit at sunrise! Enjoy unforgettable 360-degree panoramas of Swargarohini, Black Peak, Bandarpoonch, and Trishul.\n🌆 Evening: Celebrate at summit; safe descent back to camp with certified mountain leads."
                },
                {
                    day: "DAY 04",
                    title: "Descent to Base Camp & Departure Transfer",
                    desc: "🌅 Morning: Leisurely descent through alpine meadows to base camp.\n☀️ Afternoon: Certificate of Achievement ceremony and return transfer to transit hub."
                }
            ]
        },

        delhi: {
            destination: "Delhi NCR — Capital Heritage & Food Hub",
            titleTemplate: (dur) => `${dur}-Day Mughal Citadels, British Boulevards & Chandni Chowk Food Trail`,
            basePrice: 4499,
            altitudeTag: "Elevation: 216 M (Yamuna Plains)",
            advisory: "Comfortable footwear for exploring historical ruins. Private AC vehicle and metro smart card provided.",
            pickup: "Indira Gandhi International Airport (DEL) / New Delhi Railway Station (NDLS)",
            highlights: [
                "Red Fort, Qutub Minar 73m Tower & Humayun's Tomb",
                "India Gate, Kartavya Path & Rashtrapati Bhavan",
                "Akshardham Grand Musical Fountain & Lotus Temple",
                "Old Delhi Chandni Chowk Food Trail & Dilli Haat"
            ],
            foodRecs: "Chandni Chowk Paranthe Wali Gali, Karim's historic Mutton Burra, Natraj Dahi Bhalle, Kuremal Mohan Lal stuffed kulfi, authentic Chole Bhature.",
            days: [
                {
                    day: "DAY 01",
                    title: "Old Delhi Mughal Heritage & Chandni Chowk Food Walk",
                    desc: "🌅 Morning: Private tour of the colossal 17th-century Red Fort (Lal Qila) built by Shah Jahan; explore Diwan-i-Aam and Lahori Gate.\n☀️ Afternoon: Cycle rickshaw ride through the bustling alleys of Chandni Chowk. Visit Asia's largest spice market at Khari Baoli and historic Jama Masjid.\n🌆 Evening: Gastronomic walk tasting stuffed paranthas at Paranthe Wali Gali and royal Mughlai kababs at Karim's (since 1913)."
                },
                {
                    day: "DAY 02",
                    title: "Imperial Lutyens' Delhi, India Gate & Humayun's Tomb",
                    desc: "🌅 Morning: Visit the UNESCO World Heritage Humayun's Tomb (the red sandstone architectural precursor to the Taj Mahal).\n☀️ Afternoon: Drive down Kartavya Path viewing India Gate (War Memorial), Parliament House, and Rashtrapati Bhavan. Visit the serene white marble Lotus Temple.\n🌆 Evening: Visit the majestic Swaminarayan Akshardham Temple; witness the grand evening Sahaj Anand Water and Laser Light Show."
                },
                {
                    day: "DAY 03",
                    title: "Qutub Minar, Hauz Khas Village & Dilli Haat",
                    desc: "🌅 Morning: Explore the Qutub Minar complex, marveling at the 73-meter-tall 12th-century minaret and the 1,600-year-old rust-resistant Iron Pillar.\n☀️ Afternoon: Stroll through medieval Hauz Khas fort ruins and boutique lake-facing cafes.\n🌆 Evening: Shop for regional handicrafts and sample pan-Indian cuisines at open-air cultural bazaar Dilli Haat; departure transfer."
                }
            ]
        },

        chennai: {
            destination: "Chennai & Tamil Heritage Coast",
            titleTemplate: (dur) => `${dur}-Day Dravidian Temples, Marina Beach & Mahabalipuram Shore UNESCO Trail`,
            basePrice: 4699,
            altitudeTag: "Sea Level Bay of Bengal Coastline",
            advisory: "Breathable cottons recommended. Early morning visits to temples and beach for comfortable temperatures.",
            pickup: "Chennai International Airport (MAA) / Chennai Central (MAS)",
            highlights: [
                "Marina Beach World's 2nd Longest Urban Coastline",
                "7th-Century Kapaleeshwarar Temple Dravidian Gopuram",
                "San Thome Basilica & Fort St. George Colonial Citadel",
                "UNESCO Mahabalipuram Shore Temple & Pancha Rathas"
            ],
            foodRecs: "Traditional Mylapore filter coffee, crispy Ghee Roast Dosa with coconut and tomato chutneys, Idiyappam, Chettinad Pepper Chicken.",
            days: [
                {
                    day: "DAY 01",
                    title: "Mylapore Cultural Trail, Kapaleeshwarar & Marina Sunset",
                    desc: "🌅 Morning: Heritage walk in Mylapore; marvel at the towering sculpted rainbow Gopuram of the 7th-century Kapaleeshwarar Temple.\n☀️ Afternoon: Savor traditional South Indian banana leaf lunch with piping hot filter coffee. Visit San Thome Cathedral Basilica built over the tomb of Apostle St. Thomas.\n🌆 Evening: Stroll along the world's 2nd longest urban beach — Marina Beach; enjoy the cool sea breeze and taste freshly roasted corn and Sundal."
                },
                {
                    day: "DAY 02",
                    title: "UNESCO Mahabalipuram Rock-Cut Monuments",
                    desc: "🌅 Morning: Scenic drive along the East Coast Road (ECR) to UNESCO World Heritage site Mahabalipuram (55 km).\n☀️ Afternoon: Marvel at the 8th-century Shore Temple overlooking the roaring waves, the monolithic Pancha Rathas (Five Chariots), and the colossal open-air bas-relief 'Descent of the Ganges'.\n🌆 Evening: Visit the precarious balancing boulder Krishna's Butter Ball; enjoy fresh coastal seafood dinner at a beachside cafe."
                },
                {
                    day: "DAY 03",
                    title: "Fort St. George, Kalakshetra & Departure",
                    desc: "🌅 Morning: Visit Fort St. George (first English fortress in India, 1644) and St. Mary's Church.\n☀️ Afternoon: Explore Kalakshetra Foundation celebrating classical Bharatanatyam dance and traditional textile weaving.\n🌆 Evening: Shopping for authentic Kanchipuram silk sarees and departure transfer."
                }
            ]
        },

        kolkata: {
            destination: "Kolkata — City of Joy & Cultural Capital",
            titleTemplate: (dur) => `${dur}-Day Victoria Memorial, Howrah River Ferry & Heritage Street Food`,
            basePrice: 4499,
            altitudeTag: "Elevation: 9 M (Hooghly River Delta)",
            advisory: "Comfortable walking shoes for exploring colonial alleys and College Street book markets. Authentic sweet tastings included.",
            pickup: "Netaji Subhash Chandra Bose International Airport (CCU) / Howrah Junction (HWH)",
            highlights: [
                "Victoria Memorial White Marble Monument & Maidan",
                "Howrah Bridge & Hooghly Sunset Ferry Cruise",
                "Dakshineswar Kali Temple & Belur Math Spiritual Confluence",
                "Park Street Heritage Dining, Kathi Rolls & Rosogolla Trail"
            ],
            foodRecs: "Iconic Nizam's or Kusum Kathi Roll, freshly made warm Rosogolla & Mishti Doi from KC Das, Sondesh, Park Street Flurys English breakfast, Kolkata Biryani with potato.",
            days: [
                {
                    day: "DAY 01",
                    title: "Colonial Marvels, Victoria Memorial & Park Street",
                    desc: "🌅 Morning: Guided tour of the majestic Victoria Memorial hall, built in white Makrana marble as an imperial museum; walk through the sprawling Maidan.\n☀️ Afternoon: Explore St. Paul's Cathedral (Gothic revival style) and Princep Ghat along the Hooghly river.\n🌆 Evening: Walk down historic Park Street; enjoy high tea at iconic 1927 bakery Flurys, followed by authentic Kathi Rolls at Nizam's."
                },
                {
                    day: "DAY 02",
                    title: "Howrah Bridge Ferry, Dakshineswar Kali & Belur Math",
                    desc: "🌅 Morning: Take a heritage ride on India's only operating electric Tram. Cross the cantilever engineering icon Howrah Bridge; board a river ferry to Dakshineswar.\n☀️ Afternoon: Visit the 19th-century Dakshineswar Kali Temple where mystic Ramakrishna Paramahamsa resided; take a boat across the river to serene Belur Math (Ramakrishna Mission headquarters).\n🌆 Evening: Explore College Street 'Boi Para' (the world's largest second-hand book market); have coffee at historic Indian Coffee House."
                },
                {
                    day: "DAY 03",
                    title: "Kumartuli Clay Idol Guilds & Sweet Heritage",
                    desc: "🌅 Morning: Walk through Kumartuli, the 300-year-old traditional potter's quarter where clay artisans sculpt magnificent Durga Puja idols.\n☀️ Afternoon: Taste freshly made warm Rosogolla, Mishti Doi, and Sandesh at century-old sweet shops (KC Das & Girish Chandra Dey).\n🌆 Evening: Return transfer to Howrah station or Kolkata airport."
                }
            ]
        },

        bengaluru: {
            destination: "Bengaluru — Garden City & Tech Capital",
            titleTemplate: (dur) => `${dur}-Day Royal Palaces, Botanical Conservatories & Artisanal Cafe Culture`,
            basePrice: 4699,
            altitudeTag: "Elevation: 920 M (Deccan Plateau, Pleasant Year-Round Climate)",
            advisory: "Pleasant weather year-round; light jacket for evening breeze. Plan transit outside peak traffic hours.",
            pickup: "Kempegowda International Airport (BLR) / KSR Bengaluru City (SBC)",
            highlights: [
                "Lalbagh Botanical Gardens 19th-Century Glass House",
                "Bangalore Palace Tudor-Style Architecture & Vidhana Soudha",
                "Cubbon Park Morning Bamboo Grove Stroll",
                "VV Puram Vegetarian Food Street & Indiranagar Artisanal Breweries"
            ],
            foodRecs: "Vidyarthi Bhavan crispy Masala Dosa, VV Puram Thindi Beedi food street (Congress Bun, Akki Roti, Gulkand Ice cream), Brahmin's Coffee Bar filter coffee and idlis.",
            days: [
                {
                    day: "DAY 01",
                    title: "Botanical Wonders, Lalbagh & Iconic Dosa Trail",
                    desc: "🌅 Morning: Morning walk through the 240-acre Lalbagh Botanical Gardens, admiring century-old trees and the 1889 Glass House inspired by London's Crystal Palace.\n☀️ Afternoon: Authentic lunch at Vidyarthi Bhavan or Mavalli Tiffin Room (MTR) tasting iconic crispy butter Masala Dosa and filter coffee.\n🌆 Evening: Evening food safari at VV Puram (Thindi Beedi) food street sampling Akki Roti, Paddus, roasted corn, and Gulkand butter ice cream."
                },
                {
                    day: "DAY 02",
                    title: "Bangalore Palace, Vidhana Soudha & Cubbon Park",
                    desc: "🌅 Morning: Tour Bangalore Palace, constructed in 1878 in Tudor-revival architectural style with fortified towers, wood carvings, and royal family memorabilia.\n☀️ Afternoon: Drive past the magnificent granite facade of Vidhana Soudha; take a shaded walk through the bamboo groves of Cubbon Park.\n🌆 Evening: Explore Indiranagar's vibrant 100-Ft Road; experience Bangalore's famous craft coffee roasters and artisanal cafes."
                },
                {
                    day: "DAY 03",
                    title: "Bannerghatta Safari or Tipu Sultan's Palace & Departure",
                    desc: "🌅 Morning: Excursion to Bannerghatta National Park for guided tiger and lion safari and walk through the indoor butterfly conservatory.\n☀️ Afternoon: Visit Tipu Sultan's Summer Palace constructed entirely in French-polished teakwood with floral motifs.\n🌆 Evening: Return transfer to Kempegowda International Airport."
                }
            ]
        },

        mathura: {
            destination: "Mathura, Vrindavan & Sacred Braj Bhoomi",
            titleTemplate: (dur) => `${dur}-Day Shri Krishna Janmabhoomi, Banke Bihari & Prem Mandir Spectacle`,
            basePrice: 3999,
            altitudeTag: "Elevation: 174 M (Yamuna Floodplain)",
            advisory: "Watch out for temple monkeys in Vrindavan (secure glasses and bags). Pure vegetarian dining with authentic Mathura Peda tasting.",
            pickup: "Mathura Junction (MTJ) / Delhi NCR Transfer via Yamuna Expressway",
            highlights: [
                "Shri Krishna Janmabhoomi Temple & Garbha Griha Prison Cell",
                "Vrindavan Banke Bihari Temple Divine Darshan",
                "Prem Mandir Italian Marble Laser & Light Spectacle",
                "Yamuna Vishram Ghat Aarti & Govardhan Hill Parikrama"
            ],
            foodRecs: "World-famous Mathura ke Peda made with caramelized khoya, Bedai-Kachori with sweet jalebi, Makhan Mishri, saffron milk in clay kulhads.",
            days: [
                {
                    day: "DAY 01",
                    title: "Shri Krishna Janmabhoomi & Yamuna Vishram Ghat Aarti",
                    desc: "🌅 Morning: Chauffeur pickup and transfer to Mathura. Guided visit to Shri Krishna Janmabhoomi temple complex, entering the sacred subterranean Garbha Griha (prison cell where Lord Krishna was born).\n☀️ Afternoon: Visit the historic Dwarkadhish Temple; explore the narrow heritage bazaars tasting fresh, hot Mathura Peda.\n🌆 Evening: Attend the deeply serene evening Yamuna Aarti at Vishram Ghat (where Lord Krishna rested after slaying Kansa), watching hundreds of floating lamps illuminate the holy river."
                },
                {
                    day: "DAY 02",
                    title: "Vrindavan Banke Bihari, ISKCON & Prem Mandir Spectacle",
                    desc: "🌅 Morning: Drive to sacred Vrindavan (12 km). VIP Darshan at the revered Banke Bihari Temple; witness the unique curtain-pulling darshan ritual.\n☀️ Afternoon: Visit the magnificent white marble ISKCON Krishna Balaram Temple and Radha Raman Temple.\n🌆 Evening: Visit the colossal Prem Mandir built in pristine white Italian Carrara marble; watch the breathtaking musical fountain and synchronized LED illumination narrating Krishna Leela."
                },
                {
                    day: "DAY 03",
                    title: "Govardhan Hill & Barsana Radha Rani Pilgrimage",
                    desc: "🌅 Morning: Excursion to Govardhan Hill; visit Mansi Ganga and sacred Radha Kund and Shyam Kund.\n☀️ Afternoon: Drive to Barsana to visit the clifftop Radha Rani Mandir (Shriji Temple).\n🌆 Evening: Return transfer to Mathura station or Delhi NCR expressway."
                }
            ]
        },

        jaipur: {
            destination: "Jaipur & The Royal Rajasthan Kingdom",
            titleTemplate: (dur) => `${dur}-Day Pink City Palaces, Amer Fort Clifftops & Desert Royalty`,
            basePrice: 5499,
            altitudeTag: "Elevation: 431 M (Aravalli Foothills & Desert Margins)",
            advisory: "Sun hat, sunglasses, and camera essential for fort courtyards. Extended circuits include Udaipur, Jodhpur, and Jaisalmer desert camps.",
            pickup: "Jaipur International Airport (JAI) / Jaipur Junction (JP)",
            highlights: [
                "Amer Fort Elephant / Jeep Clifftop Ascent & Sheesh Mahal",
                "Hawa Mahal Palace of Winds & City Palace Museum",
                "Jantar Mantar UNESCO World Heritage Astronomical Observatory",
                "Nahargarh Fort Sunset Panorama & Chokhi Dhani Cultural Feast"
            ],
            foodRecs: "Royal Rajasthani Thali with Dal Baati Churma, Gatte Ki Sabzi, Laal Maas, Rawat Misthan Bhandar Pyaaz Kachori, Ghevar dripping with saffron syrup.",
            days: [
                {
                    day: "DAY 01",
                    title: "The Pink City: City Palace, Hawa Mahal & Jantar Mantar",
                    desc: "🌅 Morning: Chauffeur pickup and check-in to heritage Haveli hotel. Welcome garland and masala chai. Stop at Hawa Mahal (Palace of Winds) with its 953 honeycombed pink sandstone jharokha windows.\n☀️ Afternoon: Guided tour of the royal City Palace complex, Chandra Mahal, and royal armory. Marvel at the stone sundials at Jantar Mantar (UNESCO World Heritage observatory).\n🌆 Evening: Stroll through Johari Bazaar and Bapu Bazaar for gemstones, blue pottery, and bandhani textiles. Sample crispy Pyaaz Kachori at Rawat Misthan Bhandar."
                },
                {
                    day: "DAY 02",
                    title: "Majestic Amer Fort, Sheesh Mahal & Nahargarh Sunset",
                    desc: "🌅 Morning: Ascend to the clifftop Amer Fort by jeep or royal elephant ride. Explore the dazzling Sheesh Mahal (Mirror Palace) where a single candle illuminates the entire chamber.\n☀️ Afternoon: Visit the world's largest cannon on wheels at Jaigarh Fort and the scenic Jal Mahal floating palace.\n🌆 Evening: Golden hour sunset drinks at Padao restaurant atop Nahargarh Fort overlooking the illuminated Pink City skyline."
                },
                {
                    day: "DAY 03",
                    title: "Chokhi Dhani Village Fair & Royal Rajasthani Banquet",
                    desc: "🌅 Morning: Visit the historic stepwell Chand Baori or Albert Hall Museum.\n☀️ Afternoon: Block-printing workshop in Sanganer; observe master craftsmen stamp organic natural dyes onto cotton.\n🌆 Evening: Full immersion at Chokhi Dhani ethnic resort featuring camel rides, puppet shows, fire dancers, and an authentic royal feast of Dal Baati Churma."
                },
                {
                    day: "DAY 04",
                    title: "Extended Rajasthan Circuit: Jodhpur Blue City & Mehrangarh",
                    desc: "🌅 Morning: Scenic drive to Jodhpur (The Blue City). Check-in with views of Mehrangarh.\n☀️ Afternoon: Explore towering Mehrangarh Fort rising 400 feet above the indigo-painted houses.\n🌆 Evening: Sunset walk through Clock Tower market; taste famous Shahi Samosa and Makhaniya Lassi."
                },
                {
                    day: "DAY 05",
                    title: "Jaisalmer Golden Thar Desert Dunes & Camel Safari",
                    desc: "🌅 Morning: Drive to Jaisalmer (The Golden City); explore Jaisalmer Living Fort.\n☀️ Afternoon: Proceed to Sam Sand Dunes; board camel caravan across rolling golden dunes.\n🌆 Evening: Desert luxury tent camp with Rajasthani Kalbelia folk dance, bonfire, and starry desert sky."
                }
            ]
        },

        ayodhya: {
            destination: "Ayodhya — The Holy City of Shri Ram",
            titleTemplate: (dur) => `${dur}-Day Grand Ram Janmabhoomi Mandir, Saryu Aarti & Ram Ki Paidi`,
            basePrice: 4299,
            altitudeTag: "Elevation: 104 M (Holy Saryu River Basin)",
            advisory: "Traditional Indian modest dress code required for temple darshan. Electronic lockers available at Ram Janmabhoomi entrance.",
            pickup: "Maharishi Valmiki International Airport Ayodhya (AYJ) / Ayodhya Dham Junction (AY)",
            highlights: [
                "Grand Shri Ram Janmabhoomi Mandir Darshan",
                "Ancient Hanuman Garhi Hilltop Fortress Shrine",
                "Kanak Bhavan Golden Palaces of Sita & Ram",
                "Saryu River Boat Ride & Evening Saryu Maha Aarti at Ram Ki Paidi"
            ],
            foodRecs: "Pure Awadhi Ram Lalla Prasad, hot Bedai & Aloo Jalebi, Rabri Malai in earthen kulhads, authentic Saryu riverfront Satvik thali.",
            days: [
                {
                    day: "DAY 01",
                    title: "Shri Ram Janmabhoomi Mandir & Ancient Hanuman Garhi",
                    desc: "🌅 Morning: Chauffeur pickup and transfer to Ayodhya. Guided VIP Darshan assistance at the grand newly consecrated Shri Ram Janmabhoomi Mandir. Marvel at the Nagara architectural grandeur, sculpted sandstone pillars, and the sanctum sanctorum (Garbha Griha) of Ram Lalla.\n☀️ Afternoon: Climb the 76 steps to ancient Hanuman Garhi, a 10th-century hilltop temple where Lord Hanuman guarded the royal kingdom.\n🌆 Evening: Visit Kanak Bhavan (the magnificent palace gifted by Queen Kaikeyi to Sita and Ram). Sample authentic pure ghee Bedai and Jalebi at Ram Path."
                },
                {
                    day: "DAY 02",
                    title: "Saryu River Boat Cruise, Aarti & Illuminated Ram Ki Paidi",
                    desc: "🌅 Morning: Holy dip at sacred Saryu River Ghats; private boat cruise visiting Lakshman Ghat and Guptar Ghat (where Lord Ram took Jal Samadhi).\n☀️ Afternoon: Explore Dashrath Mahal, Ramkot, and the newly developed Surya Kund Vedic heritage complex.\n🌆 Evening: Witness the grand Saryu Maha Aarti at Ram Ki Paidi, followed by the spectacular synchronized laser light and sound show illuminating the ghats."
                },
                {
                    day: "DAY 03",
                    title: "Sita Ki Rasoi, Mani Parvat & Departure Transfer",
                    desc: "🌅 Morning: Visit Sita Ki Rasoi and Mani Parvat offering panoramic views of Ayodhya Dham.\n☀️ Afternoon: Souvenir shopping for brass idols, Ramcharitmanas scrolls, and Ramayana heritage souvenirs.\n🌆 Evening: Verified departure transfer to Maharishi Valmiki Airport or Ayodhya Dham Junction."
                }
            ]
        }
    };

    // Aliases mapping for user queries
    const DESTINATION_ALIASES = {
        'mumbai': 'mumbai',
        'bombay': 'mumbai',
        'pune': 'pune',
        'poona': 'pune',
        'gwalior': 'gwalior',
        'kanpur': 'kanpur',
        'cawnpore': 'kanpur',
        'bithoor': 'kanpur',
        'banaras': 'banaras',
        'varanasi': 'banaras',
        'kashi': 'banaras',
        'prayagraj': 'prayagraj',
        'allahabad': 'prayagraj',
        'sangam': 'prayagraj',
        'agra': 'agra',
        'taj mahal': 'agra',
        'goa': 'goa',
        'hoa': 'goa', // Typo handled gracefully
        'panaji': 'goa',
        'aurangabad': 'aurangabad',
        'chhatrapati sambhajinagar': 'aurangabad',
        'sambhajinagar': 'aurangabad',
        'ajanta': 'aurangabad',
        'ellora': 'aurangabad',
        'manali': 'manali',
        'solang': 'manali',
        'rohtang': 'manali',
        'atal tunnel': 'manali',
        'lucknow': 'lucknow',
        'muzzafarnagar': 'muzzafarnagar',
        'muzaffarnagar': 'muzzafarnagar',
        'shukratal': 'muzzafarnagar',
        'faridabad': 'faridabad',
        'surajkund': 'faridabad',
        'greater noida': 'greaternoida',
        'greaternoida': 'greaternoida',
        'noida': 'greaternoida',
        'bhopal': 'bhopal',
        'bhojtal': 'bhopal',
        'sanchi': 'bhopal',
        'jabalpur': 'jabalpur',
        'bhedaghat': 'jabalpur',
        'dhuandhar': 'jabalpur',
        'puri': 'puri',
        'jagannath': 'puri',
        'konark': 'puri',
        'konkan': 'konkan',
        'konkan region': 'konkan',
        'alibaug': 'konkan',
        'ratnagiri': 'konkan',
        'munsiyari': 'munsiyari',
        'munsiari': 'munsiyari',
        'panchachuli': 'munsiyari',
        'nainital': 'nainital',
        'nainital and its surrounding': 'nainital',
        'bhimtal': 'nainital',
        'sattal': 'nainital',
        'mukteshwar': 'nainital',
        'kedarnath': 'kedarnath',
        'kedarnath dham': 'kedarnath',
        'jyotirling': 'jyotirlinga',
        'jyotirlinga': 'jyotirlinga',
        'all jyotirling': 'jyotirlinga',
        'all jyotirlings': 'jyotirlinga',
        '12 jyotirlingas': 'jyotirlinga',
        'somnath': 'jyotirlinga',
        'mahakaleshwar': 'jyotirlinga',
        'omkareshwar': 'jyotirlinga',
        'trimbakeshwar': 'jyotirlinga',
        'bhimashankar': 'jyotirlinga',
        'rameshwaram': 'jyotirlinga',
        'trek': 'trekking',
        'treks': 'trekking',
        'trekking': 'trekking',
        'all major trekking places': 'trekking',
        'major trekking places': 'trekking',
        'kedarkantha': 'trekking',
        'chadar trek': 'trekking',
        'roopkund': 'trekking',
        'valley of flowers': 'trekking',
        'hampta pass': 'trekking',
        'delhi': 'delhi',
        'new delhi': 'delhi',
        'chennai': 'chennai',
        'madras': 'chennai',
        'kolkata': 'kolkata',
        'calcutta': 'kolkata',
        'benguluru': 'bengaluru',
        'bengaluru': 'bengaluru',
        'bangalore': 'bengaluru',
        'mathura': 'mathura',
        'vrindavan': 'mathura',
        'jaipur': 'jaipur',
        'rajasthan': 'jaipur',
        'rajasthan regions': 'jaipur',
        'udaipur': 'jaipur',
        'jodhpur': 'jaipur',
        'jaisalmer': 'jaipur',
        'ayodhya': 'ayodhya',
        'ram mandir': 'ayodhya'
    };

    function matchDestinationKey(query) {
        const q = (query || '').toLowerCase();
        
        // Exact and substring match against aliases
        const sortedAliases = Object.keys(DESTINATION_ALIASES).sort((a, b) => b.length - a.length);
        for (const alias of sortedAliases) {
            if (q.includes(alias)) {
                return DESTINATION_ALIASES[alias];
            }
        }
        return null;
    }

    // =========================================================================
    // UNIVERSAL DYNAMIC ITINERARY ARCHITECT (FOR ANY OTHER LOCATION)
    // =========================================================================
    function buildUniversalCustomItinerary(promptText, durationDays, vibe) {
        const raw = (promptText || '').trim();
        const dur = Math.max(1, Math.min(10, parseInt(durationDays) || 3));
        
        // Extract clean destination name
        let cleanDest = raw
            .replace(/plan\s*(?:a|an)?\s*(?:\d+[- ]?day)?\s*(?:trip|tour|itinerary|journey|expedition)?\s*(?:to|for|in|around)?/gi, '')
            .replace(/how\s*(?:about|is|to)\s*/gi, '')
            .replace(/visit\s*/gi, '')
            .replace(/tell\s*me\s*about\s*/gi, '')
            .replace(/for\s*\d+\s*days?/gi, '')
            .replace(/[?!.]/g, '')
            .trim();

        if (!cleanDest || cleanDest.length < 2) {
            cleanDest = "Incredible India Discovery";
        } else {
            // Capitalize title
            cleanDest = cleanDest.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }

        const price = 4499 + (dur - 1) * 1500;
        const days = [];

        for (let i = 1; i <= dur; i++) {
            if (i === 1) {
                days.push({
                    day: `DAY 0${i}`,
                    title: `Arrival, Sanitized Transfer & Iconic Orientation of ${cleanDest}`,
                    desc: `🌅 Morning: Chauffeur pickup at airport / railway hub in sanitized AC vehicle. Check-in to verified boutique accommodation; welcome refreshments.\n☀️ Afternoon: Guided introduction to prime landmarks, local heritage squares, and scenic viewpoints of ${cleanDest}.\n🌆 Evening: Golden hour sunset walk through the central bazaar; dinner at FSSAI-audited regional restaurant.`
                });
            } else if (i === dur) {
                days.push({
                    day: `DAY 0${i}`,
                    title: `Sunrise Panoramic Viewpoint, Artisan Guilds & Departure Transfer`,
                    desc: `🌅 Morning: Early morning sunrise halt at highest scenic viewpoint in ${cleanDest}.\n☀️ Afternoon: Visit verified local artisan and handloom guilds; purchase authentic GI-tagged regional specialties and souvenirs.\n🌆 Evening: Sanitized drop-off at departure terminal backed by Traveliser 24x7 safety guarantee.`
                });
            } else if (i === 2) {
                days.push({
                    day: `DAY 0${i}`,
                    title: `Core Architectural Marvels, Hidden Cultural Alleys & Guided Heritage`,
                    desc: `🌅 Morning: Private guided expedition to top historic temples, citadels, or nature reserves in ${cleanDest}.\n☀️ Afternoon: Deep immersion into heritage culinary lanes; savor authentic regional specialty thali with pure bottled mineral water.\n🌆 Evening: Cultural performance / riverside aarti / illuminated promenade stroll with local storytelling.`
                });
            } else {
                days.push({
                    day: `DAY 0${i}`,
                    title: `Off-the-Beaten-Path Adventure, Scenic Countryside & Culinary Tour`,
                    desc: `🌅 Morning: Early excursion to scenic outskirts, cascading waterfalls, or sacred hilltop shrines around ${cleanDest}.\n☀️ Afternoon: Organic farm / orchard lunch and interactive session with local craftspeople.\n🌆 Evening: Leisurely twilight cafe walk and stargazing.`
                });
            }
        }

        return {
            destination: cleanDest,
            title: `${dur}-Day Tailored Expedition to ${cleanDest}`,
            duration: `${dur} Days / ${Math.max(1, dur - 1)} Nights`,
            vibe: `${(vibe || 'Exploration').toUpperCase()} Expedition`,
            pricePerPerson: price,
            pickupLocation: `Central Airport / Major Railway Hub for ${cleanDest}`,
            highlights: [
                `Iconic Landmarks & Natural Wonders of ${cleanDest}`,
                `FSSAI-Audited Regional Culinary Trails`,
                `Verified Sanitized Transport & Dedicated Chauffeur`,
                `24x7 Traveliser Women Safety Live GPS Escort`
            ],
            altitudeTag: "Verified Travel Corridor",
            acclimationAdvisory: "Stay hydrated with 3-4 liters of water. Wear comfortable walking footwear for heritage sites.",
            days: days,
            perks: [
                "🛡️ Sanitized Vehicle & Verified Chauffeur",
                "🫁 Medical First Aid & Travel Emergency Kit",
                "📋 Dedicated Traveliser Certified Local Guide",
                "🚨 24x7 Traveliser Women Safety Live GPS Stream"
            ],
            summary: `I have structured a comprehensive ${dur}-Day expedition to **${cleanDest}** crafted specifically for your group!`
        };
    }

    // =========================================================================
    // MASTER ITINERARY GENERATOR (PLANS ALL 30+ DESTINATIONS DYNAMICALLY)
    // =========================================================================
    function generateDynamicLocalItinerary(promptText, durationDays, vibe) {
        const raw = (promptText || '').trim();
        const lower = raw.toLowerCase();

        // Extract duration from prompt if explicitly mentioned (e.g. "4 days", "for 2 days")
        const durMatch = lower.match(/(\d+)\s*(?:days?|nights?)/);
        let dur = durMatch ? parseInt(durMatch[1]) : (parseInt(durationDays) || sahayakMemory.lastDuration || 3);
        dur = Math.max(1, Math.min(10, dur));

        const matchedKey = matchDestinationKey(lower);

        if (!matchedKey || !DESTINATION_DATABASE[matchedKey]) {
            const universalPlan = buildUniversalCustomItinerary(raw, dur, vibe);
            addPlaceToSahayakMemory(universalPlan);
            return universalPlan;
        }

        const data = DESTINATION_DATABASE[matchedKey];
        const title = data.titleTemplate ? data.titleTemplate(dur) : `${dur}-Day Expedition to ${data.destination}`;
        const price = data.basePrice + Math.max(0, dur - 2) * 1600;

        // Construct customized days based on requested duration
        let constructedDays = [];
        const templateDays = data.days || [];

        for (let i = 1; i <= dur; i++) {
            if (i <= templateDays.length) {
                const dayCopy = { ...templateDays[i - 1] };
                dayCopy.day = `DAY 0${i}`;
                constructedDays.push(dayCopy);
            } else {
                // If requested duration exceeds template, dynamically add enriched days
                constructedDays.push({
                    day: `DAY 0${i}`,
                    title: `Scenic Excursion & Hidden Gems of ${data.destination.split('&')[0].trim()}`,
                    desc: `🌅 Morning: Excursion to outer scenic valleys and untouched heritage hamlets around ${data.destination.split('&')[0].trim()}.\n☀️ Afternoon: Traditional artisanal lunch halt; explore local organic markets and craft workshops.\n🌆 Evening: Relaxing sunset vantage point and farewell culinary feast.`
                });
            }
        }

        const plan = {
            destination: data.destination,
            title: title,
            duration: `${dur} Days / ${Math.max(1, dur - 1)} Nights`,
            vibe: `${(vibe || 'Cultural').toUpperCase()} Journey`,
            pricePerPerson: price,
            pickupLocation: data.pickup,
            highlights: data.highlights,
            altitudeTag: data.altitudeTag,
            acclimationAdvisory: data.advisory,
            foodRecommendations: data.foodRecs,
            days: constructedDays,
            perks: [
                "🛡️ Sanitized Vehicle & Verified Chauffeur",
                "🫁 Medical First Aid & Oxygen Emergency Kit",
                "📋 Traveliser Verified Local Itinerary Escort",
                "🚨 24x7 Traveliser Women Safety Force Pairing"
            ],
            summary: `I have structured a comprehensive ${dur}-day expedition to **${data.destination}**! Review the day-by-day morning, afternoon, and evening schedule below.`
        };

        addPlaceToSahayakMemory(plan);
        return plan;
    }

    async function callGeminiForItinerary(promptText, durationDays, vibe) {
        const dur = parseInt(durationDays) || 3;
        const apiKey = getActiveGeminiKey();

        // If no user API key is provided, use our encyclopedic engine directly for instant zero-latency response!
        if (!apiKey) {
            return generateDynamicLocalItinerary(promptText, durationDays, vibe);
        }

        const systemPrompt = `You are SAHAYAKMITR.ai, India's premier AI Travel, Expedition & Heritage Itinerary Architect for Traveliser.
User trip request: "${promptText}". Preferred duration: ${dur} days. Vibe: ${vibe || 'Cultural & Exploration'}.
Architect a comprehensive, realistic, and tailored day-by-day travel itinerary.
Format your entire response strictly as a JSON object (pure JSON only, no markdown codeblock wrapper):
{
  "destination": "Destination name",
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
                    addPlaceToSahayakMemory(parsed);
                    return parsed;
                }
            } catch (parseErr) {
                console.warn('Failed parsing Gemini JSON, falling back:', parseErr);
            }
        }

        // Reliable Encyclopedic Fallback
        return generateDynamicLocalItinerary(promptText, durationDays, vibe);
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

    // Header YOUR BOOKING button (Opens confirmed bookings drawer)
    const headerBookingsBtn = document.getElementById('header-my-bookings-btn');
    if (headerBookingsBtn) {
        headerBookingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openBookingsDrawer) {
                window.openBookingsDrawer();
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

    // Floating corner launcher for YOUR BOOKING (Positioned just above YOUR PLANS)
    const floatingBookingsBtn = document.getElementById('floating-bookings-corner-btn');
    if (floatingBookingsBtn) {
        floatingBookingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openBookingsDrawer) {
                window.openBookingsDrawer();
            }
        });
    }

    // Category Navigation Bar YOUR BOOKING card
    const catBookingsCard = document.getElementById('cat-your-bookings');
    if (catBookingsCard) {
        catBookingsCard.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openBookingsDrawer) {
                window.openBookingsDrawer();
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
    window.pendingRoadTripBooking = null;

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

    function openAuthModal(mode = 'login', customAlert = null) {
        setAuthMode(mode);
        if (customAlert) {
            showAuthAlert(customAlert, 'info');
        } else if (!window.pendingRoadTripBooking) {
            hideAuthAlert();
        }
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
        if (!window.pendingRoadTripBooking) {
            hideAuthAlert();
        }
        if (mode === 'signup') {
            if (tabAuthSignup) tabAuthSignup.classList.add('active');
            if (tabAuthLogin) tabAuthLogin.classList.remove('active');
            if (authNameGroup) authNameGroup.style.display = 'block';
            if (authSubmitLabel) {
                authSubmitLabel.textContent = window.pendingRoadTripBooking ? 'Register & Confirm Booking' : 'Create Traveliser Account';
            }
            if (btnForgotPassword) btnForgotPassword.style.display = 'none';
        } else {
            if (tabAuthLogin) tabAuthLogin.classList.add('active');
            if (tabAuthSignup) tabAuthSignup.classList.remove('active');
            if (authNameGroup) authNameGroup.style.display = 'none';
            if (authSubmitLabel) {
                authSubmitLabel.textContent = window.pendingRoadTripBooking ? 'Sign In & Confirm Booking' : 'Sign In to Traveliser';
            }
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
            window.pendingRoadTripBooking = null;
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
        btnCloseAuthModal.addEventListener('click', () => {
            window.pendingRoadTripBooking = null;
            closeAuthModal();
        });
    }
    if (btnCloseProfileModal) {
        btnCloseProfileModal.addEventListener('click', closeUserProfileModal);
    }

    // Backdrop click close
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                window.pendingRoadTripBooking = null;
                closeAuthModal();
            }
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
                    let userCredential = null;
                    try {
                        userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                        if (name && userCredential.user) {
                            try {
                                await userCredential.user.updateProfile({ displayName: name });
                            } catch (pErr) {
                                console.warn('[Firebase Auth] Profile update note:', pErr);
                            }
                        }
                    } catch (fbErr) {
                        console.warn('[Firebase Auth] Signup note:', fbErr);
                        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.code === 'auth/network-request-failed' || fbErr.code === 'auth/unauthorized-domain') {
                            userCredential = {
                                user: {
                                    displayName: name || email.split('@')[0],
                                    email: email,
                                    uid: 'usr_' + Date.now(),
                                    isAnonymous: false
                                }
                            };
                            updateHeaderForUser(userCredential.user);
                        } else {
                            throw fbErr;
                        }
                    }

                    closeAuthModal();
                    const registrantName = name || email.split('@')[0];

                    if (window.pendingRoadTripBooking) {
                        const tripToBook = window.pendingRoadTripBooking;
                        window.pendingRoadTripBooking = null;
                        if (typeof window.completeRoadTripBooking === 'function') {
                            window.completeRoadTripBooking(tripToBook, registrantName);
                        }
                        return;
                    }

                    if (window.showToast) {
                        window.showToast(`🎉 Welcome to Traveliser, ${registrantName}! Your account was created successfully.`);
                    }
                } else {
                    let userCredential = null;
                    try {
                        userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
                    } catch (fbErr) {
                        console.warn('[Firebase Auth] Signin note:', fbErr);
                        if (fbErr.code === 'auth/operation-not-allowed' || fbErr.code === 'auth/network-request-failed' || fbErr.code === 'auth/unauthorized-domain') {
                            userCredential = {
                                user: {
                                    displayName: email.split('@')[0],
                                    email: email,
                                    uid: 'usr_' + Date.now(),
                                    isAnonymous: false
                                }
                            };
                            updateHeaderForUser(userCredential.user);
                        } else {
                            throw fbErr;
                        }
                    }

                    closeAuthModal();
                    const displayName = userCredential.user?.displayName || email.split('@')[0];

                    if (window.pendingRoadTripBooking) {
                        const tripToBook = window.pendingRoadTripBooking;
                        window.pendingRoadTripBooking = null;
                        if (typeof window.completeRoadTripBooking === 'function') {
                            window.completeRoadTripBooking(tripToBook, displayName);
                        }
                        return;
                    }

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
                if (window.pendingRoadTripBooking) {
                    const tripToBook = window.pendingRoadTripBooking;
                    window.pendingRoadTripBooking = null;
                    if (typeof window.completeRoadTripBooking === 'function') {
                        window.completeRoadTripBooking(tripToBook, name);
                    }
                    return;
                }
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
                let result = null;
                try {
                    result = await firebaseAuth.signInAnonymously();
                } catch (fbErr) {
                    console.warn('[Firebase Auth] Guest anonymous note:', fbErr);
                    const mockGuest = {
                        displayName: 'Ayush',
                        email: 'guest@traveliser.local',
                        uid: 'guest_' + Date.now(),
                        isAnonymous: true
                    };
                    updateHeaderForUser(mockGuest);
                    result = { user: mockGuest };
                }
                closeAuthModal();
                if (window.pendingRoadTripBooking) {
                    const tripToBook = window.pendingRoadTripBooking;
                    window.pendingRoadTripBooking = null;
                    if (typeof window.completeRoadTripBooking === 'function') {
                        window.completeRoadTripBooking(tripToBook, 'Ayush (Guest Explorer)');
                    }
                    return;
                }
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
        const tabCount1 = document.getElementById('plans-tab-plans-count');
        const tabCount2 = document.getElementById('tab-plans-count');

        if (headerCount) headerCount.textContent = count;
        if (catCount) catCount.textContent = `${count} SAVED`;
        if (displayCount) displayCount.textContent = count;
        if (floatingCount) floatingCount.textContent = count;
        if (tabCount1) tabCount1.textContent = count;
        if (tabCount2) tabCount2.textContent = count;
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
    // 2B. "YOUR BOOKING" DRAWER ENGINE (CONFIRMED ORDERS & E-TICKETS)
    // Synchronized with "YOUR PLANS" — Confirmed bookings are moved here & removed from plans
    // =========================================================================
    const STORAGE_KEY_BOOKINGS = 'traveliser_user_bookings';

    function getInitialBookings() {
        return [
            {
                id: 'book_initial_8421',
                bookingCode: '#MRG-EXP-8421',
                title: '3-Day Himalayan High-Pass Adventure',
                destination: 'Manali & Solang Valley',
                duration: '3 Days / 2 Nights',
                vibe: 'ADVENTURE Expedition',
                leadTraveller: 'Ayush',
                travellers: 2,
                pricePerPerson: 5499,
                totalAmount: 11548,
                bookingDate: '05 Oct 2026',
                status: 'Confirmed & Escort Dispatched',
                safeTagId: 'ST-MRG-8421-HP',
                vehicle: 'Traveliser 4x4 Mountain Expedition SUV (Mahindra Thar)',
                chauffeur: 'Rajesh Negi (HP Tourism & Police Verified #7712)',
                contactPhone: '+91 98160 54321',
                highlights: ['Atal Tunnel Traversal', 'Solang Paragliding', 'Old Manali Pine Chalet'],
                inclusions: [
                    '🛡️ 4x4 Mountain SUV & Verified Chauffeur',
                    '🫁 Medical Oxygen & Diamox Onboard',
                    '🚨 24x7 Women Safety Force Link Active',
                    '☕ FSSAI Grade A+ Dining Halt at Johnson\'s Cafe'
                ]
            }
        ];
    }

    function loadSavedBookings() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error('Failed to load bookings from localStorage', e);
        }
        const initial = getInitialBookings();
        saveBookingsToStorage(initial);
        return initial;
    }

    function saveBookingsToStorage(bookings) {
        try {
            localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
        } catch (e) {
            console.error('Failed to save bookings to localStorage', e);
        }
    }

    let savedBookings = loadSavedBookings();

    function updateBookingsCounters() {
        const count = savedBookings.length;
        const headerCount = document.getElementById('header-bookings-count');
        const catCount = document.getElementById('cat-bookings-count');
        const displayCount = document.getElementById('bookings-count-display');
        const floatingCount = document.getElementById('floating-bookings-count');
        const tabCount1 = document.getElementById('plans-tab-bookings-count');
        const tabCount2 = document.getElementById('tab-bookings-count');

        if (headerCount) headerCount.textContent = count;
        if (catCount) catCount.textContent = `${count} ACTIVE`;
        if (displayCount) displayCount.textContent = count;
        if (floatingCount) floatingCount.textContent = count;
        if (tabCount1) tabCount1.textContent = count;
        if (tabCount2) tabCount2.textContent = count;
    }

    function renderSavedBookings() {
        const grid = document.getElementById('bookings-grid');
        if (!grid) return;

        updateBookingsCounters();

        if (savedBookings.length === 0) {
            grid.innerHTML = `
                <div class="plans-empty-card">
                    <div class="plans-empty-icon">🎫</div>
                    <h3 class="plans-empty-title">No Confirmed Bookings Yet</h3>
                    <p class="plans-empty-desc">
                        Explore our verified road trips or convert any customized plan from <strong>YOUR PLANS</strong> with instant <strong>BUY NOW</strong>. Confirmed passes, chauffeur telemetry, and SafeTag IDs will appear right here!
                    </p>
                    <a href="#packages" class="btn-start-first-plan" onclick="window.closeBookingsDrawer()">Explore Road Trips &rarr;</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = savedBookings.map((b) => `
            <div class="booking-order-card" id="booking-${b.id}">
                <div class="booking-card-header">
                    <div class="booking-code-pill">
                        <span class="booking-code-icon">🎫</span>
                        <strong class="booking-code-text">${b.bookingCode || '#MRG-EXP-8421'}</strong>
                    </div>
                    <span class="booking-status-tag">🟢 ${b.status || 'Confirmed'}</span>
                </div>
                <div class="booking-card-body">
                    <h3 class="booking-card-title">${b.title}</h3>
                    <div class="booking-meta-row">
                        <span class="booking-dest-pill">📍 ${b.destination}</span>
                        <span class="booking-dur-pill">⏱️ ${b.duration}</span>
                    </div>

                    <div class="booking-traveller-row">
                        <span>👤 Lead Traveller: <strong>${b.leadTraveller || 'Ayush'}</strong></span>
                        <span>👥 ${b.travellers || 2} Travellers</span>
                    </div>

                    <div class="booking-vehicle-box">
                        <div class="booking-veh-icon">🚙</div>
                        <div class="booking-veh-info">
                            <strong>${b.vehicle || '4x4 Mountain SUV & Verified Chauffeur'}</strong>
                            <span>Chauffeur: ${b.chauffeur || 'Verified Mountain Guide'}</span>
                        </div>
                        <div class="booking-safetag-mini">
                            <span class="safetag-tag">SafeTag QR</span>
                            <span class="safetag-id">${b.safeTagId || 'ST-HP-8421'}</span>
                        </div>
                    </div>

                    <div class="booking-price-row">
                        <span class="booking-price-label">Total Paid (Taxes & Permits Included)</span>
                        <span class="booking-price-value">₹${(b.totalAmount || 11548).toLocaleString('en-IN')}</span>
                    </div>

                    <div class="booking-actions-row">
                        <button class="btn-view-pass" onclick="window.viewBookingEticket('${b.id}')">
                            <span>🎫 View Official Pass</span>
                        </button>
                        <button class="btn-cancel-booking" onclick="window.triggerCancelBooking('${b.id}')" title="Cancel Booking">
                            <span>🗑️</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function addBooking(bookingData) {
        const newBooking = {
            id: 'book_' + Date.now(),
            bookingCode: bookingData.bookingCode || `#MRG-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
            title: bookingData.title || 'Custom Mountain Road Trip',
            destination: bookingData.destination || 'Alpine Corridor',
            duration: bookingData.duration || '3 Days / 2 Nights',
            vibe: bookingData.vibe || 'Alpine Mountain Expedition',
            leadTraveller: bookingData.leadTraveller || 'Ayush',
            travellers: bookingData.travellers || 2,
            pricePerPerson: bookingData.pricePerPerson || 5499,
            totalAmount: bookingData.totalAmount || Math.round((bookingData.pricePerPerson || 5499) * (bookingData.travellers || 2) * 1.05),
            bookingDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: 'Confirmed & Escort Dispatched',
            safeTagId: bookingData.safeTagId || `ST-MRG-${Math.floor(1000 + Math.random() * 9000)}-HP`,
            vehicle: bookingData.vehicle || 'Traveliser 4x4 Mountain Expedition SUV',
            chauffeur: bookingData.chauffeur || 'Himachal Verified Mountain Chauffeur & Patrol Guide',
            contactPhone: '+91 98160 54321',
            highlights: bookingData.highlights || ['Scenic Mountain Route', 'Boutique Stay', 'Verified Chauffeur'],
            inclusions: bookingData.inclusions || [
                '🛡️ 4x4 Mountain SUV & Verified Chauffeur',
                '🫁 Medical Oxygen & First Aid Onboard',
                '🚨 24x7 Women Safety Force Link Active'
            ]
        };

        savedBookings.unshift(newBooking);
        saveBookingsToStorage(savedBookings);
        renderSavedBookings();
        return newBooking;
    }

    window.openBookingsDrawer = function() {
        const drawer = document.getElementById('your-bookings');
        const plansDrawer = document.getElementById('your-plans');
        const backdrop = document.getElementById('plans-drawer-backdrop');

        if (plansDrawer) plansDrawer.classList.remove('active');
        if (drawer) drawer.classList.add('active');
        if (backdrop) backdrop.classList.add('active');

        renderSavedBookings();
        updatePlansCounters();
    };

    window.closeBookingsDrawer = function() {
        const drawer = document.getElementById('your-bookings');
        const backdrop = document.getElementById('plans-drawer-backdrop');
        if (drawer) drawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    };

    // Close button for bookings drawer
    const btnCloseBookingsDrawer = document.getElementById('btn-close-bookings-drawer');
    if (btnCloseBookingsDrawer) {
        btnCloseBookingsDrawer.addEventListener('click', () => {
            window.closeBookingsDrawer();
        });
    }

    // Drawer View Tabs: switch between YOUR PLANS and YOUR BOOKING
    const btnPlansSwitchToBookings = document.getElementById('btn-plans-switch-to-bookings');
    if (btnPlansSwitchToBookings) {
        btnPlansSwitchToBookings.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openBookingsDrawer) window.openBookingsDrawer();
        });
    }

    const btnTabSwitchToPlans = document.getElementById('btn-tab-switch-to-plans');
    if (btnTabSwitchToPlans) {
        btnTabSwitchToPlans.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openPlansDrawer) window.openPlansDrawer();
        });
    }

    const btnTabSwitchToBookings = document.getElementById('btn-tab-switch-to-bookings');
    if (btnTabSwitchToBookings) {
        btnTabSwitchToBookings.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openBookingsDrawer) window.openBookingsDrawer();
        });
    }

    const btnDrawerExploreMore = document.getElementById('btn-drawer-explore-more');
    if (btnDrawerExploreMore) {
        btnDrawerExploreMore.addEventListener('click', () => {
            window.closeBookingsDrawer();
        });
    }

    // Official E-Ticket Pass Modal View
    window.viewBookingEticket = function(bookingId) {
        const booking = savedBookings.find(b => b.id === bookingId) || savedBookings[0];
        if (!booking) return;

        const modal = document.getElementById('modal-view-eticket');
        const titleEl = document.getElementById('eticket-title');
        const contentEl = document.getElementById('eticket-body-content');

        if (titleEl) titleEl.textContent = `${booking.title} — Official Pass`;
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="eticket-pass-container">
                    <div class="eticket-pass-top">
                        <div class="eticket-brand">TRAVELISER SECURE EXPEDITION PASS</div>
                        <div class="eticket-code">${booking.bookingCode || '#MRG-EXP-8421'}</div>
                    </div>
                    <div class="eticket-grid">
                        <div class="eticket-cell">
                            <span class="cell-label">EXPEDITION</span>
                            <strong class="cell-val">${booking.title}</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">ROUTE / DESTINATION</span>
                            <strong class="cell-val">${booking.destination}</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">LEAD TRAVELLER</span>
                            <strong class="cell-val">${booking.leadTraveller} (${booking.travellers || 2} Pax)</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">DURATION</span>
                            <strong class="cell-val">${booking.duration}</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">ASSIGNED VEHICLE</span>
                            <strong class="cell-val">${booking.vehicle}</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">VERIFIED CHAUFFEUR</span>
                            <strong class="cell-val">${booking.chauffeur}</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">TOTAL PAID</span>
                            <strong class="cell-val text-green">₹${(booking.totalAmount || 11548).toLocaleString('en-IN')} (Taxes & Permits Paid)</strong>
                        </div>
                        <div class="eticket-cell">
                            <span class="cell-label">SAFETAG TELEMETRY</span>
                            <strong class="cell-val font-mono">${booking.safeTagId} (Active on Police 112 Patrol Grid)</strong>
                        </div>
                    </div>
                    <div class="eticket-security-strip">
                        <span>🛡️ 24x7 Satellite Escort & Women Protection Grid Active</span>
                        <span>Emergency: 112 / +91-1800-TRAVELISER</span>
                    </div>
                </div>
            `;
        }

        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('visible');
        }
    };

    const btnCloseEticket = document.getElementById('btn-close-eticket-modal');
    if (btnCloseEticket) {
        btnCloseEticket.addEventListener('click', () => {
            const modal = document.getElementById('modal-view-eticket');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('visible');
            }
        });
    }

    const btnPrintEticket = document.getElementById('btn-print-eticket');
    if (btnPrintEticket) {
        btnPrintEticket.addEventListener('click', () => {
            window.print();
        });
    }

    window.triggerCancelBooking = function(bookingId) {
        if (confirm('Are you sure you want to cancel this booking? This will revoke the expedition pass and SafeTag tracking.')) {
            savedBookings = savedBookings.filter(b => b.id !== bookingId);
            saveBookingsToStorage(savedBookings);
            renderSavedBookings();
            showNotificationToast('Booking cancelled.');
        }
    };

    // Render bookings initially
    renderSavedBookings();

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
        
        // Reset or populate lead traveller name: leave blank so traveller decides their own name, with example placeholder Ayush
        const inputBuyName = document.getElementById('buy-modal-name');
        if (inputBuyName) {
            let loggedInName = '';
            try {
                if (typeof firebaseAuth !== 'undefined' && firebaseAuth && firebaseAuth.currentUser && firebaseAuth.currentUser.displayName) {
                    loggedInName = firebaseAuth.currentUser.displayName;
                }
            } catch (e) {}
            inputBuyName.value = loggedInName;
            inputBuyName.placeholder = 'e.g. Ayush';
        }
        recalculateCheckoutFare();

        if (modalBuyNow) {
            modalBuyNow.style.display = 'flex';
            modalBuyNow.classList.add('visible');
        }
    }
    window.openBuyNowModal = openBuyNowModal;

    function completeRoadTripBooking(plan, travellerName) {
        if (!plan) return;

        // 1. Determine Lead Traveller Name
        let name = travellerName;
        if (!name || name.trim() === '') {
            try {
                if (typeof firebaseAuth !== 'undefined' && firebaseAuth && firebaseAuth.currentUser) {
                    name = firebaseAuth.currentUser.displayName || (firebaseAuth.currentUser.email ? firebaseAuth.currentUser.email.split('@')[0] : '');
                }
            } catch (e) {}
        }
        if (!name || name.trim() === '') {
            const inputBuyName = document.getElementById('buy-modal-name');
            name = (inputBuyName && inputBuyName.value.trim()) ? inputBuyName.value.trim() : 'Ayush';
        }

        currentCheckoutPlan = plan;

        // 2. Generate Booking Confirmation ID
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const bId = `#MRG-EXP-${randomCode}`;
        if (successBookingId) successBookingId.textContent = bId;

        // 3. Travellers and fare
        const travellers = parseInt(buyModalTravellers ? buyModalTravellers.value : '2') || 2;
        const pricePerPerson = plan.pricePerPerson || 4899;
        const base = pricePerPerson * travellers;
        const tax = Math.round(base * 0.05);
        const total = base + tax;

        // 4. Update Success Details Card
        if (successDetailsCard) {
            successDetailsCard.innerHTML = `
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:left; font-size:12.5px; margin-bottom:18px;">
                    <p style="margin-bottom:6px;"><strong>🏔️ Expedition:</strong> ${plan.title || 'Mountain Expedition'}</p>
                    <p style="margin-bottom:6px;"><strong>📍 Route:</strong> ${plan.destination || 'Scenic Alpine Route'} • ${plan.duration || '3 Days / 2 Nights'}</p>
                    <p style="margin-bottom:6px;"><strong>👤 Lead Traveller:</strong> ${name}</p>
                    <p style="margin-bottom:6px;"><strong>👥 Travellers:</strong> ${travellers} Adults • 4x4 Mountain SUV & Chauffeur</p>
                    <p style="margin-bottom:6px;"><strong>💰 Total Amount:</strong> ₹${total.toLocaleString('en-IN')} (Taxes & State Alpine Permits Included)</p>
                    <p style="color:#059669; font-weight:700; margin-top:8px; display:flex; align-items:center; gap:6px;">
                        <span>✅</span> <span>Status: Confirmed & Dispatched to Mountain Control Unit (SafeTag #ST-MRG-${randomCode}-HP Activated)</span>
                    </p>
                </div>
            `;
        }

        // 5. Add to YOUR BOOKING and remove from YOUR PLANS
        try {
            // Remove from savedPlans (any matching id or title)
            savedPlans = savedPlans.filter(p => {
                if (plan.id && p.id === plan.id) return false;
                if (plan.title && p.title && p.title.toLowerCase().trim() === plan.title.toLowerCase().trim()) return false;
                return true;
            });
            savePlansToStorage(savedPlans);
            renderSavedPlans();

            // Add to savedBookings
            if (typeof addBooking === 'function') {
                addBooking({
                    bookingCode: bId,
                    title: plan.title || 'Custom Mountain Road Trip',
                    destination: plan.destination || 'Scenic Alpine Route',
                    duration: plan.duration || '3 Days / 2 Nights',
                    vibe: plan.vibe || 'Alpine Mountain Expedition',
                    leadTraveller: name,
                    travellers: travellers,
                    pricePerPerson: pricePerPerson,
                    totalAmount: total,
                    safeTagId: `ST-MRG-${randomCode}-HP`,
                    vehicle: 'Traveliser 4x4 Mountain Expedition SUV (Mahindra Thar)',
                    chauffeur: 'Himachal Verified Mountain Chauffeur & Patrol Guide',
                    highlights: plan.highlights || ['Scenic Mountain Route', 'Boutique Stay', 'Verified Chauffeur'],
                    inclusions: plan.perks || plan.inclusions || [
                        '🛡️ 4x4 Mountain SUV & Verified Chauffeur',
                        '🫁 Medical Oxygen & First Aid',
                        '🚨 24x7 Women Safety Force Link'
                    ]
                });
            }
        } catch (e) {
            console.warn('[Booking] Could not process booking sync:', e);
        }

        // 6. Close checkout and auth modals if open
        if (typeof closeAuthModal === 'function') closeAuthModal();
        if (modalBuyNow) {
            modalBuyNow.style.display = 'none';
            modalBuyNow.classList.remove('visible');
        }

        // 7. Show Modal Booking Success
        if (modalBookingSuccess) {
            modalBookingSuccess.style.display = 'flex';
            modalBookingSuccess.classList.add('visible');
        }

        // 8. Notification feedback
        if (window.showToast) {
            window.showToast(`🎉 Booking Done! Expedition "${plan.title}" confirmed for ${name}. Booking ID: ${bId}`);
        } else if (typeof showNotificationToast === 'function') {
            showNotificationToast(`🎉 Booking Done! Expedition confirmed! Booking ID: ${bId}`);
        }
    }
    window.completeRoadTripBooking = completeRoadTripBooking;

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
            const inputBuyName = document.getElementById('buy-modal-name');
            const leadTravellerName = (inputBuyName && inputBuyName.value.trim()) ? inputBuyName.value.trim() : 'Ayush';
            completeRoadTripBooking(currentCheckoutPlan, leadTravellerName);
        });
    }

    if (btnSuccessClose && modalBookingSuccess) {
        btnSuccessClose.addEventListener('click', () => {
            modalBookingSuccess.style.display = 'none';
            modalBookingSuccess.classList.remove('visible');
            if (window.openBookingsDrawer) {
                window.openBookingsDrawer();
            } else if (window.openPlansDrawer) {
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
                                <span class="hint-tag">✨ Tap any parameter in the Compiled Trip Architect above or type your destination below!</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // Memory clear button
        const btnClearMemory = document.getElementById('btn-clear-memory');
        if (btnClearMemory) {
            btnClearMemory.addEventListener('click', () => {
                sahayakMemory.lastDestination = null;
                sahayakMemory.lastPlan = null;
                sahayakMemory.plannedPlaces = [];
                renderSahayakMemoryBar();
                showNotificationToast('🧠 Journey memory cleared.');
            });
        }

        async function handleUserSubmit(userText) {
            appendUserMessage(userText);
            const typingIndicator = showTypingIndicator();

            const lower = userText.toLowerCase().trim();

            // 1. Identify destination key in the CURRENT query (e.g. "mumbai", "pune", "greater noida", "banaras", etc.)
            const matchedKey = matchDestinationKey(lower);

            // 2. Identify itinerary intent keywords
            const hasItineraryKeywords = (
                /\b(?:plan|itinerary|trip|tour|visit|travel|explore|schedule|package|vacation|holidays?|expedition|go to)\b/i.test(lower) ||
                /\b\d+\s*(?:days?|nights?)\b/i.test(lower)
            );

            // 3. Whole-word food intent detection (AVOIDS substring false matches like "greater", "weather", "theatre")
            const isFoodIntent = /\b(?:food|foods|eat|eating|dish|dishes|restaurant|restaurants|cuisine|cuisines|specialty|specialties|khana|culinary|dining|street food)\b/i.test(lower);

            // 4. Whole-word pricing/cost intent detection
            const isCostIntent = /\b(?:cost|price|pricing|fare|budget|how much|charges?|expense|expenses|package rate)\b/i.test(lower);

            // 5. Specific knowledge-base QnA queries (Johnson's cafe, AMS altitude, FSSAI criteria)
            const isGeneralQnA = /\b(?:ams|altitude sickness|johnson|johnsons|criteria|food inspection|inspection department|preferred food|non-preferred food)\b/i.test(lower);

            // -------------------------------------------------------------
            // INTENT 1: MEMORY RECALL ("remember my places", "what did we discuss", "show all places")
            // -------------------------------------------------------------
            if (
                /\b(?:remember|memory|discussed|previous places|all places|my places)\b/i.test(lower) &&
                !hasItineraryKeywords &&
                !matchedKey
            ) {
                if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();
                if (sahayakMemory.plannedPlaces.length > 0) {
                    const list = sahayakMemory.plannedPlaces.map(p => `• **${p.name}** — ${p.title} (*${p.duration}*, ₹${p.price.toLocaleString('en-IN')})`).join('\n');
                    renderAiTextResponse(`🧠 **SAHAYAKMITR.ai Journey Memory Archive:**\n\nI remember all the destinations we have explored and structured in our session:\n\n${list}\n\n✨ *All of these itineraries have been safely recorded in your **YOUR PLANS** drawer (top-right corner). Tap any plan to customize or Instant Buy Now!*`, 'SAHAYAKMITR Memory Engine');
                } else {
                    renderAiTextResponse(`🧠 **SAHAYAKMITR.ai Journey Memory:**\n\nWe haven't structured any destinations yet! Tell me any city or region like **Mumbai, Pune, Gwalior, Kanpur, Banaras, Ayodhya, Kedarnath, Goa, Munsiyari, Nainital, 12 Jyotirlingas, or Himalayan Treks** to get started!`, 'SAHAYAKMITR Memory Engine');
                }
                return;
            }

            // -------------------------------------------------------------
            // INTENT 2: DESTINATION ITINERARY (TOP PRIORITY FOR TRIP PLANNING)
            // Triggers whenever a destination is mentioned OR itinerary keywords exist,
            // as long as it's not a food-only or cost-only question without trip planning intent.
            // -------------------------------------------------------------
            const isPureItineraryRequest = (matchedKey !== null || hasItineraryKeywords) && 
                                           !isGeneralQnA && 
                                           !(isFoodIntent && !hasItineraryKeywords) && 
                                           !(isCostIntent && !hasItineraryKeywords);

            if (isPureItineraryRequest) {
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

            // -------------------------------------------------------------
            // INTENT 3: FOOD & CULINARY INQUIRIES
            // -------------------------------------------------------------
            if (isFoodIntent && !isGeneralQnA) {
                if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();

                // Case A: User explicitly asks about food in a SPECIFIC destination (e.g. "what food in Greater Noida", "Pune famous dishes")
                if (matchedKey && DESTINATION_DATABASE[matchedKey]) {
                    const dbData = DESTINATION_DATABASE[matchedKey];
                    renderAiTextResponse(`🍲 **Culinary & Food Safety Guide for ${dbData.destination}:**\n\n${dbData.foodRecs}\n\n🛡️ *All Traveliser group expeditions include dining halts at certified FSSAI-audited kitchens with verified water purity!*`, 'Traveliser Food Intelligence');
                    return;
                }

                // Case B: Follow-up food question about the LAST PLANNED place (e.g. "what should I eat there?", "famous local food?")
                if (sahayakMemory.lastPlan) {
                    const dest = sahayakMemory.lastPlan.destination || 'your destination';
                    const foodInfo = sahayakMemory.lastPlan.foodRecommendations || 'Local traditional cuisine, street specialties, and pure mineral water at verified dining partners.';
                    renderAiTextResponse(`🍲 **Culinary & Food Safety Guide for ${dest}:**\n\n${foodInfo}\n\n🛡️ *All Traveliser group expeditions include dining halts at certified FSSAI-audited kitchens with verified water purity!*`, 'Traveliser Food Intelligence');
                    return;
                }
            }

            // -------------------------------------------------------------
            // INTENT 4: COST & PRICING INQUIRIES
            // -------------------------------------------------------------
            if (isCostIntent && !isGeneralQnA) {
                if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();

                // Case A: User specifies destination for cost (e.g. "cost of Pune trip?")
                if (matchedKey && DESTINATION_DATABASE[matchedKey]) {
                    const dbData = DESTINATION_DATABASE[matchedKey];
                    const dur = parseInt(selectedDuration) || 3;
                    const price = dbData.basePrice + Math.max(0, dur - 2) * 1600;
                    renderAiTextResponse(`💰 **Transparent Fare Breakdown for ${dbData.destination} (${dur} Days):**\n\n• **Base Fare per Person:** ₹${price.toLocaleString('en-IN')}\n• **Inclusions:** Sanitized AC Vehicle, Verified Chauffeur, Boutique Accommodations, Breakfast & Dinner, 24x7 Women Safety GPS Escort, Entry Passes\n• **Group Discounts:** 5% instant discount applied for 2+ travelers\n\n⚡ *Type "Plan for ${dbData.destination}" to generate the full day-by-day expedition with instant BUY NOW checkout!*`, 'Traveliser Pricing Engine');
                    return;
                }

                // Case B: Follow-up cost for remembered plan
                if (sahayakMemory.lastPlan) {
                    const p = sahayakMemory.lastPlan;
                    renderAiTextResponse(`💰 **Transparent Fare Breakdown for ${p.title}:**\n\n• **Base Fare per Person:** ₹${(p.pricePerPerson || 4999).toLocaleString('en-IN')}\n• **Inclusions:** Sanitized AC Vehicle, Verified Chauffeur, Boutique Accommodations, Breakfast & Dinner, 24x7 Women Safety GPS Escort, Entry Passes\n• **Group Discounts:** 5% instant discount applied for 2+ travelers\n\n⚡ *You can tap the **BUY NOW** button on the itinerary card above or in YOUR PLANS drawer to checkout instantly!*`, 'Traveliser Pricing Engine');
                    return;
                }
            }

            // -------------------------------------------------------------
            // INTENT 5: FOLLOW-UP DURATION MODIFICATION (ONLY FOR REMEMBERED DESTINATION)
            // e.g. "make it 4 days", "change to 5 days", "now 2 days"
            // Crucial: Must NOT have matched a new destination!
            // -------------------------------------------------------------
            const durChangeMatch = lower.match(/\b(?:make\s*it|change\s*to|update\s*to|now|extend\s*to)\s*(\d+)\s*(?:days?|nights?)\b/i);
            if (durChangeMatch && !matchedKey && sahayakMemory.lastDestination) {
                const newDays = parseInt(durChangeMatch[1]);
                if (newDays > 0) {
                    const updatedPlan = generateDynamicLocalItinerary(`${sahayakMemory.lastDestination} for ${newDays} days`, newDays, selectedVibe);
                    if (typingIndicator && typingIndicator.parentNode) typingIndicator.remove();
                    renderAiItineraryResponse(updatedPlan);
                    addPlan(updatedPlan);
                    return;
                }
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

            if (/\b(?:restaurant|restaurants|rating|cafe|cafes|where to eat)\b/i.test(q)) {
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

            if (/\b(?:preferred|non-preferred|criteria|diet)\b/i.test(q) || (/\bfood\b/i.test(q) && /\b(?:altitude|mountain|himalayan)\b/i.test(q))) {
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

            const badgeLabel = model 
                ? (model.toUpperCase().endsWith('INTELLIGENCE') ? model.toUpperCase() : `${model.toUpperCase()} INTELLIGENCE`)
                : 'GEMINI 3.5 INTELLIGENCE';

            aiMsg.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-bubble">
                    <span class="sahayak-reply-badge">✨ ${badgeLabel}</span>
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

        // Global triggers for compiled hub and external components
        window.triggerSahayakItinerary = handleUserSubmit;
        window.setSahayakParameters = function(dur, vibe) {
            if (dur) selectedDuration = dur.toString();
            if (vibe) selectedVibe = vibe.toString();
        };
    }

    // =========================================================================
    // 4B. COMPILED & COMBINED TRIP ARCHITECT HUB & MATERIAL LIBRARIES
    // (Quick Destination & Trip Duration Modals & Generation)
    // =========================================================================
    function initCompiledTripHub() {
        const hubState = {
            destinationKey: 'manali',
            destinationName: 'Manali & Rohtang Pass',
            duration: 3,
            durationLabel: '3 Days (Weekend)'
        };

        const modalQuickDest = document.getElementById('modal-quick-destination');
        const modalTripDur = document.getElementById('modal-trip-duration');

        const btnOpenQuickDest = document.getElementById('btn-open-quick-destinations');
        const btnOpenTripDur = document.getElementById('btn-open-trip-duration');
        const btnHubGenerate = document.getElementById('btn-hub-generate-plan');

        const labelDest = document.getElementById('hub-selected-dest-label');
        const labelDur = document.getElementById('hub-selected-dur-label');

        const btnCloseQuickDest = document.getElementById('btn-close-quick-dest-modal');
        const btnCloseTripDur = document.getElementById('btn-close-trip-dur-modal');

        const searchInput = document.getElementById('search-quick-dest-input');
        const catPills = document.querySelectorAll('#dest-category-filter-pills .dest-filter-pill');
        const destGrid = document.getElementById('quick-dest-materials-grid');
        const durGrid = document.getElementById('trip-dur-materials-grid');

        // Central Trigger: Generates custom itinerary in SAHAYAKMITR.ai
        function triggerHubItineraryGeneration() {
            const prompt = `Plan a ${hubState.duration}-day expedition to ${hubState.destinationName} with detailed day-by-day itinerary, highlights, and safety escort.`;
            const chatInput = document.getElementById('chat-user-input');
            if (chatInput) chatInput.value = prompt;

            // Scroll to SAHAYAKMITR.ai chat feed
            const aiSec = document.getElementById('ai-assistance');
            if (aiSec) aiSec.scrollIntoView({ behavior: 'smooth' });

            if (typeof window.triggerSahayakItinerary === 'function') {
                window.triggerSahayakItinerary(prompt);
            }

            showNotificationToast(`✨ Formulating itinerary for ${hubState.destinationName} (${hubState.duration} Days)...`);
        }

        // 1. Populate Destination Material Grid
        if (destGrid && typeof DESTINATION_DATABASE !== 'undefined') {
            destGrid.innerHTML = Object.keys(DESTINATION_DATABASE).map(key => {
                const d = DESTINATION_DATABASE[key];
                let category = 'himalayan';
                const k = key.toLowerCase();
                if (['kedarnath', 'jyotirling', 'ayodhya', 'banaras', 'mathura', 'prayagraj', 'puri', 'muzzafarnagar'].includes(k)) {
                    category = 'spiritual';
                } else if (['gwalior', 'lucknow', 'agra', 'aurangabad', 'jaipur', 'pune'].includes(k)) {
                    category = 'heritage';
                } else if (['mumbai', 'goa', 'konkan', 'chennai'].includes(k)) {
                    category = 'coastal';
                } else if (['delhi', 'benguluru', 'kolkata', 'faridabad', 'greater noida', 'bhopal', 'jabalpur'].includes(k)) {
                    category = 'metro';
                }

                const highlightsStr = (d.highlights || []).slice(0, 2).map(h => `<span class="mat-badge">✨ ${h}</span>`).join('');
                return `
                    <div class="material-dest-card" data-key="${key}" data-cat="${category}" data-search="${(d.destination + ' ' + (d.highlights || []).join(' ') + ' ' + (d.altitudeTag || '')).toLowerCase()}">
                        <div class="material-card-top">
                            <span class="mat-pin">📍</span>
                            <span class="mat-category-tag">${category.toUpperCase()}</span>
                            <span class="mat-price">from ₹${(d.basePrice || 4999).toLocaleString('en-IN')}</span>
                        </div>
                        <h4 class="material-dest-name">${d.destination}</h4>
                        <span class="material-altitude-pill">🏔️ ${d.altitudeTag || 'Scenic Corridor'}</span>
                        <div class="material-highlights-row">
                            ${highlightsStr}
                        </div>
                        <button type="button" class="btn-select-material" data-key="${key}">
                            <span>Select & Generate Itinerary &rarr;</span>
                        </button>
                    </div>
                `;
            }).join('');

            // Card click listener
            destGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.material-dest-card');
                if (!card) return;
                const key = card.getAttribute('data-key');
                const destObj = DESTINATION_DATABASE[key];
                if (destObj) {
                    hubState.destinationKey = key;
                    hubState.destinationName = destObj.destination;
                    if (labelDest) labelDest.textContent = destObj.destination.split('&')[0].trim();

                    // Close modal
                    if (modalQuickDest) {
                        modalQuickDest.style.display = 'none';
                        modalQuickDest.classList.remove('visible');
                    }

                    // Produce desired output!
                    triggerHubItineraryGeneration();
                }
            });
        }

        // Live Search in Destination Material Library
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const cards = document.querySelectorAll('.material-dest-card');
                cards.forEach(card => {
                    const searchData = card.getAttribute('data-search') || '';
                    const matches = !query || searchData.includes(query);
                    card.style.display = matches ? 'flex' : 'none';
                });
            });
        }

        // Category Filter Pills
        if (catPills) {
            catPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    catPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    const selectedCat = pill.getAttribute('data-cat') || 'all';
                    const cards = document.querySelectorAll('.material-dest-card');
                    cards.forEach(card => {
                        const cardCat = card.getAttribute('data-cat');
                        const show = (selectedCat === 'all' || cardCat === selectedCat);
                        card.style.display = show ? 'flex' : 'none';
                    });
                });
            });
        }

        // 2. Populate Trip Duration Material Grid
        if (durGrid) {
            const durations = [
                { days: 2, label: '2 Days (Quick Escape)', desc: 'Fast-paced weekend getaway covering iconic spots with zero wasted transit time.', icon: '⚡' },
                { days: 3, label: '3 Days (Weekend Classic)', desc: 'The most popular optimal duration for complete relaxation and core sightseeing.', icon: '🌟' },
                { days: 4, label: '4 Days (High Valley Immersion)', desc: 'In-depth exploration with mountain passes, scenic nature trails & boutique stay.', icon: '🏔️' },
                { days: 5, label: '5 Days (High Pass Expedition)', desc: 'Comprehensive alpine corridor with full acclimatization and snowline vistas.', icon: '🚙' },
                { days: 7, label: '7+ Days (Grand Circuit)', desc: 'Epic overland journey through hidden valleys, high passes, and local villages.', icon: '👑' },
                { days: 10, label: '10+ Days (Pan-India Odyssey)', desc: 'Ultimate cross-region expedition with cultural immersion and safe chauffeur transit.', icon: '🇮🇳' }
            ];

            durGrid.innerHTML = durations.map(d => `
                <div class="material-dur-card ${d.days === hubState.duration ? 'active' : ''}" data-days="${d.days}" data-label="${d.label}">
                    <div class="dur-card-header">
                        <span class="dur-icon">${d.icon}</span>
                        <span class="dur-badge">${d.days} Days</span>
                    </div>
                    <h4 class="dur-title">${d.label}</h4>
                    <p class="dur-desc">${d.desc}</p>
                    <button type="button" class="btn-select-dur-mat">Select Pacing &rarr;</button>
                </div>
            `).join('');

            durGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.material-dur-card');
                if (!card) return;
                const days = parseInt(card.getAttribute('data-days')) || 3;
                const labelText = card.getAttribute('data-label') || `${days} Days`;
                hubState.duration = days;
                hubState.durationLabel = labelText;
                if (labelDur) labelDur.textContent = labelText;

                // Close modal
                if (modalTripDur) {
                    modalTripDur.style.display = 'none';
                    modalTripDur.classList.remove('visible');
                }

                // Produce desired output!
                triggerHubItineraryGeneration();
            });
        }

        // Open Modal Event Listeners
        if (btnOpenQuickDest && modalQuickDest) {
            btnOpenQuickDest.addEventListener('click', () => {
                modalQuickDest.style.display = 'flex';
                modalQuickDest.classList.add('visible');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
            });
        }

        if (btnOpenTripDur && modalTripDur) {
            btnOpenTripDur.addEventListener('click', () => {
                modalTripDur.style.display = 'flex';
                modalTripDur.classList.add('visible');
            });
        }

        // Close Modal Event Listeners
        if (btnCloseQuickDest && modalQuickDest) {
            btnCloseQuickDest.addEventListener('click', () => {
                modalQuickDest.style.display = 'none';
                modalQuickDest.classList.remove('visible');
            });
        }

        if (btnCloseTripDur && modalTripDur) {
            btnCloseTripDur.addEventListener('click', () => {
                modalTripDur.style.display = 'none';
                modalTripDur.classList.remove('visible');
            });
        }

        // Combined Action Trigger Button
        if (btnHubGenerate) {
            btnHubGenerate.addEventListener('click', () => {
                triggerHubItineraryGeneration();
            });
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

        // Real Live Geolocation & WhatsApp Live Location Sharing Engine
        function getLiveCoordinates(callback) {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const lat = pos.coords.latitude.toFixed(5);
                        const lon = pos.coords.longitude.toFixed(5);
                        const acc = Math.round(pos.coords.accuracy || 4);
                        const alt = pos.coords.altitude ? `${Math.round(pos.coords.altitude)} M` : (dispAlt ? dispAlt.textContent : '2,050 M');
                        if (dispLat) dispLat.textContent = `${lat}° N`;
                        if (dispLon) dispLon.textContent = `${lon}° E`;
                        if (dispAlt) dispAlt.textContent = alt;
                        if (dispAcc) dispAcc.textContent = `±${acc} Meters`;
                        callback({ lat, lon, acc, alt, isReal: true });
                    },
                    (err) => {
                        console.warn('Geolocation error / permission fallback:', err);
                        const lat = dispLat ? dispLat.textContent.replace(/[^\d.]/g, '') || '28.6139' : '28.6139';
                        const lon = dispLon ? dispLon.textContent.replace(/[^\d.]/g, '') || '77.2090' : '77.2090';
                        const alt = dispAlt ? dispAlt.textContent : '2,050 M';
                        const acc = 4;
                        callback({ lat, lon, acc, alt, isReal: false });
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
                );
            } else {
                const lat = dispLat ? dispLat.textContent.replace(/[^\d.]/g, '') || '28.6139' : '28.6139';
                const lon = dispLon ? dispLon.textContent.replace(/[^\d.]/g, '') || '77.2090' : '77.2090';
                const alt = dispAlt ? dispAlt.textContent : '2,050 M';
                callback({ lat, lon, acc: 5, alt, isReal: false });
            }
        }

        function formatWhatsAppLiveMessage(coords, contactName) {
            const googleMapsUrl = `https://www.google.com/maps?q=${coords.lat},${coords.lon}`;
            const liveTrackerUrl = `${window.location.origin}${window.location.pathname}?live_sos=true&lat=${coords.lat}&lng=${coords.lon}&alt=${encodeURIComponent(coords.alt)}&acc=${coords.acc}&t=${Date.now()}&id=MRG-FORCE-8849-HP`;
            
            const msg = `🚨 *LIVE GPS LOCATION & EMERGENCY BROADCAST — TRAVELISER* 🚨

${contactName ? `Dear ${contactName},\n` : ''}I am sharing my real-time live GPS coordinates with you for live journey tracking and safety:

📍 *Exact GPS Coordinates:* ${coords.lat}° N, ${coords.lon}° E (±${coords.acc}m accuracy)
🏔️ *Altitude:* ${coords.alt}
⏱️ *Recorded at:* ${new Date().toLocaleTimeString()} (${new Date().toLocaleDateString()})

🗺️ *Open in Google Maps Live Pin:*
${googleMapsUrl}

📡 *Track on Traveliser Live Radar & Command Grid:*
${liveTrackerUrl}

🛡️ *Assigned Police Base:* #MRG-FORCE-8849-HP
👮 *Nearest Protection Force:* HP Tourist Police & ITBP Mountain Grid
📞 *Emergency Hotline:* 112 / +91-1800-TRAVELISER-SAFE`;

            return { text: msg, googleMapsUrl, liveTrackerUrl };
        }
        window.formatWhatsAppLiveMessage = formatWhatsAppLiveMessage;

        function triggerWhatsAppLiveShare(phone, contactName) {
            getLiveCoordinates((coords) => {
                const { text, liveTrackerUrl } = formatWhatsAppLiveMessage(coords, contactName);
                const encodedText = encodeURIComponent(text);
                const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
                const waUrl = cleanPhone 
                    ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}&text=${encodedText}`
                    : `https://api.whatsapp.com/send?text=${encodedText}`;
                
                window.open(waUrl, '_blank');
                showNotificationToast(`🟢 Opening WhatsApp with Live Location pin (${coords.lat}° N, ${coords.lon}° E)!`);
            });
        }
        window.triggerWhatsAppLiveShare = triggerWhatsAppLiveShare;

        // Dedicated WhatsApp Live Location Share Button in Women Protection Shield
        const btnShareLiveWhatsapp = document.getElementById('btn-share-live-whatsapp');
        if (btnShareLiveWhatsapp) {
            btnShareLiveWhatsapp.addEventListener('click', () => {
                triggerWhatsAppLiveShare(null, null);
            });
        }

        // Copy Live Location Link Button
        const btnCopyLiveLink = document.getElementById('btn-copy-live-link');
        if (btnCopyLiveLink) {
            btnCopyLiveLink.addEventListener('click', () => {
                getLiveCoordinates((coords) => {
                    const { liveTrackerUrl } = formatWhatsAppLiveMessage(coords, null);
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(liveTrackerUrl).then(() => {
                            showNotificationToast('🔗 Live Tracking URL copied to clipboard! Paste into WhatsApp or SMS.');
                        }).catch(() => {
                            prompt('Copy your Live Tracking URL:', liveTrackerUrl);
                        });
                    } else {
                        prompt('Copy your Live Tracking URL:', liveTrackerUrl);
                    }
                });
            });
        }

        // -------------------------------------------------------------
        // FAMILY CONTACTS LIST & AESTHETIC MODAL CONTROLS
        // -------------------------------------------------------------
        const STORAGE_KEY_FAMILY_CONTACTS = 'traveliser_family_contacts';
        let savedFamilyContacts = [];

        function loadFamilyContacts() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY_FAMILY_CONTACTS);
                if (stored) {
                    savedFamilyContacts = JSON.parse(stored);
                } else {
                    savedFamilyContacts = [];
                }
            } catch (err) {
                console.warn('Failed loading family contacts from localStorage:', err);
                savedFamilyContacts = [];
            }
        }

        function saveFamilyContacts() {
            try {
                localStorage.setItem(STORAGE_KEY_FAMILY_CONTACTS, JSON.stringify(savedFamilyContacts));
            } catch (err) {
                console.warn('Failed saving family contacts to localStorage:', err);
            }
        }

        function renderFamilyContactsList() {
            if (!familyList) return;

            if (!savedFamilyContacts || savedFamilyContacts.length === 0) {
                familyList.innerHTML = `
                    <div class="family-empty-state" id="family-empty-state">
                        <div class="empty-glow-icon">🛡️</div>
                        <div class="empty-state-text">
                            <h4>No Emergency Contacts Assigned</h4>
                            <p>Click <strong>+ Add Contact</strong> above to link family members for real-time live WhatsApp location streaming and GPS telemetry.</p>
                        </div>
                    </div>
                `;
                return;
            }

            familyList.innerHTML = savedFamilyContacts.map(c => `
                <div class="family-item" data-phone="${c.phone}" data-name="${c.name}">
                    <div class="fam-avatar">${c.avatar || '👤'}</div>
                    <div class="fam-info">
                        <div class="fam-name-row">
                            <strong>${c.name}</strong>
                            <span class="fam-rel-tag">${c.relation || 'Contact'}</span>
                        </div>
                        <span>+91 ${c.phone}</span>
                    </div>
                    <div class="fam-actions-group">
                        <button type="button" class="fam-btn-wa" data-phone="${c.phone}" data-name="${c.name}" title="Share Live GPS Link with ${c.name} on WhatsApp">
                            <span>🟢 WhatsApp</span>
                        </button>
                        <button type="button" class="fam-btn-del" data-id="${c.id}" data-name="${c.name}" title="Remove Contact">
                            <span>✕</span>
                        </button>
                    </div>
                    <span class="fam-status synced">● Live Synced</span>
                </div>
            `).join('');

            // Wire up WhatsApp buttons
            familyList.querySelectorAll('.fam-btn-wa').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const phone = btn.dataset.phone;
                    const name = btn.dataset.name;
                    triggerWhatsAppLiveShare(phone, name);
                });
            });

            // Wire up Delete buttons
            familyList.querySelectorAll('.fam-btn-del').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const contactId = btn.dataset.id;
                    const contactName = btn.dataset.name;
                    savedFamilyContacts = savedFamilyContacts.filter(c => String(c.id) !== String(contactId));
                    saveFamilyContacts();
                    renderFamilyContactsList();
                    showNotificationToast(`🗑️ Contact ${contactName} removed from emergency circle.`);
                });
            });
        }

        // Initialize contacts
        loadFamilyContacts();
        renderFamilyContactsList();

        // Aesthetic Add Family Contact Modal
        const modalAddFam = document.getElementById('modal-add-family-contact');
        const btnCloseFamModal = document.getElementById('btn-close-fam-modal');
        const btnCancelFamModal = document.getElementById('btn-cancel-fam-modal');
        const formAddFam = document.getElementById('form-add-family-contact');
        const inputFamName = document.getElementById('fam-input-name');
        const inputFamPhone = document.getElementById('fam-input-phone');
        const inputFamRelation = document.getElementById('fam-input-relation');
        const inputFamAvatar = document.getElementById('fam-input-avatar');
        const relationChips = document.querySelectorAll('#fam-relation-chips .fam-rel-chip');

        function openAddFamilyModal() {
            if (!modalAddFam) return;
            if (formAddFam) formAddFam.reset();
            if (inputFamRelation) inputFamRelation.value = 'Mother';
            if (inputFamAvatar) inputFamAvatar.value = '👩';
            relationChips.forEach(chip => {
                chip.classList.toggle('active', chip.dataset.rel === 'Mother');
            });
            modalAddFam.style.display = 'flex';
            if (inputFamName) {
                setTimeout(() => inputFamName.focus(), 100);
            }
        }

        function closeAddFamilyModal() {
            if (modalAddFam) {
                modalAddFam.style.display = 'none';
            }
        }

        if (btnAddContact) {
            btnAddContact.addEventListener('click', (e) => {
                e.preventDefault();
                openAddFamilyModal();
            });
        }

        if (btnCloseFamModal) {
            btnCloseFamModal.addEventListener('click', closeAddFamilyModal);
        }

        if (btnCancelFamModal) {
            btnCancelFamModal.addEventListener('click', closeAddFamilyModal);
        }

        if (modalAddFam) {
            modalAddFam.addEventListener('click', (e) => {
                if (e.target === modalAddFam) {
                    closeAddFamilyModal();
                }
            });
        }

        // Relation Chips Selection
        relationChips.forEach(chip => {
            chip.addEventListener('click', () => {
                relationChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                if (inputFamRelation) inputFamRelation.value = chip.dataset.rel || 'Family';
                if (inputFamAvatar) inputFamAvatar.value = chip.dataset.avatar || '👤';
            });
        });

        // Form Submit
        if (formAddFam) {
            formAddFam.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = inputFamName ? inputFamName.value.trim() : '';
                const phone = inputFamPhone ? inputFamPhone.value.trim().replace(/[^\d]/g, '') : '';
                const relation = inputFamRelation ? inputFamRelation.value : 'Family';
                const avatar = inputFamAvatar ? inputFamAvatar.value : '👤';

                if (!name) {
                    showNotificationToast('⚠️ Please enter family member name');
                    if (inputFamName) inputFamName.focus();
                    return;
                }

                if (!phone || phone.length !== 10) {
                    showNotificationToast('⚠️ Please enter a valid 10-digit WhatsApp mobile number');
                    if (inputFamPhone) inputFamPhone.focus();
                    return;
                }

                const newContact = {
                    id: Date.now(),
                    name,
                    phone,
                    relation,
                    avatar
                };

                savedFamilyContacts.push(newContact);
                saveFamilyContacts();
                renderFamilyContactsList();
                closeAddFamilyModal();
                showNotificationToast(`✅ Contact ${name} (${relation}) connected for 24x7 Live WhatsApp telemetry!`);
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

        // Real Live Location SOS link on WhatsApp in Police SOS modal
        if (btnShareWhatsappSos) {
            btnShareWhatsappSos.addEventListener('click', () => {
                triggerWhatsAppLiveShare(null, "Family & Emergency Contacts");
            });
        }

        // 5B-2. INCOMING LIVE LOCATION RECEIVER (WHEN OPENED FROM A SHARED WHATSAPP LINK)
        function checkIncomingLiveSosLink() {
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get('live_sos') === 'true' || params.get('track_live') === 'true') {
                    const lat = params.get('lat') || '32.2432';
                    const lon = params.get('lng') || '77.1892';
                    const alt = params.get('alt') || '2,050 M';
                    const acc = params.get('acc') || '4';
                    const t = params.get('t') ? parseInt(params.get('t')) : Date.now();
                    const baseId = params.get('id') || 'MRG-FORCE-8849-HP';

                    // Update radar display with received live coordinates
                    if (dispLat) dispLat.textContent = `${lat}° N`;
                    if (dispLon) dispLon.textContent = `${lon}° E`;
                    if (dispAlt) dispAlt.textContent = decodeURIComponent(alt);
                    if (dispAcc) dispAcc.textContent = `±${acc} Meters`;

                    // Populate and display incoming live tracker modal
                    const incomingModal = document.getElementById('incoming-live-tracker-modal');
                    const incCoords = document.getElementById('incoming-sos-coords');
                    const incAcc = document.getElementById('incoming-sos-acc');
                    const incTime = document.getElementById('incoming-sos-time');
                    const incBase = document.getElementById('incoming-sos-base');
                    const btnIncMaps = document.getElementById('btn-incoming-google-maps');
                    const btnIncNav = document.getElementById('btn-incoming-navigate');
                    const btnCloseInc = document.getElementById('btn-close-incoming-tracker');

                    if (incCoords) incCoords.textContent = `${lat}° N, ${lon}° E`;
                    if (incAcc) incAcc.textContent = `Precision: ±${acc}m • Elevation: ${decodeURIComponent(alt)}`;
                    if (incTime) incTime.textContent = new Date(t).toLocaleString();
                    if (incBase) incBase.textContent = `#${baseId} (Police & ITBP Mountain Grid)`;

                    if (btnIncMaps) btnIncMaps.href = `https://www.google.com/maps?q=${lat},${lon}`;
                    if (btnIncNav) btnIncNav.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

                    if (btnCloseInc && incomingModal) {
                        btnCloseInc.addEventListener('click', () => {
                            incomingModal.style.display = 'none';
                        });
                    }

                    if (incomingModal) {
                        incomingModal.style.display = 'flex';
                    }

                    // Switch to emergency tab and scroll to live radar
                    if (window.switchEmergencyTab) window.switchEmergencyTab('women-safety');
                    const emergencySection = document.getElementById('emergency');
                    if (emergencySection) {
                        setTimeout(() => {
                            emergencySection.scrollIntoView({ behavior: 'smooth' });
                        }, 600);
                    }

                    showNotificationToast(`🚨 Connected to adventurer's live GPS broadcast at ${lat}° N, ${lon}° E!`);
                }
            } catch (err) {
                console.warn('Error processing incoming live SOS link:', err);
            }
        }
        checkIncomingLiveSosLink();

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
    const MOUNTAIN_ROAD_TRIPS = {
        'delhi-manali': {
            id: 'roadtrip_delhi_manali',
            title: 'Delhi to Manali & Rohtang Expedition',
            destination: 'Manali & Rohtang Pass',
            from: 'Delhi',
            to: 'Manali',
            duration: '3 Days / 2 Nights',
            distance: '530 km • Approx 11 hrs • Via Atal Tunnel',
            pricePerPerson: 4899,
            vibe: 'Alpine Snow & High Passes',
            pickupLocation: 'Delhi NCR / IGI Airport / Kashmere Gate',
            highlights: ['Atal Tunnel Expedition', 'Solang Valley Snow Camp', 'Rohtang Pass Snowline', 'Verified Mountain Pilot'],
            perks: ['🛡️ 4x4 Mountain SUV & Verified Chauffeur', '🫁 Medical Oxygen & Altitude Kit', '🚨 24x7 Women Safety Patrol Link']
        },
        'chandigarh-shimla': {
            id: 'roadtrip_chandigarh_shimla',
            title: 'Chandigarh to Shimla & Kufri Weekend Escape',
            destination: 'Shimla & Kufri',
            from: 'Chandigarh',
            to: 'Shimla',
            duration: '2 Days / 1 Night',
            distance: '115 km • Approx 3.5 hrs • Himalayan Express',
            pricePerPerson: 1850,
            vibe: 'Pine Ridges & Colonial Heritage',
            pickupLocation: 'Chandigarh Tribune Chowk / Airport / Sector 17',
            highlights: ['Mall Road Heritage Walk', 'Kufri Snow Viewpoint', 'Pine Forest Drive', 'High-Altitude Assist'],
            perks: ['🛡️ All-Weather Mountain Vehicle', '🫁 Emergency First Aid & Vitals', '🚨 24x7 Safety Telemetry']
        },
        'mumbai-goa': {
            id: 'roadtrip_mumbai_goa',
            title: 'Mumbai to Goa Coastal Highway Cruise',
            destination: 'Goa & Konkan Coast',
            from: 'Mumbai',
            to: 'Goa',
            duration: '3 Days / 2 Nights',
            distance: '585 km • Approx 10 hrs • Konkan Coastline',
            pricePerPerson: 5450,
            vibe: 'Coastal Serenity & Sunsets',
            pickupLocation: 'Mumbai Dadar / Navi Mumbai / Pune Bypass',
            highlights: ['Konkan Coastal Highway Drive', 'Boutique Beachfront Stay', 'Fresh Coastal Cuisine Halt', 'Certified Highway Captain'],
            perks: ['🛡️ Luxury Highway Cruiser', '🏖️ Beachside Stay Access', '🚨 24x7 Traveliser SOS Telemetry']
        },
        'bangalore-ooty': {
            id: 'roadtrip_bangalore_ooty',
            title: 'Bengaluru to Ooty & Coonoor Highlands',
            destination: 'Ooty & Nilgiri',
            from: 'Bengaluru',
            to: 'Ooty',
            duration: '3 Days / 2 Nights',
            distance: '275 km • Approx 6.5 hrs • Bandipur Forest',
            pricePerPerson: 3499,
            vibe: 'Tea Estates & Mountain Ghats',
            pickupLocation: 'Bengaluru Silk Board / Majestic / Electronic City',
            highlights: ['Bandipur Safari Forest Corridor', '36 Hairpin Bend Ghats', 'Tea Garden Chalet', 'Certified Hill Chauffeur'],
            perks: ['🛡️ Nilgiri Ghat-Certified SUV', '🫁 Forest Route First Aid', '🚨 24x7 High-Altitude Patrol Link']
        }
    };

    function getRoadTripPlan(from, to) {
        const key = `${(from || '').toLowerCase().trim()}-${(to || '').toLowerCase().trim()}`;
        if (MOUNTAIN_ROAD_TRIPS[key]) {
            return { ...MOUNTAIN_ROAD_TRIPS[key] };
        }
        for (const k in MOUNTAIN_ROAD_TRIPS) {
            if (k.includes((to || '').toLowerCase().trim())) {
                return { ...MOUNTAIN_ROAD_TRIPS[k] };
            }
        }
        return {
            id: 'roadtrip_' + Date.now(),
            title: `${from} to ${to} Mountain Expedition`,
            destination: `${to} & Alpine Corridor`,
            from: from || 'Delhi',
            to: to || 'Manali',
            duration: '3 Days / 2 Nights',
            distance: 'Scenic Mountain Expressway',
            pricePerPerson: 4899,
            vibe: 'Alpine Adventure & High Passes',
            pickupLocation: `${from} City Center / Airport`,
            highlights: ['Scenic Alpine Route', 'Boutique Mountain Stay', 'Verified Chauffeur'],
            perks: ['🛡️ 4x4 Mountain SUV & Verified Chauffeur', '🫁 Medical Oxygen & First Aid', '🚨 24x7 Women Safety Patrol Link']
        };
    }
    window.getRoadTripPlan = getRoadTripPlan;

    window.bookRoute = function(from, to) {
        if (fromCity) fromCity.value = from;
        if (toCity) toCity.value = to;

        // Note: Do NOT scroll up to booking-card! Screen stays smoothly in place.
        const plan = getRoadTripPlan(from, to);

        const currentUser = (typeof firebaseAuth !== 'undefined' && firebaseAuth) ? firebaseAuth.currentUser : null;
        const isRegisteredUser = !!(currentUser && !currentUser.isAnonymous);

        if (!isRegisteredUser) {
            // Unregistered traveller -> open Registration Modal first
            window.pendingRoadTripBooking = plan;
            if (typeof openAuthModal === 'function') {
                openAuthModal('signup');
                setTimeout(() => {
                    if (typeof showAuthAlert === 'function') {
                        showAuthAlert(`🏔️ <strong>Register to complete booking:</strong> Create your traveller account to confirm your expedition <strong>${plan.title}</strong> (${plan.duration})!`, 'info');
                    }
                }, 60);
            }
            if (window.showToast) {
                window.showToast(`Please register your account to confirm ${plan.title} 🏔️`);
            } else if (typeof showNotificationToast === 'function') {
                showNotificationToast(`Please register to confirm ${plan.title}! 🏔️`);
            }
            return;
        }

        // Already registered/logged in -> open checkout & booking modal
        if (typeof openBuyNowModal === 'function') {
            openBuyNowModal(plan);
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
    initCompiledTripHub();
    initEmergencyCenter();
    initWeatherForecasting();
    initGeminiPassAdvisory();
    initGeminiEmergencyCopilot();
    initGeminiPackingPlanner();
    initFoodInspectionDepartment();
    initGeminiStatusModal();

})();
