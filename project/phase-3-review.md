# Phase 3 — Bàn giao và bằng chứng kiểm chứng

Ngày: 2026-09-13. **Đã triển khai mã; chưa đạt toàn bộ Definition of Done.**
Làm trực tiếp trên `develop` theo yêu cầu. Không chạy lệnh Git; không commit/push.
Đã cập nhật template lên 1.8.0 theo phê duyệt của người dùng, đồng bộ từ
`D:/projects/template/docs` về `docs/`. Không sửa migration hay dữ liệu giáo dân thật.

## 1. Kết quả theo từng mục kế hoạch

| Mục | Triển khai                                                                                                                           | Kiểm chứng                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Đủ nhóm token, hai palette, font hệ thống                                                                                            | Rà CSS/AST; 50 cặp tương phản: sáng ≥ 5.116:1, tối ≥ 5.332:1                                                                                  |
| 3.2 | Reset; html/body không cuộn, focus-visible, giảm chuyển động                                                                         | Electron thật ở 940×600 không tràn; animation chỉ trong no-preference                                                                         |
| 3.3 | Sidebar, TopBar, Content, StatusBar, Portal                                                                                          | Ảnh Electron Tổng quan sáng và Cài đặt tối; sidebar 72px khi cửa sổ nhỏ                                                                       |
| 3.4 | HashRouter, đủ 10 route, mục cha active khi vào chi tiết                                                                             | Test tích hợp trên App thật; bản build giữ đường dẫn tương đối                                                                                |
| 3.5 | Button, Input, Select, DateInput, Modal, Drawer, Toast, EmptyState, ErrorState, Spinner, Skeleton, VirtualList, Table, ConfirmDialog | RTL kiểm ref/nhãn/lỗi, disabled, ngày dạng chuỗi, năm trạng thái, 1000 hàng chỉ render vùng nhìn thấy; focus native còn chờ                   |
| 3.6 | invoke/AppClientError, QueryClient, 4 nhóm query key, 5 store                                                                        | Test qua mock window.api; không gọi IPC/useQuery/useMutation trong JSX; broadcast setting chỉ invalidate                                      |
| 3.7 | light/dark/system; cache trước React; lưu SQLite; density                                                                            | Đổi theme qua IPC thật thành công; test remount, OS change, rollback và rời trang khi mutation đang chờ                                       |
| 3.8 | Đọc JSON trước DB; ghi bounds thường; kẹp theo màn hình; khôi phục maximized                                                         | 3 test trên hàm production, gồm JSON hỏng và màn hình âm; đã thấy app thật ghi window-state.json; vòng đóng/mở và tháo màn hình thật chưa thử |
| 3.9 | Error Boundary toàn app và riêng Content                                                                                             | Test cố ý gây lỗi tại DirectoryPreview trong App Shell; sidebar còn hoạt động; đổi route khôi phục nội dung                                   |

Cài đặt và xuất/nhập dùng dữ liệu thật vì Phase 3 yêu cầu nhớ cấu hình và Phase 2 đã có
xuất/nhập. Các màn hình nghiệp vụ dùng **6 giáo dân, 3 gia đình, 2 giáo họ minh hoạ**, không
seed các mẫu này vào SQLite. Chưa có form CRUD.

## 2. Lệnh và kết quả

