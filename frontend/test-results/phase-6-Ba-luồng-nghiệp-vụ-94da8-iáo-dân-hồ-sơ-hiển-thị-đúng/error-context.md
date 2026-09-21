# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase-6.spec.ts >> Ba luồng nghiệp vụ Phase 6 >> tạo giáo họ, hộ và giáo dân; hồ sơ hiển thị đúng
- Location: e2e\phase-6.spec.ts:47:3

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Ngày vào hộ') resolved to 2 elements:
    1) <input value="" id=":r1v:" required="" type="text" maxlength="10" inputmode="numeric" aria-invalid="false" placeholder="dd/mm/yyyy" class="_input_gx4pw_10 _textInput_mddt7_5"/> aka getByRole('textbox', { name: 'Ngày vào hộ' })
    2) <button type="button" class="_pickerButton_mddt7_9" aria-label="Chọn ngày vào hộ">…</button> aka getByRole('button', { name: 'Chọn ngày vào hộ' })

Call log:
  - waiting for getByLabel('Ngày vào hộ')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Đến nội dung chính" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - complementary [ref=e5]:
    - generic [ref=e10]:
      - strong [ref=e11]: Elecrusion
      - paragraph [ref=e12]: Danh bạ giáo xứ
    - paragraph [ref=e13]: KHÔNG GIAN GIÁO XỨ
    - navigation "Điều hướng chính" [ref=e14]:
      - link "Tổng quan" [ref=e15] [cursor=pointer]:
        - /url: "#/"
      - link "Giáo dân" [ref=e19] [cursor=pointer]:
        - /url: "#/persons"
      - link "Gia đình" [ref=e23] [cursor=pointer]:
        - /url: "#/families"
      - link "Giáo họ" [ref=e27] [cursor=pointer]:
        - /url: "#/zones"
      - link "Cài đặt" [ref=e31] [cursor=pointer]:
        - /url: "#/settings"
    - generic [ref=e35]:
      - generic [ref=e36]: Dữ liệu trên máy của bạn
      - button "Thu gọn hoặc mở rộng thanh bên" [ref=e37] [cursor=pointer]
  - generic [ref=e40]:
    - banner [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e43]: DANH BẠ GIÁO XỨ
        - menubar "Thanh menu" [ref=e44]:
          - button "Tệp" [ref=e46] [cursor=pointer]
          - button "Xem" [ref=e48] [cursor=pointer]
          - button "Trợ giúp" [ref=e50] [cursor=pointer]
      - generic [ref=e51]:
        - button "Thu nhỏ cửa sổ" [ref=e52] [cursor=pointer]
        - button "Phóng to cửa sổ" [ref=e54] [cursor=pointer]
        - button "Đóng cửa sổ" [ref=e57] [cursor=pointer]
      - generic [ref=e60]:
        - text: Giáo xứ
        - generic [aria-hidden] [ref=e61]: /
        - strong [ref=e62]: Hồ sơ giáo dân
      - search [ref=e63]:
        - searchbox "Tìm kiếm toàn bộ danh bạ" [ref=e65]
        - button "Tìm kiếm" [ref=e66] [cursor=pointer]
      - link "Thùng rác" [ref=e69] [cursor=pointer]:
        - /url: "#/trash"
    - main [ref=e72]:
      - generic [ref=e73]:
        - link "Về danh sách giáo dân" [ref=e74] [cursor=pointer]:
          - /url: "#/persons"
        - generic [ref=e76]:
          - heading "Thêm giáo dân" [level=1] [ref=e78]
          - paragraph [ref=e79]: Tạo hồ sơ mới và có thể gán vào hộ ngay.
        - generic [ref=e80]:
          - group [ref=e81]:
            - heading "Thông tin cơ bản" [level=2] [ref=e82]
            - generic [ref=e83]:
              - generic [ref=e84]: Họ và tên
              - textbox "Họ và tên" [active] [ref=e85]: Nguyễn Văn E2E
            - generic [ref=e86]:
              - generic [ref=e87]: Tên gọi
              - textbox "Tên gọi" [ref=e88]
            - generic [ref=e89]:
              - generic [ref=e90]: Tên thánh
              - textbox "Tên thánh" [ref=e91]
            - generic [ref=e92]:
              - generic [ref=e93]: Giới tính
              - combobox "Giới tính" [ref=e94]:
                - option "Chưa cập nhật" [selected]
                - option "Nam"
                - option "Nữ"
            - generic [ref=e95]:
              - generic [ref=e96]: Ngày sinh
              - generic [ref=e97]:
                - textbox "Ngày sinh" [ref=e98]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày sinh" [ref=e99] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e102]:
              - generic [ref=e103]: Số điện thoại
              - textbox "Số điện thoại" [ref=e104]
          - group [ref=e105]:
            - heading "Bí tích" [level=2] [ref=e106]
            - generic [ref=e107]:
              - generic [ref=e108]: Ngày rửa tội
              - generic [ref=e109]:
                - textbox "Ngày rửa tội" [ref=e110]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày rửa tội" [ref=e111] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e114]:
              - generic [ref=e115]: Ngày rước lễ lần đầu
              - generic [ref=e116]:
                - textbox "Ngày rước lễ lần đầu" [ref=e117]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày rước lễ lần đầu" [ref=e118] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e121]:
              - generic [ref=e122]: Ngày thêm sức
              - generic [ref=e123]:
                - textbox "Ngày thêm sức" [ref=e124]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày thêm sức" [ref=e125] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e128]:
              - generic [ref=e129]: Ngày hôn phối
              - generic [ref=e130]:
                - textbox "Ngày hôn phối" [ref=e131]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày hôn phối" [ref=e132] [cursor=pointer]
                - textbox [aria-hidden]
          - group [ref=e135]:
            - heading "Tình trạng" [level=2] [ref=e136]
            - generic [ref=e137]:
              - generic [ref=e138]: Ngày qua đời
              - generic [ref=e139]:
                - textbox "Ngày qua đời" [ref=e140]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày qua đời" [ref=e141] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e144]:
              - generic [ref=e145]: Gán vào hộ
              - combobox "Gán vào hộ" [ref=e146]:
                - option "Chưa gán hộ"
                - option "Hộ Thánh Anrê E2E" [selected]
            - generic [ref=e147]:
              - generic [ref=e148]: Quan hệ trong hộ
              - combobox "Quan hệ trong hộ" [ref=e149]:
                - option "Chủ hộ" [selected]
                - option "Vợ/chồng"
                - option "Con"
                - option "Cha/mẹ"
                - option "Khác"
            - generic [ref=e150]:
              - generic [ref=e151]: Ngày vào hộ
              - generic [ref=e152]:
                - textbox "Ngày vào hộ" [ref=e153]:
                  - /placeholder: dd/mm/yyyy
                - button "Chọn ngày vào hộ" [ref=e154] [cursor=pointer]
                - textbox [aria-hidden]
            - generic [ref=e157]:
              - generic [ref=e158]: Ghi chú
              - textbox "Ghi chú" [ref=e159]
          - button "Tạo giáo dân" [ref=e160] [cursor=pointer]
    - contentinfo [ref=e161]:
      - generic [ref=e162]: 0 giáo dân · 1 gia đình · 1 giáo họ
      - status [ref=e163]: Làm việc ngoại tuyến
