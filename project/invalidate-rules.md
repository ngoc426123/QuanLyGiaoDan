# Quy tắc invalidate cache

> **Luật gốc**: `docs/03-frontend/state-management.md` §3 — nguyên tắc, cơ chế, cách xử lý event.
> File này chỉ chứa **bảng tra cứu riêng của domain**.

> Sai bảng này → UI hiển thị dữ liệu cũ mà không ai phát hiện ngay.
> Nguyên tắc: **invalidate rộng còn hơn thiếu.** Truy vấn lại SQLite cục bộ tốn vài mili-giây;
> hiển thị sai dữ liệu tốn niềm tin của người dùng.

---

## Bảng quy tắc

| Hành động                                                                | Invalidate những key nào                                                                                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Tạo giáo dân (`person:create`)                                           | `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` _(đổi số đếm)_                                                                       |
| Sửa giáo dân (`person:update`)                                           | `personKeys.lists` + `personKeys.detail(id)`                                                                                                    |
| Xoá giáo dân (`person:remove`)                                           | `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` + **`removeQueries`** `personKeys.detail(id)`                                        |
| Tạo / sửa / xoá hộ (`family:create` · `family:update` · `family:remove`) | `familyKeys.all` + `personKeys.lists` + `zoneKeys.lists`                                                                                        |
| Tạo / sửa / xoá giáo họ (`zone:create` · `zone:update` · `zone:remove`)  | `zoneKeys.all` + `familyKeys.lists`                                                                                                             |
| Thêm thành viên vào hộ (`family-member:add`)                             | `familyKeys.detail(familyId)` + `personKeys.detail(personId)` + `personKeys.lists` + `familyKeys.lists`                                         |
| Sửa thành viên hộ (`family-member:update`)                               | `familyKeys.detail(familyId)` + `personKeys.detail(personId)`                                                                                   |
| Gỡ thành viên khỏi hộ (`family-member:remove`)                           | `familyKeys.detail(familyId)` + `personKeys.detail(personId)` + `personKeys.lists` + `familyKeys.lists`                                         |
| **Chuyển hộ** (`family-member:move`)                                     | `familyKeys.detail(hộ cũ)` + `familyKeys.detail(hộ mới)` + `personKeys.detail(id)` + `personKeys.lists` + `familyKeys.lists` + `zoneKeys.lists` |
| Đổi cài đặt (`setting:*`)                                                | `settingKeys.all`                                                                                                                               |
| Thay đổi giáo họ / hộ / giáo dân / thành viên                            | `dashboardKeys.all` _(số liệu và cảnh báo tổng quan)_                                                                                           |

---

## Ghi chú riêng của domain

**Chuyển hộ chạm nhiều key nhất** — sáu key, vì một thao tác sửa hai dòng `family_members`
thuộc hai hộ, và nếu hai hộ khác giáo họ thì số đếm của cả hai giáo họ đều đổi.
Đây là chỗ dễ thiếu nhất; khi phân vân, invalidate thêm `zoneKeys.lists`.

**Vì sao thao tác trên người lại chạm key của hộ và giáo họ**: `family:list` trả kèm
`memberCount`, `zone:list` trả kèm `familyCount` / `personCount`. Số đếm nằm trong payload
của danh sách khác nên mọi thay đổi số người đều làm hai danh sách kia cũ đi.

**`removeQueries` thay vì `invalidateQueries` khi xoá**: bản ghi không còn, refetch sẽ trả
`NOT_FOUND`. Xoá hẳn khỏi cache thay vì để query lỗi.

**Event từ Main chỉ dùng để invalidate**, không ghi đè cache
(`docs/03-frontend/state-management.md` §3). Ánh xạ event → key:

| Event                   | Invalidate                                               |
| ----------------------- | -------------------------------------------------------- |
| `event:zone-changed`    | `zoneKeys.all` + `familyKeys.lists`                      |
| `event:family-changed`  | `familyKeys.all` + `personKeys.lists` + `zoneKeys.lists` |
| `event:person-changed`  | `personKeys.all` + `familyKeys.lists` + `zoneKeys.lists` |
| `event:setting-changed` | `settingKeys.all`                                        |
