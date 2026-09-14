# Danh mục kênh IPC

> **Luật gốc**: `docs/01-architecture/ipc-communication.md` — quy ước đặt tên, envelope,
> `expectedUpdatedAt`, mã lỗi, luật viết Preload và Handler.
> File này chỉ chứa **danh mục kênh riêng của domain**.

> Mọi tên kênh ở đây phải có hằng số tương ứng trong `shared/channels.js`.
> **Cấm magic string** ở bất kỳ đâu khác.

Mọi payload và dữ liệu trả về dùng `camelCase`. Mọi kênh `*:update` **bắt buộc** nhận
`expectedUpdatedAt`. Mọi thao tác ghi thành công phát một sự kiện ở §3.

---

## 1. Nhóm kênh nghiệp vụ

### 1.0. Nhóm `dashboard:*` — Tổng quan

| Kênh                   | Payload vào | Dữ liệu trả về                                                                    | Ghi chú                                                |
| ---------------------- | ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `dashboard:getSummary` | —           | Tổng số giáo dân còn sống, hộ, giáo họ, phân bố và hai danh sách cảnh báo dữ liệu | Gom bằng truy vấn SQL, không truy vấn lặp theo từng hộ |

### 1.1. Nhóm `zone:*` — Giáo họ

| Kênh              | Payload vào                                    | Dữ liệu trả về                                     | Ghi chú                                                      |
| ----------------- | ---------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `zone:list`       | `{ search?, page, pageSize, sortBy, sortDir }` | `Zone[]` kèm `familyCount`, `personCount` + `meta` | Đếm bằng `LEFT JOIN` gộp, **không** truy vấn trong vòng lặp  |
| `zone:getById`    | `{ id }`                                       | `Zone`                                             | `NOT_FOUND` nếu không tồn tại                                |
| `zone:create`     | `{ name, holyName?, note? }`                   | `Zone` vừa tạo                                     | Trùng `name` → `CONFLICT`                                    |
| `zone:update`     | `{ id, expectedUpdatedAt, patch }`             | `Zone` sau cập nhật                                | **Bắt buộc** `expectedUpdatedAt`                             |
| `zone:remove`     | `{ id }`                                       | `{ id }`                                           | Còn hộ → `FOREIGN_KEY_VIOLATION` (§3 `database-schema.md`)   |
| `zone:bulkRemove` | `{ ids }`                                      | `{ count }`                                        | Xoá mềm nhiều giáo họ trong một transaction; chặn khi còn hộ |

### 1.2. Nhóm `family:*` — Gia đình / hộ

| Kênh                | Payload vào                                             | Dữ liệu trả về                                    | Ghi chú                                                 |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| `family:list`       | `{ zoneId?, search?, page, pageSize, sortBy, sortDir }` | `Family[]` kèm `memberCount`, `zoneName` + `meta` | Lọc theo giáo họ là truy vấn nóng nhất                  |
| `family:getById`    | `{ id }`                                                | `Family` kèm danh sách thành viên hiện hành       | `NOT_FOUND` nếu không tồn tại                           |
| `family:create`     | `{ zoneId, name, address?, note? }`                     | `Family` vừa tạo                                  | `zoneId` không tồn tại → `FOREIGN_KEY_VIOLATION`        |
| `family:update`     | `{ id, expectedUpdatedAt, patch }`                      | `Family` sau cập nhật                             | **Bắt buộc** `expectedUpdatedAt`                        |
| `family:remove`     | `{ id }`                                                | `{ id }`                                          | Còn thành viên hiện hành → `CONFLICT` kèm số thành viên |
| `family:bulkMove`   | `{ ids, zoneId }`                                       | `{ count, zoneId }`                               | Chuyển nhiều hộ sang một giáo họ trong một transaction  |
| `family:bulkRemove` | `{ ids }`                                               | `{ count }`                                       | Xoá mềm nhiều hộ; chặn khi bất kỳ hộ nào còn thành viên |

### 1.3. Nhóm `person:*` — Giáo dân

