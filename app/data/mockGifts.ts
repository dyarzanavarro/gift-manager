import type { GiftIdea } from '~/models/gift'

export const mockGifts: GiftIdea[] = [
    {
        id: 1,
        personId: 1,
        title: 'Kochbuch "Ottolenghi Simple"',
        notes: 'Für Mama, liebt Kochen',
        occasion: 'Geburtstag',
        status: 'idea'
    },
    {
        id: 2,
        personId: 1,
        title: 'Spa-Gutschein',
        notes: 'Wellness-Tag für zwei',
        occasion: 'Weihnachten',
        status: 'planned'
    },
    {
        id: 3,
        personId: 2,
        title: 'Bluetooth-Kopfhörer',
        notes: 'Over-Ear, Noise-Cancelling',
        occasion: 'Weihnachten',
        status: 'bought'
    },
    {
        id: 4,
        personId: 3,
        title: 'Zimmerpflanze Monstera',
        notes: 'Mag Pflanzen & Interior',
        occasion: 'Einweihung',
        status: 'idea'
    }
]