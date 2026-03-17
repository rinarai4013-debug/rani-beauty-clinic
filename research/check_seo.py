import urllib.request, json, re, time

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    try:
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.read().decode('utf-8', errors='ignore'), resp.geturl(), resp.status
    except Exception as e:
        return None, url, str(e)

# Check robots.txt
print("=== ROBOTS.TXT ===")
html, final_url, status = fetch("https://ranibeautyclinic.com/robots.txt")
if html:
    print(html[:500])
else:
    print(f"Error: {status}")

# Check sitemap
print("\n=== SITEMAP ===")
html, final_url, status = fetch("https://ranibeautyclinic.com/sitemap.xml")
if html:
    # Count URLs
    urls = re.findall(r'<loc>(.*?)</loc>', html)
    print(f"Sitemap found with {len(urls)} URLs")
    print("First 10 URLs:")
    for u in urls[:10]:
        print(f"  {u}")
else:
    print(f"No sitemap found: {status}")

# Check redirect chain
print("\n=== REDIRECT CHECK ===")
import urllib.request
for test_url in ["http://ranibeautyclinic.com/", "https://ranibeautyclinic.com/"]:
    try:
        req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
        resp = urllib.request.urlopen(req, timeout=15)
        print(f"{test_url} -> {resp.geturl()} (status: {resp.status})")
    except Exception as e:
        print(f"{test_url} -> Error: {e}")

# Check canonical tags on key pages
print("\n=== CANONICAL TAGS ===")
pages = [
    "https://ranibeautyclinic.com/",
    "https://ranibeautyclinic.com/services/laser-hair-removal/",
    "https://ranibeautyclinic.com/services/hydrafacial/",
    "https://ranibeautyclinic.com/about-us/",
]
for page in pages:
    html, final_url, status = fetch(page)
    if html:
        canonical = re.findall(r'<link[^>]*rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', html, re.IGNORECASE)
        meta_desc = re.findall(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        title = re.findall(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE)
        print(f"\nPage: {page}")
        print(f"  Final URL: {final_url}")
        print(f"  Title: {title[0][:80] if title else 'MISSING'}")
        print(f"  Canonical: {canonical[0] if canonical else 'MISSING'}")
        print(f"  Meta desc: {meta_desc[0][:100] if meta_desc else 'MISSING'}")
    else:
        print(f"\nPage: {page} - Error: {status}")

# Check for broken internal links (sample)
print("\n=== INTERNAL LINK CHECK (Sample) ===")
html, _, _ = fetch("https://ranibeautyclinic.com/")
if html:
    links = re.findall(r'href=["\']([^"\']+)["\']', html)
    internal_links = [l for l in links if 'ranibeautyclinic.com' in l or l.startswith('/')]
    print(f"Total internal links on homepage: {len(internal_links)}")
    # Check a few
    checked = 0
    for link in internal_links[:20]:
        if link.startswith('/'):
            link = 'https://ranibeautyclinic.com' + link
        if 'ranibeautyclinic.com' in link:
            try:
                req = urllib.request.Request(link, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
                resp = urllib.request.urlopen(req, timeout=10)
                status_code = resp.status
            except urllib.error.HTTPError as e:
                status_code = e.code
            except Exception as e:
                status_code = f"ERR: {e}"
            if str(status_code) not in ['200', '301', '302']:
                print(f"  {link} -> {status_code}")
            checked += 1
    print(f"Checked {checked} internal links, issues noted above")
