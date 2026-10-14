#!/usr/bin/env bash
# 상품제안서(greyd.app/propose) + 자사몰 링크 불러오기 API를 맥에서 한 번에 반영한다.
#   OPS_DIR  : ops(Next.js, ops.greyd.app) 저장소 폴더
#   SITE_DIR : greyd.app 웹사이트 저장소 폴더
# 사용: OPS_DIR=~/greyd-ops SITE_DIR=~/greyd-web bash deploy-propose.sh
# 각 저장소에 커밋·푸시까지 한다. 배포는 각 저장소의 기존 방식(푸시 시 자동 배포 등)을 따른다.
set -euo pipefail

RAW="https://raw.githubusercontent.com/arbaimauto-creator/app/claude/inspiring-knuth-6zjyy6"
OPS_DIR="${OPS_DIR:?OPS_DIR=ops 저장소 폴더를 지정하세요}"
SITE_DIR="${SITE_DIR:?SITE_DIR=greyd.app 웹사이트 저장소 폴더를 지정하세요}"

say() { printf '\n\033[1;33m▶ %s\033[0m\n' "$1"; }

commit_push() {
  local msg="$1"
  if git diff --cached --quiet; then
    echo "  변경 없음 — 건너뜀"
    return
  fi
  git commit -q -m "$msg"
  git push
}

# ── 1. ops: GET /api/public/product-preview ─────────────────────────
say "ops: 자사몰 링크 불러오기 API 추가 ($OPS_DIR)"
cd "$OPS_DIR"
git pull --ff-only
if [ -d src/app ]; then APP=src/app; elif [ -d app ]; then APP=app; else
  echo "  app/ 또는 src/app/ 폴더를 찾지 못했어요 — Next.js App Router 저장소가 맞는지 확인하세요"; exit 1
fi
mkdir -p "$APP/api/public/product-preview"
curl -fsSL "$RAW/docs/server-patches/product-preview-2026-10-14.js" -o "$APP/api/public/product-preview/route.js"
git add "$APP/api/public/product-preview/route.js"
commit_push "feat(api): 상품제안서 자사몰 링크 미리보기 GET /api/public/product-preview"

# ── 2. greyd.app: /propose 양식 교체 ────────────────────────────────
say "greyd.app: /propose 양식 교체 ($SITE_DIR)"
cd "$SITE_DIR"
git pull --ff-only
# 지금 배포돼 있는 양식 파일을 찾아 그 자리에 덮어쓴다(경로를 몰라도 되게)
TARGET="$(grep -rl --include='*.html' '상품제안서' public 2>/dev/null | head -1 || true)"
if [ -z "$TARGET" ]; then
  TARGET="public/propose.html"
  echo "  기존 양식 파일이 없어 $TARGET 로 새로 둡니다 (/propose 라우팅 확인 필요)"
fi
curl -fsSL "$RAW/web/public/propose/index.html" -o "$TARGET"
echo "  덮어씀: $TARGET"
git add "$TARGET"
commit_push "feat(propose): 상품제안서 — 자사몰 링크 불러오기, 필요 서류는 안내만"

# ── 3. 확인 ─────────────────────────────────────────────────────────
say "배포가 끝나면 확인 (1~3분 뒤)"
echo "  curl -s 'https://ops.greyd.app/api/public/product-preview?url=https://www.coupang.com/vp/products/1'   # → {\"error\":\"unsupported_site\"}"
echo "  curl -s https://greyd.app/propose | grep -c '필요 서류 안내'                                         # → 1 이상"
