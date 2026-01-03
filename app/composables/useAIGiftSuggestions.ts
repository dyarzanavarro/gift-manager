export type AISuggestion = {
    title: string
    why: string
    category: string
    price_hint: string
    link_query: string
}

export const useAIGiftSuggestions = () => {
    const loading = ref(false)
    const error = ref<string | null>(null)
    const suggestions = ref<AISuggestion[]>([])

    const fetchSuggestions = async (params: {
        personId: string
        occasionId: string
        hint?: string
        budgetMin?: number
        budgetMax?: number
    }) => {
        loading.value = true
        error.value = null
        suggestions.value = []
        try {
            const res = await $fetch<{ suggestions: AISuggestion[] }>(
                '/api/gift-suggestions',
                { method: 'POST', body: params }
            )
            suggestions.value = res.suggestions ?? []
        } catch (e: any) {
            error.value = e?.data?.message ?? e?.message ?? 'AI request failed'
        } finally {
            loading.value = false
        }
    }
    const reset = () => {
        loading.value = false
        error.value = null
        suggestions.value = []
    }

    return { loading, error, suggestions, fetchSuggestions, reset }
}