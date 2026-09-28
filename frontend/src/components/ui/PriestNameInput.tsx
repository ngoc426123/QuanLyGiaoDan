import { HolyNameInput } from './HolyNameInput.tsx'
import { useSettings } from '@/features/setting/hooks/useSettings.ts'
import { useSuggestionValues } from '@/features/suggestion/hooks/useSuggestions.ts'

/** Input tự do cho tên linh mục, với tên chánh xứ trong Cài đặt làm gợi ý duy nhất. */
export function PriestNameInput({ suggestionValues, ...props }: any) {
  const settings = useSettings()
  const configuredPriest = String(settings.data?.['general.parishPriestName'] ?? '').trim()
  const suggestions = useSuggestionValues(
    'priest',
    configuredPriest ? [configuredPriest] : [],
    !suggestionValues,
  )
  const availableSuggestions = suggestionValues ?? suggestions

  return <HolyNameInput {...props} suggestionValues={availableSuggestions} />
}
