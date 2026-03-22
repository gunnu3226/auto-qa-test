#!/bin/bash
cd "$(dirname "$0")/.."

echo "=== Auto QA Polling 스크립트 시작 ==="
echo "프로젝트: $(pwd)"
echo ""

while true; do
  npx tsx scripts/poll.ts
  echo "스크립트가 종료되었습니다. 3초 후 재시작..."
  sleep 3
done
