export type Article = {
    articleDate: string //format DD-MM-YYYY
    articleTitle: string
    articleImageURL: URL | string
    articleText: string
    articleAuthor: string
    mintStart: bigint //earliest time this article can be minted in unix time (seconds)
    mintEnd: bigint //deadline to mint this article in unix time (seconds)
    tags: string[]
    articleId: bigint
}

export type ArticlePreview = {
    articleDate: string //format DD-MM-YYYY
    articleTitle: string
    articlePreviewImageURL: URL | string
    articlePreviewText: string
    articleId: bigint
}

export type ArticleNFT = {
    articleNFTImageURL: URL | string
    mintStart: bigint //earliest time this articel can be minted in unix time (seconds)
    mintEnd: bigint //deadline to mint this article in unix time (seconds)
    mintPriceDisplay: number //the approximate mint price in standard units for display (see how ethereum handles decimals for more info)
    mintPriceTrue: bigint //the true mint price in atomic units (to be passed to the write API)
}

export type ArticleNFTPreview = {
    articleImageUrl: URL | string
    articleTitle: string
    articleDate: string //DD-MM-YYYY
    articleId: bigint
}

export type NFTBalance = {
    articleId: bigint,
    balance: bigint,
}

export type TimeRange = {
    start: bigint,
    end: bigint,
}

export type UriV0JsonObj = {
    name: string,
    description: string,
    external_link: string,
    image: string, //the image for the NFT (the article image on a newspaper)
    articleImage: string, //the image for the article (just an image)
    author: string,
    date: string,
    title: string,
    text: string,
    tags: string[],
}
