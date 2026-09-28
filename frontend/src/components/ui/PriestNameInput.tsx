import { HolyNameInput } from './HolyNameInput.tsx'
import { useSettings } from '@/features/setting/hooks/useSettings.ts'

/** Input tự do cho tên linh mục, với tên chánh xứ trong Cài đặt làm gợi ý duy nhất. */
export function PriestNameInput({ suggestionValues, ...props }: any) {
  const settings = useSettings()
  const configuredPriest = String(settings.data?.['general.parishPriestName'] ?? '').trim()
  const suggestions = suggestionValues ?? (configuredPriest ? [configuredPriest] : [])

  return <HolyNameInput {...props} suggestionValues={suggestions} />
}
