#!/usr/bin/env bash
# ops 자사몰 링크 미리보기 — 통화를 KRW로 넘겨짚지 않게, 이미지 찾는 곳 넓히기 → 테스트 → 푸시 → EC2 배포 → 확인
# 맥에서: bash <(curl -fsSL https://raw.githubusercontent.com/arbaimauto-creator/app/claude/inspiring-knuth-6zjyy6/scripts/fix-ops-preview-currency.sh)
# 중간에 실패하면 거기서 멈추고 아무것도 배포하지 않는다.
set -uo pipefail

WORK="$HOME/greyd-work"
BASE="$WORK/ops-launch"
FIX="$WORK/ops-preview-fix"
BRANCH="${BRANCH:-}"   # 비우면 운영 릴리스가 들어 있는 브랜치를 자동으로 찾는다
PREVIEW_SHA=5ea9982  # 링크 미리보기 API 커밋
KEY="$HOME/.ssh/greyd-ops-sg.pem"
HOST="ubuntu@13.215.149.118"
FILE="lib/proposals/productPreview.ts"
stop() { printf '\n\033[1;31m✖ %s\033[0m\n' "$1"; exit 1; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }

echo "1/6 운영 서버에 떠 있는 릴리스와 그 브랜치 찾기"
LIVE=$(ssh -i "$KEY" -o ConnectTimeout=15 "$HOST" 'basename "$(readlink -f ~/ops-releases/current)"' 2>/dev/null) || stop "서버 접속 실패"
LIVE_SHA="${LIVE##*-}"
git -C "$BASE" fetch -q origin || stop "git fetch 실패"
if [ -z "$BRANCH" ]; then
  # 운영 커밋을 포함하고, 링크 미리보기 코드도 들어 있는 원격 브랜치 — 그중 운영 커밋이 맨 끝(HEAD)인 것을 우선
  CANDS=$(git -C "$BASE" branch -r --contains "$LIVE_SHA" 2>/dev/null | sed 's#^ *origin/##' | grep -v HEAD | while read -r b; do
    git -C "$BASE" merge-base --is-ancestor "$PREVIEW_SHA" "origin/$b" 2>/dev/null && echo "$b"; done)
  EXACT=$(for b in $CANDS; do [ "$(git -C "$BASE" rev-parse --short=7 "origin/$b")" = "${LIVE_SHA:0:7}" ] && echo "$b"; done)
  N=$(printf '%s\n' $EXACT | grep -c .)
  if [ "$N" -gt 1 ]; then
    # 여러 브랜치가 같은 커밋이면 서버 저장소(~/greyd-ops)가 지금 체크아웃한 브랜치를 쓴다 — deploy.sh가 그 브랜치를 당겨 빌드하므로
    SRV=$(ssh -i "$KEY" -o ConnectTimeout=15 "$HOST" 'git -C ~/greyd-ops branch --show-current' 2>/dev/null)
    echo "  서버 저장소 현재 브랜치: ${SRV:-알 수 없음}"
    for b in $EXACT; do [ "$b" = "$SRV" ] && EXACT="$b" && N=1; done
  fi
  if [ "$N" = 1 ]; then BRANCH="$EXACT"; else
    echo "  운영 $LIVE 를 포함하는 브랜치: $(echo $CANDS)"; echo "  그중 끝이 운영 커밋인 브랜치: $(echo $EXACT)"
    stop "배포 브랜치를 하나로 못 정함 — 위 두 줄을 Claude에 붙여주세요 (또는 BRANCH=브랜치명 bash <(curl …) 로 지정)"
  fi
fi
git -C "$BASE" merge-base --is-ancestor "$LIVE_SHA" "origin/$BRANCH" 2>/dev/null || stop "운영 릴리스($LIVE)가 $BRANCH 에 없음"
git -C "$BASE" merge-base --is-ancestor "$PREVIEW_SHA" "origin/$BRANCH" 2>/dev/null || stop "$BRANCH 에 링크 미리보기 코드가 없음"
ok "운영 $LIVE ⇒ 배포 브랜치 $BRANCH"

echo "2/6 작업 폴더 준비 ($FIX)"
if [ -d "$FIX" ]; then git -C "$FIX" fetch -q origin && git -C "$FIX" checkout -q "$BRANCH" && git -C "$FIX" merge -q --ff-only "origin/$BRANCH" || stop "작업 폴더 갱신 실패"
else git -C "$BASE" worktree add -q "$FIX" "$BRANCH" 2>/dev/null || git -C "$BASE" worktree add -q -B "$BRANCH" "$FIX" "origin/$BRANCH" || stop "worktree 생성 실패"; fi
cd "$FIX"
[ -e node_modules ] || ln -s "$BASE/node_modules" node_modules
ok "작업 폴더 $(git rev-parse --short HEAD)"