| Kênh                | Payload vào                                                                                                                                                         | Dữ liệu trả về                                   | Ghi chú                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `person:list`       | `{ zoneId?, familyId?, gender?, isAlive?, search?, page, pageSize, sortBy, sortDir }`                                                                               | `Person[]` kèm `familyName`, `zoneName` + `meta` | `search` so khớp trên `full_name_ascii`                                |
| `person:getById`    | `{ id }`                                                                                                                                                            | `Person` kèm hộ hiện hành + lịch sử hộ           | `NOT_FOUND` nếu không tồn tại                                          |
| `person:create`     | `{ fullName, givenName?, holyName?, gender?, birthDate?, baptismDate?, firstCommunionDate?, confirmationDate?, marriageDate?, deathDate?, phone?, note?, family? }` | `Person` vừa tạo                                 | Xem ghi chú dưới bảng                                                  |
| `person:update`     | `{ id, expectedUpdatedAt, patch }`                                                                                                                                  | `Person` sau cập nhật                            | **Bắt buộc** `expectedUpdatedAt`                                       |
| `person:remove`     | `{ id }`                                                                                                                                                            | `{ id }`                                         | Xoá mềm người **và** dòng `family_members` hiện hành, cùng transaction |
| `person:bulkMove`   | `{ ids, familyId, relationship, moveDate }`                                                                                                                         | `{ count, familyId }`                            | Chuyển nhiều người sang một hộ trong một transaction                   |
| `person:bulkRemove` | `{ ids }`                                                                                                                                                           | `{ count }`                                      | Xoá mềm nhiều giáo dân cùng các thành viên hộ hiện hành                |

> `person:create` và `person:update` trả thêm `meta.warnings` khi thứ tự ngày bí tích bất
> thường (`baptism ≤ firstCommunion ≤ confirmation`) — **cảnh báo, không chặn**.
>
> `person:create` nhận thêm `family?: { familyId, relationship, fromDate }` — tuỳ chọn, cho phép
> tạo người và gán vào hộ trong **một transaction**. Bỏ trống thì tạo người chưa thuộc hộ nào.
>
> Renderer **không** gửi `id`, `fullNameAscii`, `createdAt`, `updatedAt` — Service sinh.

### 1.4. Nhóm `family-member:*` — Thành viên hộ

| Kênh                   | Payload vào                                        | Dữ liệu trả về              | Ghi chú                                                                               |
| ---------------------- | -------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------- |
| `family-member:add`    | `{ familyId, personId, relationship, fromDate }`   | `FamilyMember`              | Chặn nếu người đã có hộ hiện hành → `CONFLICT`                                        |
| `family-member:update` | `{ id, expectedUpdatedAt, patch }`                 | `FamilyMember` sau cập nhật | Đổi `relationship` hoặc `note`. **Bắt buộc** `expectedUpdatedAt`                      |
| `family-member:move`   | `{ personId, toFamilyId, relationship, moveDate }` | `{ closed, opened }`        | **Nghiệp vụ riêng**: đóng dòng cũ (`to_date = moveDate`) + mở dòng mới, 1 transaction |
| `family-member:remove` | `{ id }`                                           | `{ id }`                    | Xoá mềm. Nếu là `head` → hộ còn lại không có chủ hộ, UI cảnh báo                      |

> `family-member:move` không theo mẫu CRUD chuẩn vì nó là **một** thao tác nghiệp vụ chạm hai dòng.
> Tách thành hai lời gọi `remove` + `add` sẽ để lại khoảng thời gian người không thuộc hộ nào.

### 1.5. Nhóm `report:*` — Xuất danh sách

| Kênh               | Payload vào                                                      | Dữ liệu trả về                                      | Ghi chú                                                    |
| ------------------ | ---------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- |
| `report:exportCsv` | `{ report: 'persons' \| 'families' \| 'familyMembers', filter }` | `{ canceled }` hoặc `{ canceled: false, rowCount }` | Main tự mở hộp thoại lưu và ghi CSV UTF-8 BOM theo bộ lọc. |

`persons` nhận `zoneId`, `familyId`, `gender`, `isAlive`, `search`; `families` nhận `zoneId`,
`search`; `familyMembers` bắt buộc `familyId`. Đường dẫn tệp không nhận từ Renderer.

### 1.6. Nhóm `search:*` — Tìm toàn văn

