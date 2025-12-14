#!/bin/bash

# Simple API test script
BASE_URL="http://localhost:5000/api/v1"

echo "Testing REST API endpoints..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:5000/health | jq .
echo ""

# Test guest user creation
echo "2. Testing guest user creation..."
GUEST_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/guest" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "TestGuest", "emoji": "👤"}')
echo $GUEST_RESPONSE | jq .
GUEST_TOKEN=$(echo $GUEST_RESPONSE | jq -r '.accessToken')
echo "Guest Token: $GUEST_TOKEN"
echo ""

# Test get current user
if [ ! -z "$GUEST_TOKEN" ] && [ "$GUEST_TOKEN" != "null" ]; then
  echo "3. Testing get current user..."
  curl -s -X GET "$BASE_URL/auth/me" \
    -H "Authorization: Bearer $GUEST_TOKEN" | jq .
  echo ""
fi

# Test get rooms
echo "4. Testing get rooms..."
curl -s -X GET "$BASE_URL/rooms?page=1&limit=10" | jq .
echo ""

echo "API test completed!"
