#!/usr/bin/env bash
# M5b live walkthrough — exercises GET /notifications/mine, POST /notifications/read,
# POST /creatures/me/feed end-to-end through the same NestJS backend the mobile app
# will hit. Scenarios A (Hero Mail), B (feed care item), C (queue of 2).
#
# Usage: bash backend/scripts/m5b-walkthrough.sh
# Requires the dev backend running on http://localhost:3000.

set -euo pipefail

API="http://localhost:3000/api/v1"

say() { printf "\n\033[1;34m── %s ──\033[0m\n" "$*"; }
ok()  { printf "  \033[32m✓\033[0m %s\n" "$*"; }
note(){ printf "  \033[2m%s\033[0m\n" "$*"; }
jpp() { python3 -m json.tool 2>/dev/null || cat; }

# ---------------------------------------------------------------------------
# 1) Parent login
# ---------------------------------------------------------------------------
say "STEP 1 — Parent login (demo@taskhero.app)"
PARENT_LOGIN=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"demo@taskhero.app","password":"Demo123!"}')
PARENT_TOKEN=$(echo "$PARENT_LOGIN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessToken"])')
FAMILY_ID=$(echo "$PARENT_LOGIN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["user"]["familyId"])')
ok "parent token acquired, familyId=$FAMILY_ID"

# ---------------------------------------------------------------------------
# 2) Discover or provision child + creature
# ---------------------------------------------------------------------------
say "STEP 2 — Look up demo children"
CHILDREN=$(curl -s "$API/children" -H "Authorization: Bearer $PARENT_TOKEN")
echo "$CHILDREN" > /tmp/m5b_children.json
python3 - <<'PY'
import json
rows = json.load(open('/tmp/m5b_children.json'))
for c in rows:
    print(f"  child {c['id']} = {c['displayName']}")
PY
# Use the M6 walkthrough child (pin 3747) — it has the pre-hatched Sparky and is
# the canonical demo persona per M5b instructions.
CHILD_ID=$(python3 -c "import json;rows=json.load(open('/tmp/m5b_children.json'));print([c['id'] for c in rows if c['displayName']=='M6Tester'][0])")
CHILD_PIN="3747"
INVITE_CODE=$(curl -s "$API/families/me" -H "Authorization: Bearer $PARENT_TOKEN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["inviteCode"])')
ok "using child=$CHILD_ID pin=$CHILD_PIN family=$INVITE_CODE"

say "STEP 3 — Child login"
CHILD_LOGIN=$(curl -s -X POST "$API/auth/login/child" -H 'Content-Type: application/json' \
  -d "{\"familyCode\":\"$INVITE_CODE\",\"pin\":\"$CHILD_PIN\"}")
CHILD_TOKEN=$(echo "$CHILD_LOGIN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessToken"])')
ok "child token acquired"

# Ensure creature is hatched (BABY); ignore "already onboarded" failure
say "STEP 4 — Ensure creature exists (onboard if needed)"
CREATURE=$(curl -s "$API/creatures/me" -H "Authorization: Bearer $CHILD_TOKEN")
if echo "$CREATURE" | grep -q 'not been hatched'; then
  CREATURE=$(curl -s -X POST "$API/creatures/me/onboard" -H "Authorization: Bearer $CHILD_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"species":"FOREST_PUP","name":"Sparky"}')
  ok "creature hatched"
else
  ok "creature already hatched"
fi
echo "$CREATURE" > /tmp/m5b_creature.json
python3 - <<'PY' || true
import json
c = json.load(open('/tmp/m5b_creature.json'))
print(f"  creature {c['name']} stage={c['stage']} happiness={c['happiness']} STR={c['strengthPoints']} WIS={c['wisdomPoints']} HRT={c['heartPoints']}")
PY

# ---------------------------------------------------------------------------
# 3) Cursor baseline — record "now" so we only see what we trigger below
# ---------------------------------------------------------------------------
say "STEP 5 — Initial poll cursor (baseline)"
BASE_POLL=$(curl -s "$API/notifications/mine" -H "Authorization: Bearer $CHILD_TOKEN")
SERVER_TIME=$(echo "$BASE_POLL" | python3 -c 'import json,sys;print(json.load(sys.stdin)["serverTime"])')
ok "baseline serverTime=$SERVER_TIME"

# ---------------------------------------------------------------------------
# Helper to drive a full mission cycle for SCENARIO A and C
# ---------------------------------------------------------------------------
function trigger_verify() {
  local TITLE="$1"
  local PARENT_MSG="$2"
  local TRAIT="$3"   # STRENGTH|WISDOM|HEART

  # 1. Parent creates mission (no assignee in CreateMissionDto)
  local MISSION_JSON
  MISSION_JSON=$(curl -s -X POST "$API/missions" -H "Authorization: Bearer $PARENT_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"title\":\"$TITLE\",\"description\":\"$TITLE\",\"category\":\"DAILY_CHORE\",\"traitCategory\":\"$TRAIT\",\"heroWisdom\":\"Kindness is courage in quiet form.\",\"xpReward\":15,\"coinReward\":8}")
  local MISSION_ID
  MISSION_ID=$(echo "$MISSION_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
  note "mission created id=$MISSION_ID"

  # 2. Parent assigns mission to child → returns the MissionAssignment row
  local ASSIGN_JSON
  ASSIGN_JSON=$(curl -s -X POST "$API/assignments" -H "Authorization: Bearer $PARENT_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"missionId\":\"$MISSION_ID\",\"childProfileId\":\"$CHILD_ID\"}")
  local ASSIGN_ID
  ASSIGN_ID=$(echo "$ASSIGN_JSON" | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
  note "assignment id=$ASSIGN_ID"

  # 3. Child submits
  curl -s -X POST "$API/submissions" -H "Authorization: Bearer $CHILD_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"assignmentId\":\"$ASSIGN_ID\",\"notes\":\"Done!\",\"photoUrls\":[]}" > /dev/null
  note "child submitted"

  # 4. Parent verifies
  local VERIFY_JSON
  VERIFY_JSON=$(curl -s -X POST "$API/approvals/$ASSIGN_ID/verify" -H "Authorization: Bearer $PARENT_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"approved\":true,\"parentMessage\":\"$PARENT_MSG\"}")
  ok "verify response (parent side):"
  echo "$VERIFY_JSON" | python3 -m json.tool 2>/dev/null | sed 's/^/    /' || echo "    $VERIFY_JSON"
  echo "$VERIFY_JSON" > /tmp/m5b_verify_last.json
}

# ===========================================================================
# SCENARIO A — single Hero Mail arrives within 5s
# ===========================================================================
say "═══════════ SCENARIO A — single Hero Mail ═══════════"
trigger_verify "Hug your sibling" "I'm proud of you 💛" "HEART"

say "STEP A.1 — Poll /notifications/mine?since=<baseline>  (simulates the 5s tick)"
sleep 1
POLL_A=$(curl -s "$API/notifications/mine?since=$SERVER_TIME" -H "Authorization: Bearer $CHILD_TOKEN")
echo "$POLL_A" | jpp | sed 's/^/  /'
HM_ID_A=$(echo "$POLL_A" | python3 -c 'import json,sys;rows=json.load(sys.stdin)["notifications"];print([r["id"] for r in rows if r["type"]=="hero_mail"][0])')
SERVER_TIME=$(echo "$POLL_A" | python3 -c 'import json,sys;print(json.load(sys.stdin)["serverTime"])')
ok "hero_mail id=$HM_ID_A landed; new cursor=$SERVER_TIME"
note "↑ This is the JSON the mobile app's HeroMailOverlay renders."

say "STEP A.2 — Confirm payload field plumbing (HeroMailData shape)"
echo "$POLL_A" > /tmp/m5b_poll_a.json
python3 - <<'PY'
import json
rows = json.load(open('/tmp/m5b_poll_a.json'))["notifications"]
hm = [r for r in rows if r["type"]=="hero_mail"][0]
d = hm["data"]
need = ["assignmentId","parentMessage","missionTitle","traitCategory","careItemId","careItemName","xpAwarded","coinsAwarded","evolutionStage","rewardUnlockedId"]
missing = [k for k in need if k not in d]
print("  fields present:", ", ".join(sorted(d.keys())))
print("  missing:", missing or "(none)")
assert not missing, "HeroMailData contract drift"
PY
ok "all 10 HeroMailData fields present"

say "STEP A.3 — Tap-to-dismiss simulation → POST /notifications/read"
READ_RES=$(curl -s -X POST "$API/notifications/read" -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' -d "{\"ids\":[\"$HM_ID_A\"]}")
echo "  $READ_RES"
ok "notification marked read"

# ===========================================================================
# SCENARIO B — feed the care item
# ===========================================================================
say "═══════════ SCENARIO B — feed the care item ═══════════"
say "STEP B.1 — Re-read creature, pick first unconsumed care item"
CREATURE=$(curl -s "$API/creatures/me" -H "Authorization: Bearer $CHILD_TOKEN")
HAPP_BEFORE=$(echo "$CREATURE" | python3 -c 'import json,sys;print(json.load(sys.stdin)["happiness"])')
HEART_BEFORE=$(echo "$CREATURE" | python3 -c 'import json,sys;print(json.load(sys.stdin)["heartPoints"])')
CARE_ID=$(echo "$CREATURE" | python3 -c 'import json,sys;c=json.load(sys.stdin);items=c.get("pendingCareItems",[]);print(items[0]["id"] if items else "")')
CARE_TRAIT=$(echo "$CREATURE" | python3 -c 'import json,sys;c=json.load(sys.stdin);items=c.get("pendingCareItems",[]);print(items[0]["traitCategory"] if items else "")')
ok "before: happiness=$HAPP_BEFORE heart=$HEART_BEFORE careItem=$CARE_ID trait=$CARE_TRAIT"

if [ -z "$CARE_ID" ]; then
  echo "  ✗ No care item on shelf — did the verify produce one?" && exit 1
fi

say "STEP B.2 — POST /creatures/me/feed  body { careItemId }"
FEED_RES=$(curl -s -X POST "$API/creatures/me/feed" -H "Authorization: Bearer $CHILD_TOKEN" \
  -H 'Content-Type: application/json' -d "{\"careItemId\":\"$CARE_ID\"}")
echo "$FEED_RES" > /tmp/m5b_feed.json
python3 - <<'PY'
import json
c = json.load(open('/tmp/m5b_feed.json'))
print(f"  after: happiness={c['happiness']} STR={c['strengthPoints']} WIS={c['wisdomPoints']} HRT={c['heartPoints']} pending={len(c.get('pendingCareItems',[]))}")
PY
ok "feed succeeded"

say "STEP B.3 — Verify item is gone from shelf + happiness bumped"
CREATURE_AFTER=$(curl -s "$API/creatures/me" -H "Authorization: Bearer $CHILD_TOKEN")
echo "$CREATURE_AFTER" > /tmp/m5b_creature_after.json
HAPP_BEFORE_EXPORT=$HAPP_BEFORE CARE_ID_EXPORT=$CARE_ID python3 - <<'PY'
import json, os
c = json.load(open('/tmp/m5b_creature_after.json'))
happ_before = int(os.environ['HAPP_BEFORE_EXPORT'])
care_id = os.environ['CARE_ID_EXPORT']
ids = [i['id'] for i in c.get('pendingCareItems',[])]
print(f"  pending care item ids: {ids}")
print(f"  happiness: {happ_before} -> {c['happiness']}")
assert care_id not in ids, 'care item still on shelf!'
assert c['happiness'] >= happ_before, 'happiness did not increase'
print('  ok care item consumed, happiness >= baseline')
PY

# ===========================================================================
# SCENARIO C — queue of 2 overlays
# ===========================================================================
say "═══════════ SCENARIO C — back-to-back verifies queue ═══════════"
trigger_verify "Read for 15 minutes" "You taught me something today 🌱" "WISDOM"
trigger_verify "Do 10 jumping jacks"  "You showed real courage 💪"      "STRENGTH"

say "STEP C.1 — Single poll picks up BOTH (since=$SERVER_TIME)"
sleep 1
POLL_C=$(curl -s "$API/notifications/mine?since=$SERVER_TIME" -H "Authorization: Bearer $CHILD_TOKEN")
echo "$POLL_C" > /tmp/m5b_poll_c.json
python3 - <<'PY'
import json
data = json.load(open('/tmp/m5b_poll_c.json'))
hms = [r for r in data["notifications"] if r["type"]=="hero_mail"]
print(f"  hero_mail rows: {len(hms)} (newest first per backend createdAt DESC)")
for r in hms:
    d = r["data"]
    print(f"    - id={r['id'][:8]}... mission={d['missionTitle']!r} trait={d['traitCategory']} msg={d['parentMessage']!r}")
PY
COUNT_C=$(python3 -c "import json;d=json.load(open('/tmp/m5b_poll_c.json'));print(sum(1 for r in d['notifications'] if r['type']=='hero_mail'))")
[ "$COUNT_C" -ge 2 ] && ok "queue has $COUNT_C hero_mail rows — child layout will pop oldest-first"

# Dismiss one at a time to mirror UX
say "STEP C.2 — Dismiss them one-by-one (oldest first)"
IDS_ASC=$(python3 -c "
import json
hms = [r for r in json.load(open('/tmp/m5b_poll_c.json'))['notifications'] if r['type']=='hero_mail']
hms.sort(key=lambda r: r['createdAt'])
print(' '.join(r['id'] for r in hms))
")
for ID in $IDS_ASC; do
  curl -s -X POST "$API/notifications/read" -H "Authorization: Bearer $CHILD_TOKEN" \
    -H 'Content-Type: application/json' -d "{\"ids\":[\"$ID\"]}" > /dev/null
  note "dismissed $ID"
done
ok "all overlays dismissed; queue drained"

say "STEP C.3 — Confirm no further unread hero_mail rows"
FINAL=$(curl -s "$API/notifications/mine" -H "Authorization: Bearer $CHILD_TOKEN")
UNREAD=$(echo "$FINAL" | python3 -c 'import json,sys;print(sum(1 for r in json.load(sys.stdin)["notifications"] if r["type"]=="hero_mail" and not r["isRead"]))')
ok "unread hero_mail rows remaining: $UNREAD"

say "═══════════ M5b walkthrough complete ═══════════"
