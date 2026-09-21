import {
  expect,
  test,
  type ElectronApplication,
  type Page,
  _electron as electron,
} from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const zoneName = 'Giáo họ Thánh Giuse E2E'
const firstFamilyName = 'Hộ Thánh Anrê E2E'
const secondFamilyName = 'Hộ Thánh Phaolô E2E'
const personName = 'Nguyễn Văn E2E'
const databasePassword = 'mat-khau-e2e-2026'
const runPackagedE2E = process.env.ELECRUSION_E2E_PACKAGED === '1'
const configuredExecutable = process.env.ELECRUSION_E2E_EXECUTABLE
const configuredUserData = process.env.ELECRUSION_E2E_USER_DATA
const verifyExistingData = process.env.ELECRUSION_E2E_EXISTING_DATA === '1'

let userDataDir: string
let electronApp: ElectronApplication
let page: Page

async function navigate(label: string) {
  await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click()
}

test.beforeAll(async () => {
  userDataDir = configuredUserData ?? (await mkdtemp(join(tmpdir(), 'elecrusion-e2e-')))
  electronApp = await electron.launch({
    executablePath:
      configuredExecutable ??
      resolve(
        process.cwd(),
        runPackagedE2E
          ? '../backend/release/win-unpacked/Elecrusion.exe'
          : '../backend/node_modules/electron/dist/electron.exe',
      ),
    args:
      runPackagedE2E || configuredExecutable
        ? []
        : [resolve(process.cwd(), '../backend/out/main.js')],
    env: {
      ...process.env,
      ELECRUSION_USER_DATA: userDataDir,
      ELECRUSION_E2E: '1',
      VITE_DEV_SERVER_URL: 'http://127.0.0.1:5174',
    },
  })
  const unlockWindow = await electronApp.firstWindow()
  expect(
    await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].isMenuBarVisible(),
    ),
  ).toBe(false)
  expect(
    await unlockWindow.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
  ).toBe(true)
  expect(
    await unlockWindow.evaluate(() => {
      const confirmation = document.querySelector('#confirmation-label') as HTMLElement
      const wasHidden = confirmation.hidden
      confirmation.hidden = true
      const isHidden = getComputedStyle(confirmation).display === 'none'
      confirmation.hidden = wasHidden
      return isHidden
    }),
  ).toBe(true)
  expect(await unlockWindow.evaluate(() => typeof (window as any).encryption?.unlock)).toBe(
    'function',
  )
  await expect(
    unlockWindow.getByRole('button', {
      name: verifyExistingData ? 'Mở ứng dụng' : 'Đặt mật khẩu và mở ứng dụng',
    }),
  ).toBeVisible()
  await unlockWindow.getByLabel('Mật khẩu dữ liệu').fill(databasePassword)
  if (verifyExistingData) {
    await expect(unlockWindow.getByLabel('Xác nhận mật khẩu')).toBeHidden()
  } else {
    await unlockWindow.getByLabel('Xác nhận mật khẩu').fill(databasePassword)
  }
  const mainWindow = electronApp.waitForEvent('window')
  await unlockWindow
    .getByRole('button', {
      name: verifyExistingData ? 'Mở ứng dụng' : 'Đặt mật khẩu và mở ứng dụng',
    })
    .click()
  page = await mainWindow
  await page.getByRole('heading', { name: 'Tổng quan giáo xứ' }).waitFor()
  if (runPackagedE2E || configuredExecutable) {
    expect(
      await electronApp.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].webContents.isDevToolsOpened(),
      ),
    ).toBe(false)
  }
})

test('mở lại bản cài sau cập nhật với dữ liệu có sẵn', async () => {
  test.skip(!verifyExistingData, 'Chỉ dùng khi kiểm tra cài đè.')
  await expect(page.getByText(zoneName, { exact: true })).toBeVisible()
})

test.afterAll(async () => {
  await electronApp?.close()
  if (!configuredUserData) await rm(userDataDir, { recursive: true, force: true })
})

