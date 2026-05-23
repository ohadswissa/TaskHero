#!/bin/bash
# M2c smoke test — full curl flow
set +e
BASE=http://localhost:3000/api/v1
TRANSCRIPT=/tmp/m2c-curl-transcript.txt
exec > >(tee "$TRANSCRIPT") 2>&1

REDACT='s/(eyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)/<JWT_REDACTED>/g'

step() { echo ""; echo "==================================================="; echo "STEP: $1"; echo "==================================================="; }
show_req() { echo "+ $*"; }
show_json() { python3 -m json.tool 2>/dev/null || cat; }

# --- 1. Parent login ---
step "1. Parent login"
show_req "curl POST $BASE/auth/login -d '{email,password}'"
PARENT_RESP=$(curl -s -X POST $BASE/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@taskhero.app","password":"Demo123!"}')
echo "$PARENT_RESP" | sed -E "$REDACT" | show_json
PARENT_TOKEN=$(echo "$PARENT_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
echo "[token captured, length=${#PARENT_TOKEN}]"

# --- 2. Child login ---
step "2. Child login (family code DEMO2024, pin 1234)"
show_req "curl POST $BASE/auth/login/child -d '{familyCode,pin}'"
CHILD_RESP=$(curl -s -X POST $BASE/auth/login/child \
  -H 'Content-Type: application/json' \
  -d '{"familyCode":"DEMO2024","pin":"1234"}')
echo "$CHILD_RESP" | sed -E "$REDACT" | show_json
CHILD_TOKEN=$(echo "$CHILD_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
CHILD_USER_ID=$(echo "$CHILD_RESP" | python3 -c "import sys,json;u=json.load(sys.stdin)['user'];print(u.get('id',''))")
echo "[child token captured, length=${#CHILD_TOKEN}, userId=$CHILD_USER_ID]"

# Resolve childProfileId via parent /children list
CHILDREN_RESP=$(curl -s -X GET $BASE/children -H "Authorization: Bearer $PARENT_TOKEN")
CHILD_PROFILE_ID=$(echo "$CHILDREN_RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);arr=d if isinstance(d,list) else d.get('data',d.get('children',[]));print(next((c['id'] for c in arr if c.get('userId')==\"$CHILD_USER_ID\"), arr[0]['id'] if arr else ''))")
echo "[child profile id resolved] = $CHILD_PROFILE_ID"

# --- 3. Child onboard creature ---
step "3. Child onboard creature (FOREST_PUP / Mossy)"
show_req "POST $BASE/creatures/me/onboard"
curl -s -X POST $BASE/creatures/me/onboard \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"species":"FOREST_PUP","name":"Mossy"}' | show_json

# --- 4. Child dev-advance 25 ---
step "4. Child dev-advance +25 missions (must transition to BABY)"
show_req "POST $BASE/creatures/me/dev-advance"
DEV_RESP=$(curl -s -X POST $BASE/creatures/me/dev-advance \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"missions":25}')
echo "$DEV_RESP" | show_json
NEW_STAGE=$(echo "$DEV_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('newStage',''))")
echo "[ASSERT newStage=BABY] → got: $NEW_STAGE"

# --- 5. Child get notifications baseline ---
step "5. Child GET /notifications/mine (capture serverTime baseline)"
show_req "GET $BASE/notifications/mine"
NOTIF_RESP=$(curl -s -X GET $BASE/notifications/mine \
  -H "Authorization: Bearer $CHILD_TOKEN")
echo "$NOTIF_RESP" | show_json
SERVER_TIME=$(echo "$NOTIF_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['serverTime'])")
echo "[serverTime baseline] = $SERVER_TIME"

# --- 6. Parent creates mission ---
step "6. Parent POST /missions"
show_req "POST $BASE/missions"
MISSION_RESP=$(curl -s -X POST $BASE/missions \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Smoke test mission","description":"M2c verification","category":"DAILY_CHORE","traitCategory":"STRENGTH","xpReward":15,"coinReward":8,"heroWisdom":"Doing chores builds character."}')
echo "$MISSION_RESP" | show_json
MISSION_ID=$(echo "$MISSION_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# --- 7. Parent assigns mission ---
step "7. Parent POST /assignments"
show_req "POST $BASE/assignments (missionId=$MISSION_ID, child=$CHILD_PROFILE_ID)"
ASSIGN_RESP=$(curl -s -X POST $BASE/assignments \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"missionId\":\"$MISSION_ID\",\"childProfileId\":\"$CHILD_PROFILE_ID\"}")
echo "$ASSIGN_RESP" | show_json
ASSIGN_ID=$(echo "$ASSIGN_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

# --- 8. Child submits ---
step "8. Child POST /submissions"
show_req "POST $BASE/submissions"
SUB_RESP=$(curl -s -X POST $BASE/submissions \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"assignmentId\":\"$ASSIGN_ID\",\"notes\":\"Done!\"}")
echo "$SUB_RESP" | show_json

# --- 9. Parent verify ---
step "9. Parent POST /approvals/$ASSIGN_ID/verify"
show_req "POST $BASE/approvals/$ASSIGN_ID/verify"
VERIFY_RESP=$(curl -s -X POST $BASE/approvals/$ASSIGN_ID/verify \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"approved":true,"parentMessage":"Amazing job!"}')
echo "$VERIFY_RESP" | show_json

# --- 10. Child polls notifications since=baseline ---
step "10. Child GET /notifications/mine?since=$SERVER_TIME (must include hero_mail)"
show_req "GET $BASE/notifications/mine?since=$SERVER_TIME"
POLL_RESP=$(curl -s -X GET "$BASE/notifications/mine?since=$SERVER_TIME" \
  -H "Authorization: Bearer $CHILD_TOKEN")
echo "$POLL_RESP" | show_json
NOTIF_ID=$(echo "$POLL_RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);ns=d['notifications'];print([n['id'] for n in ns if n['type']=='hero_mail'][0] if ns else '')")
echo "[hero_mail notification id] = $NOTIF_ID"

# --- 11. Child marks read ---
step "11. Child POST /notifications/read"
show_req "POST $BASE/notifications/read [$NOTIF_ID]"
READ_RESP=$(curl -s -X POST $BASE/notifications/read \
  -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"ids\":[\"$NOTIF_ID\"]}")
echo "$READ_RESP" | show_json

# --- 12. Child re-fetches to confirm readAt ---
step "12. Child GET /notifications/mine (re-fetch — readAt should be set)"
show_req "GET $BASE/notifications/mine"
REFETCH=$(curl -s -X GET $BASE/notifications/mine \
  -H "Authorization: Bearer $CHILD_TOKEN")
echo "$REFETCH" | show_json
READ_AT=$(echo "$REFETCH" | python3 -c "import sys,json;d=json.load(sys.stdin);ns=[n for n in d['notifications'] if n['id']=='$NOTIF_ID'];print(ns[0]['readAt'] if ns else 'NOT_FOUND')")
echo "[readAt for $NOTIF_ID] = $READ_AT"

echo ""
echo "==================================================="
echo "SMOKE TEST DONE"
echo "==================================================="
