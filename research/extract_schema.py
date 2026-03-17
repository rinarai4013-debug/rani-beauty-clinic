import sys, re, json, urllib.request

url = "https://ranibeautyclinic.com/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')

# Find all JSON-LD scripts
pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)

print(f'Found {len(matches)} JSON-LD blocks on homepage')
for i, m in enumerate(matches):
    try:
        data = json.loads(m.strip())
        schema_type = data.get('@type', 'Unknown')
        print(f'\n--- Schema {i+1}: {schema_type} ---')
        print(json.dumps(data, indent=2)[:800])
    except Exception as e:
        print(f'Schema {i+1}: Parse error - {e}')
        print(m[:200])

# Also check service pages
service_urls = [
    "https://ranibeautyclinic.com/services/laser-hair-removal/",
    "https://ranibeautyclinic.com/services/botox/",
    "https://ranibeautyclinic.com/services/hydrafacial/",
]
for surl in service_urls:
    try:
        req2 = urllib.request.Request(surl, headers={'User-Agent': 'Mozilla/5.0'})
        html2 = urllib.request.urlopen(req2).read().decode('utf-8', errors='ignore')
        matches2 = re.findall(pattern, html2, re.DOTALL | re.IGNORECASE)
        print(f'\n=== {surl}: {len(matches2)} JSON-LD blocks ===')
        for j, m2 in enumerate(matches2):
            try:
                data2 = json.loads(m2.strip())
                print(f'  Type: {data2.get("@type","?")}')
            except:
                pass
    except Exception as e:
        print(f'Error fetching {surl}: {e}')