| Kênh           | Payload vào | Dữ liệu trả về                                             | Ghi chú                                           |
| -------------- | ----------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `search:query` | `{ query }` | Tối đa 50 kết quả giáo dân và gia đình, có `type`, `route` | FTS5, tìm không dấu và không phân biệt hoa thường |

### 1.7. Nhóm `trash:*` — Thùng rác

| Kênh               | Payload vào    | Dữ liệu trả về            | Ghi chú                                       |
| ------------------ | -------------- | ------------------------- | --------------------------------------------- |
| `trash:list`       | —              | Tối đa 200 bản ghi đã xoá | Gộp giáo họ, gia đình và giáo dân             |
| `trash:restore`    | `{ type, id }` | `{ type, id, restored }`  | Hộ cần giáo họ nguồn còn tồn tại              |
| `trash:hardRemove` | `{ type, id }` | `{ type, id, removed }`   | Chỉ áp dụng cho bản ghi đã xoá mềm            |
| `trash:empty`      | —              | `{ removed }`             | Xoá vĩnh viễn toàn bộ bản ghi trong thùng rác |

---

## 2. Nhóm kênh hạ tầng — giống nhau ở mọi dự án

`app:*` và `setting:*` đã đặc tả sẵn ở `docs/01-architecture/ipc-communication.md` §5.
Không chép lại ở đây.

Khoá `settings` riêng của dự án (gồm `general.parishName`) liệt kê ở
[`database-schema.md`](./database-schema.md) §5.

---

## 2b. Nhóm `backup:*` — xuất / nhập toàn bộ dữ liệu

> Riêng của dự án này: app dùng chung cho 2–3 người quản lý giáo xứ nên cần mang dữ liệu
> qua lại. Kéo từ Phase 6 lên Phase 2 theo yêu cầu người dùng (P16).

| Kênh              | Payload vào                       | Dữ liệu trả về                                                                                         | Ghi chú                                                                  |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `backup:export`   | —                                 | `{ canceled }` hoặc `{ canceled: false, filePath, sizeBytes, exportedAt }`                             | Ghi bằng **API backup của SQLite**, an toàn khi DB đang mở               |
| `backup:import`   | —                                 | `{ canceled }` hoặc `{ canceled: false, restarting: true, safetyBackup, schemaVersion, recordCounts }` | **Thay trọn dữ liệu.** App tự khởi động lại sau ~0,5 giây                |
| `backup:clearAll` | `{ confirmation: 'XÓA DỮ LIỆU' }` | `{ zones, families, persons, members, safetyBackup }`                                                  | Backup trước, sau đó xóa toàn bộ dữ liệu nghiệp vụ trong một transaction |

**Cả hai kênh không nhận tham số.** Đường dẫn file do hộp thoại ở Main quyết định — nhận
đường dẫn từ Renderer nghĩa là DevTools ghi đè được bất kỳ file nào trên máy.

Bốn lớp chặn trước khi `backup:import` ghi đè bất cứ thứ gì:

| #   | Kiểm tra                                              | Không đạt thì                                                    |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | File mở được bằng SQLite và `integrity_check = ok`    | `VALIDATION_ERROR`                                               |
| 2   | Có đủ 5 bảng của ứng dụng                             | `VALIDATION_ERROR` kèm `details.missing`                         |
| 3   | `user_version` **không lớn hơn** bản build đang chạy  | `VALIDATION_ERROR` — chặn hạ cấp, xem `storage-strategy.md` §5.4 |
| 4   | Hộp thoại xác nhận nói rõ file chứa bao nhiêu bản ghi | Người dùng bấm Huỷ → `{ canceled: true }`                        |

Ở bước 4, hộp thoại không chỉ nói file mới có gì mà **đối chiếu hai bên** — mỗi người một
máy nên hai bản dữ liệu luôn lệch nhau (P18):

| Số liệu                                      | Nghĩa là                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `divergence.current` / `divergence.incoming` | Số giáo họ / hộ / giáo dân của mỗi bên                                       |
| `divergence.onlyInCurrent`                   | Bản ghi **chỉ có trên máy này** — nhập xong là mất hẳn                       |
| `divergence.newerInCurrent`                  | Bản ghi cả hai bên đều có nhưng máy này sửa sau — nhập xong bị lùi về bản cũ |
| `divergence.currentIsNewer`                  | Máy này có thay đổi mới hơn file sắp nhập                                    |

