import type { GiftIdea } from '~/models/gift'

export const mockGifts: GiftIdea[] = [
    {
        id: '1',
        personId: '1',
        title: 'Kochbuch "Ottolenghi Simple"',
        notes: 'Für Mama, liebt Kochen',
        occasionId: '1',
        status: 'idea',
        link: 'https://www.orellfuessli.ch/autor/yotam+ottolenghi-5534302',
        imageUrl: 'https://images.thalia.media/07/-/b9c93cf252c44c488ee38b433abe2833/simple-das-kochbuch-gebundene-ausgabe-yotam-ottolenghi.jpeg'
    },
    {
        id: '2',
        personId: '1',
        title: 'Spa-Gutschein',
        notes: 'Wellness-Tag für zwei',
        occasionId: '2',
        status: 'planned',
        link: 'https://www.adler-schwarzwald.de/de/landingpages-/-intern/lp-wellness-im-schwarzwald/73-0.html',
        imageUrl: 'https://www.adler-schwarzwald.de/images/content/101280_13130_1_C_1920_830_0_1820042/pool-1.jpg'
    },
    {
        id: '3',
        personId: '2',
        title: 'Bluetooth-Kopfhörer',
        notes: 'Over-Ear, Noise-Cancelling',
        occasionId: '1',
        status: 'bought',
        link: 'https://www.digitec.ch/de/s1/product/sony-wh-1000xm5-passive-geraeuschunterdrueckung-30-h-kabelgebunden-kabellos-kopfhoerer-20761668',
        imageUrl: 'https://static01.galaxus.com/productimages/4/3/1/1/1/3/1/0/2/7/0/3/4/3/1/8/8/0/01988a35-2a87-75bf-8163-974179e3e983_2880.avif'
    },
    {
        id: '4',
        personId: '3',
        title: 'Zimmerpflanze Monstera',
        notes: 'Mag Pflanzen & Interior',
        occasionId: '3',
        status: 'idea',
        link: 'https://foliagedreams.com/en/collections/monstera/products/monstera-deliciosa-variegata',
        imageUrl: 'https://foliagedreams.com/cdn/shop/files/monstera-deliciosa-variegata-plant-monstera-xl-am-moosstab-48913788043531.jpg?v=1726396692&width=1800'
    },
]
