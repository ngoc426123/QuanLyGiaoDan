import { HolyNameInput } from '@/components/ui/HolyNameInput.tsx'
import { useSettings } from '../hooks/useSettings.ts'
import { useSuggestionValues } from '@/features/suggestion/hooks/useSuggestions.ts'

export function DioceseNameInput({ ...rest }: any) {
  const settings = useSettings()
  const configured = String(settings.data?.['general.dioceseName'] ?? '').trim()
  const values = useSuggestionValues('diocese', configured ? [configured] : [])
  return <HolyNameInput {...rest} suggestionValues={values} />
}