Đối chiếu chạy trên kết nối **chỉ đọc** (mở file nguồn readonly rồi `ATTACH` file hiện tại),
không ghi vào bên nào. Kết quả cũng trả về Renderer trong `divergence` để giao diện hiển thị lại.

Đạt cả bốn thì dữ liệu **hiện tại** được sao lưu vào `backups/` trước, rồi mới thay file.
Bản sao đó là đường lui duy nhất, nên đường dẫn của nó trả về trong `safetyBackup`.

---

## 3. Nhóm sự kiện (Main → Renderer)

| Kênh                                   | Payload                                               | Khi nào phát                                                 |
| -------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `event:zone-changed`                   | `{ action, id }`                                      | Sau mọi thao tác ghi lên `zones`                             |
| `event:family-changed`                 | `{ action, id, zoneId? }`                             | Sau mọi thao tác ghi lên `families`                          |
| `event:person-changed`                 | `{ action, id, familyId? }`                           | Sau mọi thao tác ghi lên `persons` **hoặc** `family_members` |
| `event:person-changed` (khi chuyển hộ) | `{ action: 'moved', id, familyId, previousFamilyId }` | `family-member:move` chạm hai hộ nên mang thêm hộ cũ (P15)   |

Ba sự kiện hạ tầng giữ nguyên theo template: `event:import-progress`, `event:update-status`,
`event:app-error`.

> `family_members` không có sự kiện riêng — mọi thay đổi thành viên hộ phát
> `event:person-changed` kèm `familyId`, vì màn hình nào quan tâm tới thành viên cũng
> đang hiển thị người. Event chỉ dùng để **invalidate**, không ghi đè cache
> (`docs/03-frontend/state-management.md` §3).

---

## 4. Nhóm `dev:*` — tạm thời, chỉ có ở bản dev

> Thêm ở **Phase 1** để kiểm chứng Definition of Done. **Xoá ở Phase 2** khi đã có kênh
> ghi thật (`zone:create`) để kiểm chứng thay.

Handler chỉ được đăng ký khi `!app.isPackaged` — bản đóng gói không có nhóm này.

| Kênh          | Payload vào | Dữ liệu trả về    | Kiểm chứng điều gì                                                      |
| ------------- | ----------- | ----------------- | ----------------------------------------------------------------------- |
| `dev:throw`   | `{ kind }`  | _(luôn ném lỗi)_  | `kind: 'app'` → `NOT_FOUND`; `kind: 'programming'` → `UNKNOWN_ERROR`    |
| `dev:emit`    | —           | `{ pingedAt }`    | Phát `event:dev-pinged`, xác nhận listener và hàm huỷ đăng ký chạy đúng |
| `dev:missing` | —           | _(không handler)_ | Gọi kênh không tồn tại → bị từ chối ngay, không treo vô hạn             |

Sự kiện kèm theo: `event:dev-pinged` với payload `{ pingedAt }`.

## Phase 3 — Cài đặt giao diện

| Kênh                    | Payload          | Kết quả                   | Ghi chú                                                                     |
| ----------------------- | ---------------- | ------------------------- | --------------------------------------------------------------------------- |
| `setting:getAll`        | không có         | `Record<string, unknown>` | Đọc các khoá có sẵn trong bảng settings                                     |
| `setting:set`           | `{ key, value }` | `{ key, value }`          | Phase 3 chỉ cho ghi `ui.theme`, `ui.density`, `general.language` (chỉ `vi`) |
| `event:setting-changed` | `{ key }`        | sự kiện                   | Sau khi ghi; Renderer invalidate `settingKeys.all`                          |

Settings là ngoại lệ key-value đã có trong schema: không có UUID, soft delete hay phân trang.
Không thay đổi migration. Dữ liệu nghiệp vụ ở Phase 3 vẫn là minh hoạ; cài đặt và xuất/nhập
file dùng IPC thật để giữ chức năng đã có và đáp ứng yêu cầu nhớ theme.
