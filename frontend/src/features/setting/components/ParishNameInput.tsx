import { HolyNameInput } from '@/components/ui/HolyNameInput.tsx'
import { useSettings } from '../hooks/useSettings.ts'

/** Input tự do có gợi ý tên giáo xứ đã lưu trong cài đặt. */
export function ParishNameInput({ ...rest }: any) {
  const settings = useSettings()
  const parishName = String(settings.data?.['general.parishName'] ?? '').trim()

  return <HolyNameInput {...rest} suggestionValues={parishName ? [parishName] : []} />
}