echo "3/6 코드 수정"
python3 - "$FILE" <<'PY' || stop "코드 수정 실패(파일 내용이 예상과 다름) — 이 메시지를 Claude에 붙여주세요"
import sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
if 'detectCurrency' in s:
    print('  이미 수정돼 있음'); sys.exit(0)
def rep(a, b):
    global s
    if a not in s: raise SystemExit('못 찾음: ' + a[:60])
    s = s.replace(a, b, 1)
rep("""  const ldImage = ld ? (Array.isArray(ld.image) ? ld.image[0] : ld.image?.url ?? ld.image) : null""",
"""  const pick = (v: any): string | null => (Array.isArray(v) ? pick(v[0]) : v && typeof v === 'object' ? v.url || v.contentUrl || null : v || null)
  const ldImage = ld ? pick(ld.image) : null
  const linkImage = /<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)/i.exec(html)?.[1]""")
rep("""  const image = abs(ldImage || meta['og:image'] || meta['twitter:image'], baseUrl)""",
"""  const rawImage = abs(ldImage || meta['og:image:secure_url'] || meta['og:image'] || meta['og:image:url'] || meta['twitter:image'] || meta['twitter:image:src'] || linkImage, baseUrl)
  const image = rawImage ? rawImage.replace(/^http:\\/\\//i, 'https://') : null""")
rep("""    currency: String(offer.priceCurrency || meta['product:price:currency'] || 'KRW').slice(0, 8),""",
"""    currency: detectCurrency(offer, meta, html, baseUrl), // 근거가 없으면 null — KRW로 넘겨짚지 않는다(해외몰 USD가 원화로 들어가던 문제)""")
rep("""export function parseProduct(html: string, baseUrl: string) {""",
"""// 통화: JSON-LD → 메타 → 원화 표기 → 한국 도메인·lang=ko → $ 표기. 근거가 없으면 null.
export function detectCurrency(offer: any, meta: Record<string, string>, html: string, baseUrl: string): string | null {
  const c = offer?.priceCurrency || meta['product:price:currency'] || meta['og:price:currency'] || meta['product:sale_price:currency']
  if (c && /^[A-Z]{3}$/i.test(String(c))) return String(c).toUpperCase()
  if (/₩|"KRW"|\\d\\s*원/.test(html)) return 'KRW'
  if (/\\.(kr|co\\.kr)$/i.test(new URL(baseUrl).hostname) || /<html[^>]+lang=["']ko/i.test(html)) return 'KRW'
  if (/\\$\\s?\\d/.test(html)) return 'USD'
  return null
}

export function parseProduct(html: string, baseUrl: string) {""")
open(p, 'w', encoding='utf-8').write(s)
print('  수정함')
PY
ok "코드 수정"

echo "4/6 테스트"
npx --no-install tsc --noEmit -p . >/tmp/ops-tsc.log 2>&1
if grep -q "productPreview" /tmp/ops-tsc.log; then grep "productPreview" /tmp/ops-tsc.log | head -10; stop "수정한 파일에 타입 오류 — 위 내용을 Claude에 붙여주세요"; fi
ok "타입 검사(수정 파일) 통과"
if grep -q '"vitest"' package.json; then R="npx --no-install vitest run tests/unit/productPreview.test.ts"
else R="npx --no-install tsx --test tests/unit/productPreview.test.ts"; fi
$R >/tmp/ops-test.log 2>&1 && ok "단위 테스트 통과" || { tail -30 /tmp/ops-test.log; stop "테스트 실패 — 위 내용을 Claude에 붙여주세요"; }

echo "5/6 커밋·푸시"
git add "$FILE"
if git diff --cached --quiet; then ok "바뀐 것 없음(이미 반영됨)"
else
  git commit -q -m "fix(preview): 통화를 KRW로 넘겨짚지 않음(detectCurrency) · 이미지 찾는 곳 확대(og:image:secure_url·JSON-LD ImageObject·image_src, http→https)" || stop "커밋 실패"
  git push -q origin "HEAD:$BRANCH" || stop "푸시 실패"
  ok "푸시 $(git rev-parse --short HEAD) → $BRANCH"
fi

echo "6/6 EC2 배포 (빌드 몇 분 걸려요)"
ssh -i "$KEY" -o ConnectTimeout=15 "$HOST" "bash ~/greyd-ops/deploy/ec2/deploy.sh $BRANCH" || stop "배포 실패 — 운영은 이전 릴리스 그대로예요. 위 내용을 Claude에 붙여주세요"
sleep 3
echo "확인: 해외몰 → USD, 쿠팡 → 거절"
curl -s "https://ops.greyd.app/api/public/product-preview?url=https://www.allbirds.com/products/mens-tree-runners" | python3 -c "import sys,json;p=json.load(sys.stdin).get('product',{});print('  ',p.get('name'),'|',p.get('retailPrice'),p.get('currency'),'| 이미지',bool(p.get('imageUrl')))"
curl -s "https://ops.greyd.app/api/public/product-preview?url=https://www.coupang.com/vp/products/1"; echo
