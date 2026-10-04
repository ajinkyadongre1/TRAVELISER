import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

ids = re.findall(r"getElementById\(['\"]([\w-]+)['\"]", js)
print('Total getElementById in app.js:', len(ids))
missing = [i for i in ids if f'id="{i}"' not in html]
print('Missing IDs:', missing)

assert len(missing) == 0, f"Found missing IDs: {missing}"
assert 'TRAVELISER' in html, "Traveliser brand name missing in HTML"
assert 'MARGIFY' in html, "Margify brand name missing in HTML"
assert 'SAHAYAKMITR.ai' in html, "SAHAYAKMITR.ai missing in HTML"
assert 'WOMEN SAFETY' in html, "WOMEN SAFETY missing in HTML"
assert 'LOST AND FOUND' in html, "LOST AND FOUND missing in HTML"
assert 'NEAR BY SPECIALIST' in html, "NEAR BY SPECIALIST missing in HTML"
assert 'FOOD INSPECTION DEPARTMENT' in html, "FOOD INSPECTION DEPARTMENT missing in HTML"

print("All Margify verification tests passed successfully!")