| Lệnh                         | Kết quả cuối                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run test`               | Backend **67 pass, 0 fail**; frontend **18 pass, 0 fail**                                     |
| `npm run build`              | Frontend + Main + Preload build thành công                                                    |
| `npm run lint`               | Exit 0, không có lỗi/cảnh báo lint                                                            |
| `npm run format:check`       | Exit 0, tất cả file được kiểm tra đạt định dạng Prettier                                      |
| `node .phase3-qa/static.cjs` | **81 file nguồn**, không vi phạm kiểm tra AST/CSS; 50 cặp màu đều ≥ 4.5:1                     |
| `node .phase3-qa/smoke.cjs`  | Electron thật: mở Tổng quan, đổi theme, đọc SQLite qua preload, thu cửa sổ 940×600 thành công |
| `node .phase3-qa/verify.cjs` | **Không chạy**: yêu cầu cấp quyền bị từ chối; không thử lại hoặc chạy vòng qua hạn chế        |

Bằng chứng Electron: `ui.theme = dark`; viewport thực tế **928×538** khi khung cửa sổ
940×600 (bản trước khi bỏ menu mặc định); `pageScroll: false`, `pageOverflow: false`,
`sidebarWidth: 72`. Hồ sơ thử nghiệm riêng: `.phase3-qa/profile/Electron-dev`.
Ảnh: `.phase3-qa/dashboard-light.png`, `.phase3-qa/settings-dark-940.png`.
Các file `.phase3-qa/` là bằng chứng cục bộ được ignore, không đưa vào bản đóng gói.

Log test có stack trace **được cố ý gây ra** để kiểm Error Boundary. Đây không phải test fail.
Một lượt test bổ sung ban đầu 17 pass/1 fail vì fixture chưa gây lỗi; đã sửa fixture,
chạy lại đầy đủ và đạt 18/18. Build còn cảnh báo chú thích của Zod và cấu hình renderer
riêng của electron-vite (FE được build bằng Vite riêng); không có lỗi build.

## 3. Đã rà soát — phát hiện gì

Đã đọc lại mã tạo/sửa; đối chiếu §3.1–3.9, Definition of Done, checklist frontend và chung.

- Sửa vai trò accessibility của VirtualList thành grid có điều hướng hàng bằng bàn phím.
- Sửa callback scroll để không đọc `event.currentTarget` sau khi sự kiện đã kết thúc.
- Sửa ArrowDown lần đầu để chọn hàng đầu, không bỏ qua một hàng.
- Sửa màu hover của Button chính để không thành chữ trắng trên nền sáng.
- Tách AppContent và DirectoryToolbar để JSX không vượt bốn cấp.
- Đưa cleanup bản xem trước theme vào lifecycle mutation để vẫn chạy khi rời Cài đặt.
- Đồng bộ ô tìm kiếm từ URL khi tải lại hoặc xoá bộ lọc.
- Khoá cả nút đóng dialog trong lúc xác nhận đang pending.
- Bỏ menu Electron mặc định tiếng Anh; giữ toàn bộ cấu hình bảo mật cửa sổ.
- Kích thước đọc từ JSON được làm tròn và kẹp trước khi đưa vào BrowserWindow.
- Script theme là tài nguyên public đồng bộ; bản build xuất `./theme.js` trước module React.

Chi tiết tự quyết: palette và kích thước bố cục cụ thể, dialog gốc của Chromium,
virtualization với hàng cố định, mẫu dữ liệu giả và cách chia file hỗ trợ. Không đổi stack,
không thêm màn hình ngoài bản đồ, không tự chốt TypeScript.

## 4. Các mục còn phải kiểm chứng trước khi đóng Phase 3

- [ ] Đóng/mở Electron thật: vị trí, kích thước và trạng thái maximized được khôi phục.
- [ ] Theme tối ở frame đầu, không nháy trắng khi khởi động lại, trên bản đóng gói.
- [ ] Rút màn hình phụ rồi mở app; hiện mới có test hàm production với danh sách màn hình giả.
- [ ] Đi đủ route và thao tác bàn phím ở cả hai theme; bẫy focus/Tab/Shift+Tab/Esc của dialog
      trong Chromium thật. jsdom không triển khai top-layer, không coi mock là bằng chứng phần này.
- [ ] Chạy thử bản đóng gói qua `file://` và tải lại route chi tiết. Chưa build lại bộ cài Windows;
      bộ cài trong release có thể vẫn là Phase 2.