```

# Test source

```ts
  1   | import {
  2   |   expect,
  3   |   test,
  4   |   type ElectronApplication,
  5   |   type Page,
  6   |   _electron as electron,
  7   | } from '@playwright/test'
  8   | import { mkdtemp, rm } from 'node:fs/promises'
  9   | import { tmpdir } from 'node:os'
  10  | import { join, resolve } from 'node:path'
  11  | 
  12  | const zoneName = 'Giáo họ Thánh Giuse E2E'
  13  | const firstFamilyName = 'Hộ Thánh Anrê E2E'
  14  | const secondFamilyName = 'Hộ Thánh Phaolô E2E'
  15  | const personName = 'Nguyễn Văn E2E'
  16  | 
  17  | let userDataDir: string
  18  | let electronApp: ElectronApplication
  19  | let page: Page
  20  | 
  21  | async function navigate(label: string) {
  22  |   await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click()
  23  | }
  24  | 
  25  | test.beforeAll(async () => {
  26  |   userDataDir = await mkdtemp(join(tmpdir(), 'elecrusion-e2e-'))
  27  |   electronApp = await electron.launch({
  28  |     executablePath: resolve(process.cwd(), '../backend/node_modules/electron/dist/electron.exe'),
  29  |     args: [resolve(process.cwd(), '../backend/out/main.js')],
  30  |     env: {
  31  |       ...process.env,
  32  |       ELECRUSION_USER_DATA: userDataDir,
  33  |       ELECRUSION_E2E: '1',
  34  |       VITE_DEV_SERVER_URL: 'http://127.0.0.1:5174',
  35  |     },
  36  |   })
  37  |   page = await electronApp.firstWindow()
  38  |   await page.getByRole('heading', { name: 'Tổng quan giáo xứ' }).waitFor()
  39  | })
  40  | 
  41  | test.afterAll(async () => {
  42  |   await electronApp?.close()
  43  |   await rm(userDataDir, { recursive: true, force: true })
  44  | })
  45  | 
  46  | test.describe.serial('Ba luồng nghiệp vụ Phase 6', () => {
  47  |   test('tạo giáo họ, hộ và giáo dân; hồ sơ hiển thị đúng', async () => {
  48  |     await navigate('Giáo họ')
  49  |     await page.getByRole('button', { name: 'Thêm giáo họ' }).click()
  50  |     const zoneDialog = page.getByRole('dialog', { name: 'Thêm giáo họ' })
  51  |     await zoneDialog.getByLabel('Tên giáo họ').fill(zoneName)
  52  |     await zoneDialog.getByRole('button', { name: 'Tạo giáo họ' }).click()
  53  |     await expect(zoneDialog).toBeHidden()
  54  |     await expect(page.getByRole('link', { name: zoneName })).toBeVisible()
  55  | 
  56  |     await navigate('Gia đình')
  57  |     await page.getByRole('button', { name: 'Thêm gia đình' }).first().click()
  58  |     const familyDialog = page.getByRole('dialog', { name: 'Thêm gia đình' })
  59  |     await familyDialog.getByLabel('Giáo họ').selectOption({ label: zoneName })
  60  |     await familyDialog.getByLabel('Tên hộ').fill(firstFamilyName)
  61  |     await familyDialog.getByRole('button', { name: 'Tạo gia đình' }).click()
  62  |     await expect(familyDialog).toBeHidden()
  63  |     await expect(page.getByRole('link', { name: firstFamilyName })).toBeVisible()
  64  | 
  65  |     await navigate('Giáo dân')
  66  |     await page.getByRole('button', { name: 'Thêm giáo dân' }).first().click()
  67  |     await page.getByRole('heading', { name: 'Thêm giáo dân' }).waitFor()
  68  |     await page.getByLabel('Họ và tên').fill(personName)
  69  |     await page.getByLabel('Gán vào hộ').selectOption({ label: firstFamilyName })
  70  |     await page.getByLabel('Quan hệ trong hộ').selectOption('head')
> 71  |     await page.getByLabel('Ngày vào hộ').fill('01/01/2020')
      |                                          ^ Error: locator.fill: Error: strict mode violation: getByLabel('Ngày vào hộ') resolved to 2 elements:
  72  |     await page.getByRole('button', { name: 'Tạo giáo dân' }).click()
  73  |     await expect(page.getByRole('heading', { name: 'Hồ sơ giáo dân' })).toBeVisible()
  74  |     await expect(page.getByText(personName, { exact: true })).toBeVisible()
  75  |     await expect(page.getByRole('link', { name: firstFamilyName })).toBeVisible()
  76  |   })
  77  | 
  78  |   test('chuyển giáo dân sang hộ khác, hộ cũ và mới phản ánh đúng', async () => {
  79  |     await navigate('Gia đình')
  80  |     await page.getByRole('button', { name: 'Thêm gia đình' }).first().click()
  81  |     const familyDialog = page.getByRole('dialog', { name: 'Thêm gia đình' })
  82  |     await familyDialog.getByLabel('Giáo họ').selectOption({ label: zoneName })
  83  |     await familyDialog.getByLabel('Tên hộ').fill(secondFamilyName)
  84  |     await familyDialog.getByRole('button', { name: 'Tạo gia đình' }).click()
  85  |     await expect(familyDialog).toBeHidden()
  86  | 
  87  |     await navigate('Giáo dân')
  88  |     await page.getByRole('link', { name: personName }).click()
  89  |     await page.getByRole('button', { name: 'Chuyển hộ', exact: true }).click()
  90  |     const moveDialog = page.getByRole('dialog', { name: 'Chuyển hộ' })
  91  |     await moveDialog
  92  |       .getByLabel('Hộ đích', { exact: true })
  93  |       .selectOption({ label: secondFamilyName })
  94  |     await moveDialog.getByLabel('Ngày chuyển hộ').fill('21/09/2026')
  95  |     await moveDialog.getByRole('button', { name: 'Chuyển hộ', exact: true }).click()
  96  |     await expect(moveDialog).toBeHidden()
  97  |     await expect(page.getByRole('link', { name: secondFamilyName })).toBeVisible()
  98  |     await expect(page.getByText(firstFamilyName, { exact: true })).toBeVisible()
  99  | 
  100 |     await navigate('Gia đình')
  101 |     await page.getByRole('link', { name: firstFamilyName }).click()
  102 |     await expect(page.getByText('Chưa có thành viên')).toBeVisible()
  103 |     await navigate('Gia đình')
  104 |     await page.getByRole('link', { name: secondFamilyName }).click()
  105 |     await expect(page.getByRole('link', { name: personName })).toBeVisible()
  106 |   })
  107 | 
  108 |   test('xóa giáo dân rồi khôi phục nguyên vẹn từ thùng rác', async () => {
  109 |     await navigate('Giáo dân')
  110 |     await page.getByRole('link', { name: personName }).click()
  111 |     await page.getByRole('button', { name: 'Xoá', exact: true }).click()
  112 |     const confirmDialog = page.getByRole('dialog', { name: 'Xoá giáo dân' })
  113 |     await confirmDialog.getByRole('button', { name: 'Xác nhận xoá' }).click()
  114 |     await expect(page.getByRole('heading', { name: 'Giáo dân', exact: true })).toBeVisible()
  115 |     await expect(page.getByRole('link', { name: personName })).toHaveCount(0)
  116 | 
  117 |     await page.getByRole('link', { name: 'Thùng rác', exact: true }).focus()
  118 |     await page.keyboard.press('Enter')
  119 |     await expect(page.getByRole('heading', { name: personName })).toBeVisible()
  120 |     await page.getByRole('button', { name: 'Khôi phục' }).click()
  121 |     await expect(page.getByRole('button', { name: 'Khôi phục' })).toHaveCount(0)
  122 | 
  123 |     await navigate('Giáo dân')
  124 |     await expect(page.getByRole('link', { name: personName })).toBeVisible()
  125 |     await page.getByRole('link', { name: personName }).click()
  126 |     await expect(page.getByRole('link', { name: secondFamilyName })).toBeVisible()
  127 |   })
  128 | })
  129 | 
```