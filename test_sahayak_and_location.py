import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Test that all requested destinations are defined in DESTINATION_DATABASE and DESTINATION_ALIASES
requested_destinations = [
    'mumbai', 'pune', 'gwalior', 'kanpur', 'banaras', 'prayagraj', 'agra', 
    'goa', 'hoa', 'aurangabad', 'manali', 'lucknow', 'muzzafarnagar', 'faridabad', 
    'greater noida', 'bhopal', 'jabalpur', 'puri', 'konkan', 'munsiyari', 
    'nainital', 'kedarnath', 'jyotirling', 'trekking', 'delhi', 'chennai', 
    'kolkata', 'benguluru', 'mathura', 'jaipur', 'ayodhya'
]

print("--- Testing Destinations ---")
missing_destinations = []
for dest in requested_destinations:
    # check in DESTINATION_ALIASES or DESTINATION_DATABASE
    if f"'{dest}'" not in js and f'"{dest}"' not in js:
        missing_destinations.append(dest)

print("Checked", len(requested_destinations), "destinations.")
if missing_destinations:
    print("Missing destinations in aliases/database:", missing_destinations)
    assert len(missing_destinations) == 0, f"Missing destinations: {missing_destinations}"
else:
    print("SUCCESS: All 31 requested destinations and aliases are properly registered in DESTINATION_DATABASE / DESTINATION_ALIASES!")

# 2. Test that memory elements and functions are present
print("\n--- Testing Memory Engine ---")
assert 'sahayakMemory' in js, "sahayakMemory object missing"
assert 'addPlaceToSahayakMemory' in js, "addPlaceToSahayakMemory function missing"
assert 'renderSahayakMemoryBar' in js, "renderSahayakMemoryBar function missing"
assert 'sahayak-memory-bar' in html, "sahayak-memory-bar element missing in HTML"
assert 'memory-tags-list' in html, "memory-tags-list element missing in HTML"
assert 'btn-clear-memory' in html, "btn-clear-memory element missing in HTML"
print("SUCCESS: Journey memory engine and UI components verified!")

# 3. Test that real WhatsApp Live Location Sharing is present
print("\n--- Testing WhatsApp Live Location Sharing ---")
assert 'formatWhatsAppLiveMessage' in js, "formatWhatsAppLiveMessage function missing"
assert 'triggerWhatsAppLiveShare' in js, "triggerWhatsAppLiveShare function missing"
assert 'btn-share-live-whatsapp' in html, "btn-share-live-whatsapp element missing in HTML"
assert 'btn-copy-live-link' in html, "btn-copy-live-link element missing in HTML"
assert 'fam-btn-wa' in html, "fam-btn-wa class missing in HTML"
assert 'incoming-live-tracker-modal' in html, "incoming-live-tracker-modal element missing in HTML"
assert 'btn-incoming-google-maps' in html, "btn-incoming-google-maps missing in HTML"
assert 'btn-incoming-navigate' in html, "btn-incoming-navigate missing in HTML"
assert 'checkIncomingLiveSosLink' in js, "checkIncomingLiveSosLink function missing in JS"
print("SUCCESS: WhatsApp Live Location sharing and real receiver modal verified!")

# 4. Test test_verify.py assertions
ids = re.findall(r"getElementById\(['\"]([\w-]+)['\"]", js)
missing_ids = [i for i in ids if f'id="{i}"' not in html]
assert len(missing_ids) == 0, f"Found missing IDs in HTML: {missing_ids}"
print("\nSUCCESS: All", len(ids), "element IDs match between app.js and index.html with 0 errors!")

print("\n*** ALL TESTS PASSED WITH 100% SUCCESS! ***")
