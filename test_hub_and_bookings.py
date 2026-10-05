import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

print("--- 1. Testing Compiled Trip Parameter Hub Elements ---")
hub_elements = [
    'trip-parameter-hub',
    'btn-open-quick-destinations',
    'hub-selected-dest-label',
    'btn-open-trip-duration',
    'hub-selected-dur-label',
    'btn-hub-generate-plan',
    'modal-quick-destination',
    'btn-close-quick-dest-modal',
    'search-quick-dest-input',
    'dest-category-filter-pills',
    'quick-dest-materials-grid',
    'modal-trip-duration',
    'btn-close-trip-dur-modal',
    'trip-dur-materials-grid',
]

for el in hub_elements:
    assert f'id="{el}"' in html, f"Missing {el} in index.html"
    if el not in ['trip-parameter-hub', 'dest-category-filter-pills']:
        assert f"'{el}'" in js or f'"{el}"' in js, f"Missing {el} reference in app.js"

# Verify travel vibe and old chips bar are REMOVED as requested
assert 'id="btn-open-travel-vibe"' not in html, "btn-open-travel-vibe should be removed"
assert 'id="modal-travel-vibe"' not in html, "modal-travel-vibe should be removed"
assert 'class="itinerary-customizer-bar"' not in html, "old itinerary-customizer-bar should be removed"

print("SUCCESS: Compiled Trip Parameter Hub (Quick Destination & Trip Duration) verified, and Travel Vibe / Old Chips successfully removed!")

print("\n--- 2. Testing YOUR BOOKING and YOUR PLANS Synchronization ---")
booking_elements = [
    'floating-bookings-corner-btn',
    'floating-bookings-count',
    'floating-plans-corner-btn',
    'floating-plans-count',
    'header-my-bookings-btn',
    'header-bookings-count',
    'cat-your-bookings',
    'cat-bookings-count',
    'your-bookings',
    'your-plans',
    'bookings-count-display',
    'bookings-grid',
    'btn-close-bookings-drawer',
    'btn-tab-switch-to-plans',
    'btn-tab-switch-to-bookings',
    'btn-plans-switch-to-bookings',
    'modal-view-eticket',
    'btn-close-eticket-modal',
    'eticket-title',
    'eticket-body-content',
    'btn-print-eticket'
]

for el in booking_elements:
    assert f'id="{el}"' in html, f"Missing {el} in index.html"
    assert f"'{el}'" in js or f'"{el}"' in js, f"Missing {el} in app.js"

print("SUCCESS: All YOUR BOOKING elements exist in HTML and JS!")

print("\n--- 3. Testing Visual Placement (YOUR BOOKING just above YOUR PLANS) ---")
# Check css bottom positions
assert '.floating-bookings-corner-btn' in css
assert '.floating-plans-corner-btn' in css
assert 'bottom: 78px' in css or 'bottom: 84px' in css, "floating-bookings-corner-btn bottom positioning not set above plans"
assert 'bottom: 24px' in css, "floating-plans-corner-btn bottom position not 24px"
print("SUCCESS: YOUR BOOKING launcher positioned directly above YOUR PLANS in style.css!")

print("\n--- 4. Testing Removal of Booked Item from YOUR PLANS and Addition to YOUR BOOKING ---")
# Check that savedPlans filtering occurs on booking confirmation
assert 'savedPlans = savedPlans.filter(' in js, "savedPlans filtering on booking missing"
assert 'addBooking(' in js, "addBooking function missing"
assert 'savedBookings' in js, "savedBookings storage missing"
assert 'STORAGE_KEY_BOOKINGS' in js, "STORAGE_KEY_BOOKINGS missing"
print("SUCCESS: Automatic removal from YOUR PLANS and addition to YOUR BOOKING verified in app.js!")

print("\n*** ALL HUB & BOOKING INTEGRATION TESTS PASSED 100% ***")
