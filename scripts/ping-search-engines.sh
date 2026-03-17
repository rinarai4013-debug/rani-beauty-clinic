#!/bin/bash
# Ping all search engines to accelerate indexing
# Run after every deployment: bash scripts/ping-search-engines.sh

BASE_URL="https://ranibeautyclinic.com"

echo "=== Pinging Search Engines ==="

# 1. Google PubSubHubbub (WebSub) — triggers immediate crawl of feed
echo ""
echo "1. Pinging Google PubSubHubbub hub..."
curl -s -o /dev/null -w "   Status: %{http_code}\n" \
  -X POST https://pubsubhubbub.appspot.com/ \
  -d "hub.mode=publish" \
  -d "hub.url=${BASE_URL}/feed.xml"

# 2. Google Search Console sitemap ping (re-notify about sitemap)
echo ""
echo "2. Pinging Google with sitemap..."
curl -s -o /dev/null -w "   Status: %{http_code}\n" \
  "https://www.google.com/ping?sitemap=${BASE_URL}/sitemap.xml"

# 3. Bing sitemap ping
echo ""
echo "3. Pinging Bing with sitemap..."
curl -s -o /dev/null -w "   Status: %{http_code}\n" \
  "https://www.bing.com/ping?sitemap=${BASE_URL}/sitemap.xml"

# 4. IndexNow bulk submission (Bing, Yandex, Naver, Seznam)
echo ""
echo "4. Triggering IndexNow bulk submission..."
INDEXNOW_SECRET="${INDEXNOW_SECRET:-rani-indexnow-2026}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/indexnow" \
  -H "Authorization: Bearer ${INDEXNOW_SECRET}" \
  -H "Content-Type: application/json")
echo "   Response: ${RESPONSE}"

echo ""
echo "=== Done! All search engines notified. ==="
