import { QueryClient } from '@tanstack/react-query'

/** Tạo client riêng cho mỗi app/test, không rò cache qua các phiên kiểm thử.
 * @returns {QueryClient}
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: 0 },
    },
  })
}
