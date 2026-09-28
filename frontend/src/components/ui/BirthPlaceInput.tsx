import { HolyNameInput } from './HolyNameInput.tsx'
import { BIRTH_PLACE_SUGGESTIONS } from '@shared/suggestionDefaults.ts'
import { useSuggestionValues } from '@/features/suggestion/hooks/useSuggestions.ts'

export function BirthPlaceInput(props: any) {
  const values = useSuggestionValues('birth_place', BIRTH_PLACE_SUGGESTIONS)
  return <HolyNameInput {...props} suggestionValues={values} />
}