test.describe.serial('Ba luồng nghiệp vụ Phase 6', () => {
  test.skip(verifyExistingData, 'Không tạo lại dữ liệu trong kịch bản cài đè.')

  test('tạo giáo họ, hộ và giáo dân; hồ sơ hiển thị đúng', async () => {
    await navigate('Giáo họ')
    await page.getByRole('button', { name: 'Thêm giáo họ' }).click()
    const zoneDialog = page.getByRole('dialog', { name: 'Thêm giáo họ' })
    await zoneDialog.getByLabel('Tên giáo họ').fill(zoneName)
    await zoneDialog.getByRole('button', { name: 'Tạo giáo họ' }).click()
    await expect(zoneDialog).toBeHidden()
    await expect(page.getByRole('link', { name: zoneName })).toBeVisible()

    await navigate('Gia đình')
    await page.getByRole('button', { name: 'Thêm gia đình' }).first().click()
    const familyDialog = page.getByRole('dialog', { name: 'Thêm gia đình' })
    await familyDialog.getByLabel('Giáo họ').selectOption({ label: zoneName })
    await familyDialog.getByLabel('Tên hộ').fill(firstFamilyName)
    await familyDialog.getByRole('button', { name: 'Tạo gia đình' }).click()
    await expect(familyDialog).toBeHidden()
    await expect(page.getByRole('link', { name: firstFamilyName })).toBeVisible()

    await navigate('Giáo dân')
    await page.getByRole('button', { name: 'Thêm giáo dân' }).first().click()
    await page.getByRole('heading', { name: 'Thêm giáo dân' }).waitFor()
    await page.getByLabel('Họ và tên').fill(personName)
    await page.getByLabel('Gán vào hộ').selectOption({ label: firstFamilyName })
    await page.getByLabel('Quan hệ trong hộ').selectOption('head')
    await page.getByRole('textbox', { name: 'Ngày vào hộ' }).fill('01/01/2020')
    await page.getByRole('button', { name: 'Tạo giáo dân' }).click()
    await expect(page.getByRole('heading', { name: 'Hồ sơ giáo dân' })).toBeVisible()
    await expect(page.getByText(personName, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: firstFamilyName })).toBeVisible()
  })

  test('chuyển giáo dân sang hộ khác, hộ cũ và mới phản ánh đúng', async () => {
    await navigate('Gia đình')
    await page.getByRole('button', { name: 'Thêm gia đình' }).first().click()
    const familyDialog = page.getByRole('dialog', { name: 'Thêm gia đình' })
    await familyDialog.getByLabel('Giáo họ').selectOption({ label: zoneName })
    await familyDialog.getByLabel('Tên hộ').fill(secondFamilyName)
    await familyDialog.getByRole('button', { name: 'Tạo gia đình' }).click()
    await expect(familyDialog).toBeHidden()

    await navigate('Giáo dân')
    await page.getByRole('link', { name: personName }).click()
    await page.getByRole('button', { name: 'Chuyển hộ', exact: true }).click()
    const moveDialog = page.getByRole('dialog', { name: 'Chuyển hộ' })
    await moveDialog
      .getByLabel('Hộ đích', { exact: true })
      .selectOption({ label: secondFamilyName })
    await moveDialog.getByRole('textbox', { name: 'Ngày chuyển hộ' }).fill('21/09/2026')
    await moveDialog.getByRole('button', { name: 'Chuyển hộ', exact: true }).click()
    await expect(moveDialog).toBeHidden()
    await expect(page.getByRole('link', { name: secondFamilyName })).toBeVisible()
    await expect(page.getByText(firstFamilyName, { exact: true })).toBeVisible()

    await navigate('Gia đình')
    await page.getByRole('link', { name: firstFamilyName }).click()
    await expect(page.getByText('Chưa có thành viên')).toBeVisible()
    await navigate('Gia đình')
    await page.getByRole('link', { name: secondFamilyName }).click()
    await expect(page.getByRole('link', { name: personName })).toBeVisible()
  })

  test('xóa giáo dân rồi khôi phục nguyên vẹn từ thùng rác', async () => {
    await navigate('Giáo dân')
    await page.getByRole('link', { name: personName }).click()
    await page.getByRole('button', { name: 'Xoá', exact: true }).click()
    const confirmDialog = page.getByRole('dialog', { name: 'Xoá giáo dân' })
    await confirmDialog.getByRole('button', { name: 'Xác nhận xoá' }).click()
    await expect(page.getByRole('heading', { name: 'Giáo dân', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: personName })).toHaveCount(0)

    await page.getByRole('link', { name: 'Thùng rác', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: personName })).toBeVisible()
    await page.getByRole('button', { name: 'Khôi phục' }).click()
    await expect(page.getByRole('button', { name: 'Khôi phục' })).toHaveCount(0)

    await navigate('Giáo dân')
    await expect(page.getByRole('link', { name: personName })).toBeVisible()
    await page.getByRole('link', { name: personName }).click()
    await expect(page.getByRole('link', { name: secondFamilyName })).toBeVisible()
  })
})