Không chuyển sang Phase 4 trước khi đóng các mục còn thiếu. Q02 (TypeScript) vẫn bỏ ngỏ,
phải hỏi trước Phase 4. Khi đóng Phase 3, mở phiên mới hoặc `/clear` trước phase kế tiếp.

## 5. Danh mục design token và cập nhật template

Nguồn giá trị duy nhất: `frontend/src/styles/tokens.css`. Nhóm màu, spacing, radius, font,
shadow, z-index, duration theo danh mục template. Template 1.8.0 bổ sung §5.1a trong
`docs/03-frontend/ui-structure.md` cho các nhóm dùng chung; giá trị cụ thể vẫn ở CSS dự án.
Đã cập nhật CHANGELOG và TEMPLATE_VERSION tại template gốc rồi sao chép về dự án.
Token bổ sung phục vụ bố cục:
`--sidebar-width`, `--sidebar-collapsed-width`, `--topbar-height`, `--statusbar-height`,
`--control-height`, `--control-min`, `--icon-size`, `--modal-width`, `--drawer-width`,
`--search-width`, `--content-width`, `--virtual-height`, `--row-height`, `--border-width`,
`--focus-width`, `--focus-offset`. Biến offset của virtual list được tính từ vị trí cuộn.

## 6. File đã tạo hoặc sửa

Danh sách dưới chỉ là thay đổi của nhiệm vụ này; không dựa trên Git và không bao gồm thay đổi
có thể có trước phiên. Cả App.jsx và main.jsx được sửa; các thư mục con frontend/src được tạo
cho Phase 3. Không có file nào bị xoá khỏi dự án.

