# Thuật ngữ nghiệp vụ

> **Luật gốc**: `docs/00-meta/naming-conventions.md` — quy ước ngôn ngữ, thuật ngữ kỹ thuật,
> cách viết chuỗi tiếng Việt, danh sách viết tắt được phép.
> File này chỉ chứa **từ vựng nghiệp vụ riêng của domain**.

> **Luật**: Một khái niệm — một tên. Trước khi đặt tên mới cho bất cứ thứ gì, tra ở đây.
> Thêm khái niệm nghiệp vụ mới → bổ sung vào bảng dưới **ngay trong lần thay đổi đó**.

---

## 1. Bảng thuật ngữ

Cột **Không dùng** quan trọng ngang cột định danh — nó chặn việc mỗi phiên làm việc đặt một tên khác nhau.

| Khái niệm            | Định danh code       | Hiển thị trên UI       | **Không dùng**                        |
| -------------------- | -------------------- | ---------------------- | ------------------------------------- |
| Giáo dân             | `person`             | Giáo dân               | `member`, `user`, `people`, "Tín hữu" |
| Gia đình             | `family`             | Gia đình               | `household`, `home`, "Hộ khẩu"        |
| Giáo họ              | `zone`               | Giáo họ                | `area`, `group`, `parish`, "Khu"      |
| Thành viên hộ        | `familyMember`       | Thành viên             | `membership`, `personFamily`          |
| Chủ hộ               | `head`               | Chủ hộ                 | `owner`, `leader`                     |
| Tên thánh            | `holyName`           | Tên thánh              | `saintName`, `christianName`          |
| Họ và tên            | `fullName`           | Họ và tên              | `name`, `firstName` + `lastName`      |
| Tên gọi              | `givenName`          | Tên gọi                | `shortName`, `nickName`               |
| Họ tên không dấu     | `fullNameAscii`      | _(không hiện)_         | `slug`, `searchKey`                   |
| Ngày sinh            | `birthDate`          | Ngày sinh              | `dob`, `dateOfBirth`                  |
| Ngày rửa tội         | `baptismDate`        | Ngày rửa tội           | `dateRT`                              |
| Ngày rước lễ lần đầu | `firstCommunionDate` | Ngày rước lễ lần đầu   | `dateRL`                              |
| Ngày thêm sức        | `confirmationDate`   | Ngày thêm sức          | `dateTS`                              |
| Ngày hôn phối        | `marriageDate`       | Ngày hôn phối          | `dateHP`, `weddingDate`               |
| Ngày qua đời         | `deathDate`          | Ngày qua đời           | `dateDead`, `diedAt`                  |
| Ngày vào hộ          | `fromDate`           | Từ ngày                | `startDate`, `joinedAt`               |
| Ngày rời hộ          | `toDate`             | Đến ngày               | `endDate`, `leftAt`                   |
| Chuyển hộ            | `move`               | Chuyển hộ              | `transfer`, `changeFamily`            |
| Tên giáo xứ          | `parishName`         | Tên giáo xứ            | `churchName`                          |
| Xuất dữ liệu         | `backup:export`      | Xuất dữ liệu ra file   | "Backup", "Sao lưu thủ công"          |
| Nhập dữ liệu         | `backup:import`      | Nhập dữ liệu từ file   | "Restore", "Phục hồi"                 |
| Bản sao an toàn      | `safetyBackup`       | Bản sao trước khi nhập | "Bản lưu tạm"                         |
| Sai lệch dữ liệu     | `divergence`         | Sai lệch giữa hai bản  | "Xung đột", "Conflict"                |

---

## 2. Giá trị cố định của các cột enum

**`persons.gender`**

| Giá trị  | Hiển thị |
| -------- | -------- |
| `male`   | Nam      |
| `female` | Nữ       |

**`family_members.relationship`** — quan hệ với chủ hộ

| Giá trị       | Hiển thị   |
| ------------- | ---------- |
| `head`        | Chủ hộ     |
| `spouse`      | Vợ/Chồng   |
| `child`       | Con        |
| `parent`      | Cha/Mẹ     |
| `grandparent` | Ông/Bà     |
| `grandchild`  | Cháu       |
| `sibling`     | Anh/Chị/Em |
| `relative`    | Họ hàng    |
| `other`       | Khác       |

> Hai bảng trên là nguồn chân lý cho `CHECK IN (...)` ở
> [`database-schema.md`](./database-schema.md) §2.3 và §2.5. Thêm giá trị mới → phải có migration.
