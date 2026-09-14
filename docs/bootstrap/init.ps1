# Lắp template vào một repo mới. Chạy từ gốc repo, SAU khi đã copy docs/ vào.
#   pwsh docs/bootstrap/init.ps1
$ErrorActionPreference = 'Stop'
$B = 'docs/bootstrap'

if (-not (Test-Path $B)) {
  Write-Error "Không thấy $B — hãy chạy lệnh này từ GỐC repo, sau khi đã copy docs/ vào."
}

if ((Test-Path 'CLAUDE.md') -and -not ((Get-Content 'CLAUDE.md' -TotalCount 1) -match 'CHƯA KHỞI TẠO')) {
  Write-Error "CLAUDE.md đã tồn tại và không phải bản mồi — có vẻ repo đã khởi tạo rồi. Nếu chắc chắn muốn làm lại, xoá CLAUDE.md rồi chạy lại."
}

Copy-Item "$B/CLAUDE.md" 'CLAUDE.md' -Force
Write-Host '  + CLAUDE.md (bản mồi)'

if (Test-Path 'project') {
  Write-Host '  . project/ đã có — bỏ qua'
} else {
  Copy-Item "$B/project" 'project' -Recurse
  $n = (Get-ChildItem 'project').Count
  Write-Host "  + project/ ($n file khung)"
}

New-Item -ItemType Directory -Force -Path '.claude/commands' | Out-Null
Copy-Item "$B/init-project.md" '.claude/commands/init-project.md' -Force
Write-Host '  + .claude/commands/init-project.md'

Write-Host ''
Write-Host 'Xong. Mở Claude Code trong thư mục này.'
Write-Host 'CLAUDE.md sẽ được tự nạp và chỉ agent chạy docs/bootstrap/INIT.md.'
Write-Host ''
Write-Host 'Hoặc gõ thẳng:  /init-project'