- `.eslintrc.cjs`
- `.eslintignore`
- `.prettierignore`
- `.gitignore`
- `package.json`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/index.html`
- `frontend/public/theme.js`
- `frontend/vitest.config.js`
- `frontend/test/setup.js`
- `frontend/test/app.test.jsx`
- `frontend/test/ui.test.jsx`
- `shared/channels.js`
- `backend/src/main/index.js`
- `backend/src/main/window-manager.js`
- `backend/src/main/ipc/index.js`
- `backend/src/main/ipc/setting.ipc.js`
- `backend/src/preload/index.js`
- `backend/src/schemas/setting.schema.js`
- `backend/src/repositories/setting.repository.js`
- `backend/src/services/setting.service.js`
- `backend/test/setting.test.mjs`
- `backend/test/window-manager.test.mjs`
- `CLAUDE.md`
- `project/decisions.md`
- `project/ipc-channels.md`
- `project/invalidate-rules.md`
- `project/screen-map.md`
- `project/roadmap.md`
- `project/phase-3-review.md`
- `plan/phase-3-ui-shell.md`
- `docs/03-frontend/ui-structure.md`
- `docs/CHANGELOG.md`
- `docs/TEMPLATE_VERSION`
- `frontend/src/styles/tokens.css`
- `frontend/src/styles/global.css`
- `frontend/src/stores/ui.store.js`
- `frontend/src/stores/toast.store.js`
- `frontend/src/stores/selection.store.js`
- `frontend/src/stores/overlay.store.js`
- `frontend/src/stores/filter.store.js`
- `frontend/src/shared/queryKeys.js`
- `frontend/src/shared/queryClient.js`
- `frontend/src/shared/invoke.js`
- `frontend/src/pages/ZoneListPage.jsx`
- `frontend/src/pages/ZoneDetailPage.jsx`
- `frontend/src/pages/TrashPage.jsx`
- `frontend/src/pages/SettingsPage.module.css`
- `frontend/src/pages/SettingsPage.jsx`
- `frontend/src/pages/SearchPage.jsx`
- `frontend/src/pages/PersonListPage.jsx`
- `frontend/src/pages/PersonDetailPage.jsx`
- `frontend/src/pages/FamilyListPage.jsx`
- `frontend/src/pages/FamilyDetailPage.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/main.jsx`
- `frontend/src/hooks/useShellShortcuts.js`
- `frontend/src/features/setting/hooks/useTheme.js`
- `frontend/src/features/setting/hooks/useSettings.js`
- `frontend/src/App.jsx`
- `frontend/src/features/setting/api/setting.api.js`
- `frontend/src/features/backup/api/backup.api.js`
- `frontend/src/features/backup/hooks/useBackup.js`
- `frontend/src/features/preview/DashboardPreview.jsx`
- `frontend/src/features/preview/DetailPreview.jsx`
- `frontend/src/features/preview/DirectoryPreview.jsx`
- `frontend/src/features/preview/DirectoryTable.jsx`
- `frontend/src/features/preview/SearchPreview.jsx`
- `frontend/src/features/preview/sampleData.js`
- `frontend/src/features/preview/Preview.module.css`
- `frontend/src/features/preview/DirectoryToolbar.jsx`
- `frontend/src/components/layout/AppContent.jsx`
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/features/backup/components/BackupSettings.jsx`
- `frontend/src/features/backup/components/BackupSettings.module.css`
- `frontend/src/components/layout/AppShell.module.css`
- `frontend/src/components/layout/AppSidebar.jsx`
- `frontend/src/components/layout/OverlayRoot.module.css`
- `frontend/src/features/setting/components/AppearanceSettings.module.css`
- `frontend/src/components/layout/OverlayRoot.jsx`
- `frontend/src/features/setting/components/AppearanceSettings.jsx`
- `frontend/src/components/layout/navigation.js`
- `frontend/src/components/layout/AppTopBar.module.css`
- `frontend/src/components/layout/AppTopBar.jsx`
- `frontend/src/components/layout/AppStatusBar.module.css`
- `frontend/src/components/layout/AppStatusBar.jsx`
- `frontend/src/components/layout/AppSidebar.module.css`
- `frontend/src/components/ui/ConfirmDialog.jsx`
- `frontend/src/components/ui/Button.module.css`
- `frontend/src/components/ui/Button.jsx`
- `frontend/src/components/ui/DateInput.jsx`
- `frontend/src/components/ui/Drawer.jsx`
- `frontend/src/components/ui/VirtualList.module.css`
- `frontend/src/components/ui/VirtualList.jsx`
- `frontend/src/components/ui/Toast.module.css`
- `frontend/src/components/ui/Toast.jsx`
- `frontend/src/components/ui/Table.module.css`
- `frontend/src/components/ui/Table.jsx`
- `frontend/src/components/ui/Spinner.module.css`
- `frontend/src/components/ui/Spinner.jsx`
- `frontend/src/components/ui/Skeleton.module.css`
- `frontend/src/components/ui/Skeleton.jsx`
- `frontend/src/components/ui/Select.jsx`
- `frontend/src/components/ui/PageHeader.module.css`
- `frontend/src/components/ui/PageHeader.jsx`
- `frontend/src/components/ui/Modal.module.css`
- `frontend/src/components/ui/Modal.jsx`
- `frontend/src/components/ui/Input.module.css`
- `frontend/src/components/ui/Input.jsx`
- `frontend/src/components/ui/Icon.module.css`
- `frontend/src/components/ui/Icon.jsx`
- `frontend/src/components/ui/ErrorState.jsx`
- `frontend/src/components/ui/ErrorBoundary.jsx`
- `frontend/src/components/ui/EmptyState.module.css`
- `frontend/src/components/ui/EmptyState.jsx`

Ngoài workspace dự án, ba file cùng tên trong `D:/projects/template/docs/` cũng được
cập nhật theo quyền đã cấp. Không chạy Git ở cả hai thư mục.

Commit message đề xuất (chỉ soạn, không thực thi):

```text
feat(ui): dựng bộ khung giao diện Phase 3 và lưu cài đặt
```
