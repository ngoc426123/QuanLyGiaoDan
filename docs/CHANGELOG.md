# Nhật ký thay đổi của template

> Mỗi lần sửa một luật trong `docs/`, thêm một dòng ở đây và tăng `TEMPLATE_VERSION`.
> Dự án đã copy template biết mình tụt hậu bao nhiêu bằng cách so hai file này.

Đánh số theo [SemVer](https://semver.org/lang/vi/) với nghĩa riêng:

| Phần | Tăng khi |
|---|---|
| **MAJOR** | Đổi một quyết định nền (D01–D18) hoặc đổi cấu trúc thư mục — dự án cũ phải sửa code |
| **MINOR** | Thêm luật mới hoặc thêm file — dự án cũ nên áp dụng nhưng không gấp |
| **PATCH** | Sửa lỗi diễn đạt, thêm ví dụ, làm rõ — không ảnh hưởng code |

---

## 1.8.0

- `03-frontend/ui-structure.md` §5.1a: bổ sung danh mục token dùng chung cho bố cục,
  điều khiển, danh sách, viền/focus, chiều cao dòng và màu bổ trợ.
- Quy định mật độ vẫn bảo đảm vùng bấm tối thiểu; kiểm tương phản chữ trên nền nhấn
  ở cả hai theme và hover; phân biệt giá trị động của danh sách ảo với design token.

Dự án cũ nên áp dụng khi bổ sung App Shell hoặc UI primitives. Giá trị thiết kế cụ thể
vẫn thuộc từng dự án, không đưa palette hay kích thước nghiệp vụ vào template.

---

## 1.7.0

Một phiên làm việc tiêu **653k token** chỉ riêng phần hội thoại, trong đó phần lớn không phải
do trao đổi mà do **kết quả công cụ** dội vào: mỗi lần chạy `prettier --write` sau một lần sửa
là công cụ phát hiện file đổi trên đĩa rồi nạp lại **nguyên văn** file đó. Vài file 200 dòng bị
nạp lại ba, bốn lần. Cộng thêm thói quen đọc trọn tài liệu 300 dòng khi chỉ cần một mục.

- `00-meta/agent-rules.md` §4.2 (mới): **năm luật tiết kiệm ngữ cảnh** — format một lần ở cuối,
  đọc đúng mục, không đọc lại file vừa ghi, lọc output ngay trong lệnh, và **một phase một phiên**
  (agent chủ động nhắc `/clear`, tự nhắc lại khi ngữ cảnh vượt 60%)
- §4.2 có kèm rào chắn: đây là tiết kiệm **chi phí**, không phải tiết kiệm **công sức** — cấm lấy
  làm cớ bỏ bước kiểm chứng ở §4.1 hay bỏ đọc tài liệu bắt buộc. Thiếu rào này thì luật mới sẽ
  trở thành cái cớ hoàn hảo để phá luật vừa thêm ở 1.4.0
- `CLAUDE.template.md`: thêm dòng rút gọn vào "Quy tắc làm việc"

Dự án cũ nên áp dụng: không đụng tới code, chỉ đổi cách agent làm việc.

---

## 1.6.0

Danh sách người sắp xếp sai bảng chữ cái mà **không có lỗi nào** để lần ra: SQLite so chuỗi
theo byte UTF-8, nên `ORDER BY` trên cột có dấu xếp "Bé" trước "Ánh". Template đã có luật
chuẩn hoá NFC nhưng chưa nói gì về collation, nên cái bẫy này lặp lại ở mọi dự án.

- `02-backend-data/database-conventions.md` §1.2c (mới): **cột chữ cần sắp xếp hoặc tìm kiếm
  phải có cột phụ `<cột>_ascii`**, do Service sinh lại mỗi lần ghi. Kèm ba chi tiết hay bị
  bỏ sót: `đ`/`Đ` không phân rã bằng NFD, từ khoá tìm kiếm phải đi qua đúng hàm bỏ dấu đó,
  và cột gốc `NULL` thì cột phụ cũng `NULL`
- `04-guidelines/coding-standards-backend.md` §3.1: whitelist `sortBy` trỏ vào cột phụ,
  không trỏ vào cột gốc
- `02-backend-data/data-services.md` §3.3: thêm bước 6 vào danh sách chuẩn hoá trước khi ghi

Dự án cũ nên áp dụng **trước khi phát hành**: thêm cột phụ sau khi đã có dữ liệu thật nghĩa là
migration `ALTER TABLE` kèm backfill, trong khi lúc thiết kế bảng nó chỉ là một dòng.

---

## 1.5.0

Luật "native module phải rebuild theo ABI của Electron" đã **lạc hậu** và làm hỏng `npm install`
trên máy không có toolchain C++. Phát hiện khi bắt đầu Phase 2 của một dự án thật: `better-sqlite3`
v13.0.3 nạp thẳng dưới Electron 44 (ABI 149) mà **không** cần build lại — nó phát hành binary theo
**Node-API**, kèm sẵn `prebuilds/<os>-<arch>.node` trong gói npm. Nhưng
`electron-builder install-app-deps` không nhận biết điều đó: thấy `binding.gyp` là gọi
`node-gyp rebuild`, rồi chết với *Could not find any Python installation*.

Hệ quả của luật cũ: `postinstall` bắt buộc → `npm install` thoát lỗi, và người mới phải cài
Python 3 + Visual Studio Build Tools (~5–7GB) để biên dịch một thứ **không cần biên dịch**.

- `01-architecture/project-structure.md` §6.1 (mới): **cách xác định native module có phải
  rebuild không** — kiểm tra bằng `ls node_modules/<gói>/prebuilds`, không đoán. Có `prebuilds/`
  → Node-API, không rebuild. Chỉ có `binding.gyp` → NAN, phải rebuild + cần toolchain
- §6: thêm khoá `npmRebuild: false` vào bảng cấu hình then chốt; `postinstall` chuyển thành
  **có điều kiện**. `asarUnpack: "**/*.node"` **giữ nguyên** — vẫn bắt buộc
- §5 và `04-guidelines/coding-standards.md` §2.1: bước `install-app-deps` trong luồng build và
  trong quy trình nâng Electron trở thành có điều kiện
- §9: hai dòng khắc phục sự cố nói rõ phải đối chiếu §6.1 **trước** khi đi cài toolchain
- `02-backend-data/storage-strategy.md` §1: đính chính dòng "cần biên dịch native" trong bảng
  so sánh — không còn đúng từ `better-sqlite3` v12
- `04-guidelines/phase-framework.md` 2.1, `04-guidelines/recipes.md` Công thức 6 bước 7,
  `05-git/worktree.md`: cập nhật theo
- `CLAUDE.template.md`: bảng "Cấu hình bắt buộc" đổi theo

Dự án cũ **nên áp dụng sớm**: nếu `npm install` đang fail ở bước native module, đây là cách sửa.
Kiểm tra `prebuilds/` trước khi cài bất kỳ toolchain nào.

---

## 1.4.0

Một mục Definition of Done của Phase 1 được tick bằng **suy luận** thay vì bằng chạy thử, và
lọt qua vòng báo cáo: lỗi ném ra từ `app.whenReady().then(...)` chỉ thành
`UnhandledPromiseRejectionWarning`, app sống tiếp mà **không có cửa sổ nào** — đúng triệu chứng
mà mục DoD đó sinh ra để chặn. Người dùng phải nhắc "rà soát lại" mới tìm ra.

Nguyên nhân không nằm ở việc thiếu luật — mục 4 ("Định nghĩa XONG") đã có sẵn. Nó nằm ở chỗ
checklist được tick **trong lúc viết**, bởi chính người đang tin là mình vừa làm đúng, và không
có luật nào đòi **bằng chứng**.

- `00-meta/agent-rules.md` §4.1 (mới): **bước tự rà soát bắt buộc** trước khi báo xong một tính
  năng hoặc một phase — một lượt đi riêng, đối chiếu từng mục kế hoạch với code thật, đọc lại
  toàn văn file vừa đụng, ba câu tự vấn, và báo cáo phải có mục "Đã rà soát — phát hiện gì"
- `00-meta/agent-rules.md` §4.1: định nghĩa **"bằng chứng"** kèm bảng đối chiếu — tick DoD phải
  có lệnh đã chạy kèm output, chạy trên **chính đường đi của ứng dụng**. Kiểm chứng một cơ chế
  bằng đoạn code rời **không tính**, vì bug thường nằm ở cách app gọi cơ chế đó
- `00-meta/agent-rules.md` §9: thêm mục cấm số 10 — báo "xong" khi chưa rà soát
- `CLAUDE.template.md`: thêm dòng rút gọn vào "Quy tắc làm việc", nối vào định nghĩa "Xong"

Dự án cũ nên áp dụng: chép §4.1 và dòng rút gọn trong `CLAUDE.md`. Không đụng tới code.

---

## 1.3.0

Bảy cạm bẫy phát hiện khi chạy Phase 0 thật lần đầu. Bốn trong số đó gây lỗi **im lặng** —
cửa sổ trắng hoặc treo mà terminal không báo gì — nên đưa thẳng vào docs thay vì để mỗi dự án
tự vấp lại.

- `01-architecture/project-structure.md` §8: CSP **dev** bắt buộc có `script-src ... 'unsafe-inline'`.
  `@vitejs/plugin-react` chèn preamble React Refresh dạng inline script; chặn nó thì `main.jsx`
  không chạy và **cửa sổ trắng trơn, terminal im lặng**. Production giữ nguyên nghiêm ngặt
- §6: **preload bắt buộc là CommonJS** — `sandbox: true` không nạp được preload ESM. Với
  `"type": "module"` thì đuôi phải là `.cjs`. Kèm cách ép `electron-vite` xuất phẳng ra
  `out/main.js` + `out/preload.cjs`
- §4: `electron-vite dev` phải có cờ **`--watch`**, nếu không sửa file Main sẽ không restart —
  hụt một mục Definition of Done của chính Phase 0
- §4: **ghim `server.host: '127.0.0.1'`**, đừng dùng `localhost`. Vite có thể chỉ bind `[::1]`
  trong khi `wait-on` chờ IPv4 → `npm run dev` treo vĩnh viễn không báo lỗi
- §5: cảnh báo `renderer config is missing` của `electron-vite build` là **đúng thiết kế**
- §9: bảng khắc phục môi trường Windows, thêm `Error: Electron uninstall` (npm bỏ qua
  postinstall của gói `electron`) và `NODE_MODULE_VERSION mismatch`
- `04-guidelines/phase-framework.md` 0.9 + `coding-standards.md` §7: gỡ mâu thuẫn nội bộ —
  ESLint là **một bộ cấu hình duy nhất ở gốc repo**, không phải mỗi package một bộ, vì
  `shared/` không thuộc package nào

Dự án cũ nên áp dụng nhưng không gấp: chỉ dự án nào đang dựng Phase 0 hoặc gặp đúng triệu
chứng trên mới cần đọc lại.

---

## 1.2.0

Chỉ cần copy `docs/`, không cần thêm gì ở gốc repo.

Cơ chế: luật nhận diện đặt ở `~/.claude/CLAUDE.md` (cấu hình toàn cục của máy) — file này
**được tự nạp ở mọi dự án**. Luật kiểm tra "gốc không có CLAUDE.md + có docs/bootstrap/INIT.md"
rồi chạy INIT. Hẹp, không bắn nhầm sang dự án khác.

- `README.md` §4 tách hai cách: A = luật toàn cục (copy mỗi `docs/`), B = repo tự chứa (copy thêm 1 file)
- `bootstrap/INIT.md` Bước 0 viết lại: xử lý được trường hợp gốc **chỉ có `docs/`**, tự lắp `project/` ra gốc, không cần bản mồi
- `init.sh` / `init.ps1` giữ nguyên, dùng cho cách B và cho việc dựng template repo

---

## 1.1.1

Sửa lỗi trong hướng dẫn khởi tạo ở `README.md` §4.

Bản 1.1.0 bảo "copy `docs/` rồi chạy script" — sai, vì giữa hai bước đó repo chưa có
`CLAUDE.md` ở gốc, agent mở lên không nạp gì và không biết `docs/` là gì. Người dùng cũng
không có gì nhắc để nhớ chạy script.

- §4.0 nêu thẳng luật nền: chỉ `CLAUDE.md` ở **gốc repo** được tự nạp
- Luồng chuẩn đổi thành **clone cả template repo**, không phải copy riêng `docs/`
- Template repo có `CLAUDE.md` + `.claude/` + `project/` sẵn ở gốc → dự án mới không cần chạy script
- `init.sh` / `init.ps1` giữ lại, nhưng chỉ còn hai công dụng: dựng template repo lần đầu, và lắp template vào một repo đã có sẵn

---

## 1.1.0

Thêm cơ chế khởi tạo — trước đó template là thư mục trơ, không có gì dẫn agent vào quy trình.

- `bootstrap/CLAUDE.md` — bản mồi, là file duy nhất Claude Code tự nạp. Chặn viết code khi chưa khởi tạo
- `bootstrap/INIT.md` — quy trình phỏng vấn 7 bước: nhận diện dự án → khai thác domain → điền `project/` → sinh `CLAUDE.md` thật
- `bootstrap/project/` — 8 file khung trắng
- `bootstrap/init.ps1` + `init.sh` — lắp 3 thứ trên vào đúng chỗ
- `bootstrap/init-project.md` — lối tắt `/init-project`
- `README.md` §4 viết lại theo luồng mới

---

## 1.0.0

Bản đầu tiên. Tách ra từ tài liệu của một dự án Electron + SQLite đang chạy thật.

- `docs/` thành template thuần, không còn nghiệp vụ
- Nghiệp vụ chuyển sang `project/`
- `glossary.md` → `naming-conventions.md` (bỏ §2 thuật ngữ nghiệp vụ)
- `decisions.md` → `decisions-baseline.md` (D01–D18 thành mặc định kế thừa được)
- `database-schema.md` → `database-conventions.md` (bỏ ERD và định nghĩa bảng)
- `roadmap.md` → `phase-framework.md` (danh sách việc theo domain chuyển sang `project/`)
- `ipc-communication.md` §5 chỉ còn kênh hạ tầng
- `ui-structure.md` §3 chỉ còn 5 trạng thái bắt buộc
- `state-management.md` §3.1 chỉ còn ba loại quan hệ hay bị bỏ sót
- Thêm `examples/sample-domain.md`, `CLAUDE.template.md`, `TEMPLATE_VERSION`, file này
