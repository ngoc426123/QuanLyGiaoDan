#!/usr/bin/env bash
# Lắp template vào một repo mới. Chạy từ gốc repo, SAU khi đã copy docs/ vào.
#   bash docs/bootstrap/init.sh
set -euo pipefail

B="docs/bootstrap"

if [ ! -d "$B" ]; then
  echo "Không thấy $B — hãy chạy lệnh này từ GỐC repo, sau khi đã copy docs/ vào." >&2
  exit 1
fi

if [ -f CLAUDE.md ] && ! head -1 CLAUDE.md | grep -q 'CHƯA KHỞI TẠO'; then
  echo "CLAUDE.md đã tồn tại và không phải bản mồi — có vẻ repo đã khởi tạo rồi." >&2
  echo "Nếu chắc chắn muốn làm lại, xoá CLAUDE.md rồi chạy lại." >&2
  exit 1
fi

cp "$B/CLAUDE.md" CLAUDE.md
echo "  + CLAUDE.md (bản mồi)"

if [ -d project ]; then
  echo "  . project/ đã có — bỏ qua"
else
  cp -r "$B/project" project
  echo "  + project/ ($(ls project | wc -l) file khung)"
fi

mkdir -p .claude/commands
cp "$B/init-project.md" .claude/commands/init-project.md
echo "  + .claude/commands/init-project.md"

cat <<'MSG'

Xong. Mở Claude Code trong thư mục này.
CLAUDE.md sẽ được tự nạp và chỉ agent chạy docs/bootstrap/INIT.md.

Hoặc gõ thẳng:  /init-project
MSG
