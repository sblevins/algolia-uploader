import { 
    Address, 
    isAddress, 
    createPublicClient,
    Chain,
    http,
    WalletClient,
    Hash,
  } from 'viem'
  import mintControllerABI from '../abi/mintControllerAbi'
  import { Article, ArticleNFT, ArticlePreview, ArticleNFTPreview, TimeRange, UriV0JsonObj, NFTBalance } from '../../types/apiTypes'
  import { getTheDailyPepeArticleNFTAddress, getTheDailyPepeMintControllerAddress } from '../constants/addressBook'
  import articleNFTABI from '../abi/articleNftAbi';
  
  const privateIPFSEndpoint = 'https://api.thedailypepe.com/ipfs/';
  
  //////////////////////////////////////////// CACHE /////////////////////////////////////////////
  ///////////////////////////////////all keys are article Ids/////////////////////////////////////
  const articleMintPriceCache: { [key:string]: bigint } = {}
  const articleURIDataCache: { [key:string]: UriV0JsonObj } = {}
  const articleNFTCache: { [key:string]: ArticleNFT } = {}
  const articleNFTPreviewCache: { [key:string]: ArticleNFTPreview } = {}
  const articleMintTimeCache: { [key:string]: TimeRange } = {}
  const articleURICache: { [key:string]: string } = {}
  const articleCache: { [key: string]: Article } = {}
  const articlePreviewCache: { [key: string]: ArticlePreview } = {}
  let latestArticleIdCache: { [key:string]: bigint } = {}
  ////////////////////////////////////////////////////////////////////////////////////////////////
  
  const key = (articleId:bigint, network:Chain):string => {
    return articleId.toString()+"@"+network.id.toString()
  }
  
  const fetchArticleMintPrice = async (articleId:bigint, network:Chain):Promise<bigint|null> => {
    if (articleMintPriceCache.hasOwnProperty(key(articleId, network))) {
      return articleMintPriceCache[key(articleId, network)]
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const data = await client.readContract({
      address: getTheDailyPepeMintControllerAddress(),
      abi: mintControllerABI,
      functionName: 'mintPrices',
      args: [articleId],
    })
  
    const mintPrice = data as bigint
    if (mintPrice === 0n) {
      return null
    }
  
    articleMintPriceCache[key(articleId, network)] = mintPrice
    return mintPrice
  }
  
  const fetchArticleNFTImageURL = async (articleId:bigint, network:Chain):Promise<string|null> => {
    if (articleURIDataCache.hasOwnProperty(key(articleId, network))) {
      return articleURIDataCache[key(articleId, network)].image
    }
  
    const uriData = await fetchArticleURIData(articleId, network)
    if (uriData === null) {
      return null
    }
    articleURIDataCache[key(articleId, network)] = uriData
  
    return uriData.image
  
  }
  
  const fetchArticleURIData = async (articleId:bigint, network:Chain):Promise<UriV0JsonObj|null> => {
  
    const uri = await fetchArticleURI(articleId, network)
    if (uri === null) {
      return null
    }
  
    //fetch uri
    const uriData = await fetchIPFS(uri, false)
    if (uriData === null) {
      return null
    }
    const articleCidObj:UriV0JsonObj = JSON.parse(uriData)
  
    //cache article URI data
    articleURIDataCache[key(articleId, network)] = articleCidObj
  
    return articleCidObj
  }
  
  const fetchArticleMintTime = async (articleId:bigint, network:Chain):Promise<TimeRange|null> => {
    if (articleMintTimeCache.hasOwnProperty(key(articleId, network))) {
      return articleMintTimeCache[key(articleId, network)]
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const data = await client.readContract({
      abi: articleNFTABI,
      address: getTheDailyPepeArticleNFTAddress(),
      functionName: 'IssueAvailability',
      args: [articleId],
    }) as [bigint, bigint]
    const timeRangeData:TimeRange = {start: data[0], end: data[1]}
  
    if (timeRangeData.start === 0n && timeRangeData.end === 0n) {
      return null
    } else if (timeRangeData.start === 0n || timeRangeData.end === 0n) {
      throw new Error('one of the mint time range values is zero, this indicates an admin error on the contract level. Please report this to dev@thedailypepe.com. article Id: '+articleId.toString())
    }
  
    //cache and return
    articleMintTimeCache[key(articleId, network)] = timeRangeData
    return timeRangeData
  }
  
  const fetchArticleURI = async (articleId:bigint, network:Chain):Promise<string|null> => {
    if (articleURICache.hasOwnProperty(key(articleId, network))) {
      return articleURICache[key(articleId, network)]
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const data = await client.readContract({
      abi: articleNFTABI,
      address: getTheDailyPepeArticleNFTAddress(),
      functionName: 'uri',
      args: [articleId],
    })
    
    //cache and return
    const uri = data as string
    articleURICache[key(articleId, network)] = uri
    return uri
  }
  
  export const _fetchLatestArticleId = async (network:Chain):Promise<bigint> => {
    if (latestArticleIdCache.hasOwnProperty(network.id.toString())) {
      return latestArticleIdCache[network.id.toString()]
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const data = await client.readContract({
      abi: articleNFTABI,
      address: getTheDailyPepeArticleNFTAddress(),
      functionName: 'nextIssue',
    })
    const latestArticleId = (data as bigint) - 1n
  
    latestArticleIdCache[network.id.toString()] = latestArticleId
  
    return latestArticleId
  }
  
  //returns text content or the url of a local image, img must be set to true if retrieving an image
  const fetchIPFS = async (_cid:string, img:boolean):Promise<string> => {
    let cid = _cid
    if (_cid.startsWith('ipfs://')) {
      cid = _cid.substring(7)//trim the ipfs:// part of the string so it's just the cid
    }
    const res = await fetch(privateIPFSEndpoint+cid)
    if (!res.ok) {
      throw new Error('error in IPFS request response. status code: '+res.status+'. '+res.statusText)
    }
    if (img) {
      const blob = await res.blob()
      const localURL = URL.createObjectURL(blob)
      if (!localURL) { //this is necessary because bun hasn't implemented createObjectURL yet
        return privateIPFSEndpoint+cid
      } else {
        return localURL
      }
    } else {
      return res.text();
    }
  
    //TODO: fix the headers in the cloudflare worker and unblock this code
    // if (res.headers.get('Content-Type') === 'application/json') {
    //   if (img) {
    //     throw new Error("expected image, got json")
    //   }
    //   return res.text();
    // } else if (res.headers.get('Content-Type')?.startsWith('image/')) {
    //   if (!img) {
    //     throw new Error("expected json, got image")
    //   }
    //   const blob = await res.blob()
    //   return URL.createObjectURL(blob)
    // } else {
    //   throw new Error("invalid response media: "+res.headers.get('Content-Type'))
    // }
  }
  
  export const _fetchArticle = async (_articleId:string|bigint, network:Chain):Promise<Article|null> => {
    let articleId:bigint
    if (typeof _articleId === 'string') { // fetch the latest article ID from the contract
      if (_articleId !== 'latest') {
        throw new Error('article must be an integer or \'latest\'')
      }
      articleId = await _fetchLatestArticleId(network)
  
    } else { // we are grabbing the passed article ID
      if (_articleId % 1n !== 0n) {
        throw new Error('article must be an integer or \'latest\'')
      }
      articleId = _articleId
    }
  
    //article is already cached
    if (articleCache.hasOwnProperty(key(articleId, network))) {
      return articleCache[key(articleId, network)]
    }
  
    //get article data by ID
    const promises:Promise<void>[] = []
  
    //get URI
    let uri:string = ''
    let nullReturned = false
    promises.push(
      (async ():Promise<void> => {
        const _uri = await fetchArticleURI(articleId, network)
        if (_uri === null) {
          nullReturned = true
          return
        }
        uri = _uri
      })()
    )
  
    //get mint start/end
    let issueStart:bigint = 0n
    let issueEnd:bigint = 0n
    promises.push(
      (async ():Promise<void> => {
        const timeRangeData = await fetchArticleMintTime(articleId, network)
        if (timeRangeData === null) {
          nullReturned = true
          return
        }
        issueStart = timeRangeData.start
        issueEnd = timeRangeData.end
        return
      })()
    )
  
    await Promise.all(promises)
    if (nullReturned) {
      return null
    }
  
    //article is not set
    if (uri.toString() === '') {
      //sanity check
      if (issueStart != 0n || issueEnd != 0n) {
        throw new Error("uri is not set, but issueStart or issueEnd is. This indicates an admin error on the contract level. Please report it to dev@thedailypepe.com")
      }
      return null
    }
    
    const articleURIData = await fetchArticleURIData(articleId, network)
    if (articleURIData === null) {
      return null
    }
    
    //fetch image
    const localImgURL = await fetchIPFS(articleURIData.articleImage, true)
  
    const article:Article = {
      articleDate: articleURIData.date,
      articleTitle: articleURIData.title,
      articleImageURL: new URL(localImgURL),
      articleText: articleURIData.text,
      articleAuthor: articleURIData.author,
      mintStart: issueStart,
      mintEnd: issueEnd,
      tags: articleURIData.tags,
      articleId,
    }
  
    //cache article
    articleCache[key(articleId, network)] = article
  
    return article
  }
  
  export const _fetchArticlePreview = async (articleId:bigint, network:Chain):Promise<ArticlePreview|null> => {
    if (articlePreviewCache.hasOwnProperty(key(articleId, network))) {
      return articlePreviewCache[key(articleId, network)]
    }
  
    //TODO: build the preview API to only send data necessary and downsized images
    const completeArticle = await _fetchArticle(articleId, network)
    if (!completeArticle) {
      return null
    }
  
    const preview:ArticlePreview = {
      articleDate: completeArticle.articleDate,
      articleTitle: completeArticle.articleTitle,
      articlePreviewImageURL: completeArticle.articleImageURL,
      articlePreviewText: completeArticle.articleText,
      articleId,
    }
    //END TODO/////////////////////////////////////////////////////////////////////
  
    //cache and return the preview
    articlePreviewCache[key(articleId, network)] = preview
    return preview
  }
  
  //returns numArticles most recent articles, or a specific list of articles,
  //at least one parameter is mandatory
  export const _fetchArticlePreviews = async (params:{numArticles?:bigint, offset?: bigint, specificArticles?:bigint[]}, network:Chain):Promise<(ArticlePreview|null)[]> => {
  
    const articleIds:bigint[] = []
    if (params.numArticles && params.specificArticles) {
      throw new Error("fetchArticlePreviews should be called with numArticles OR specificArticles, not both")
    }
    if (params.numArticles) {
      const latestArticleId = await _fetchLatestArticleId(network)
      const end = latestArticleId >= params.numArticles ? latestArticleId - (params.numArticles - 1n) : 0n
      const start = params.offset ? latestArticleId - params.offset : latestArticleId
      for (let i = start; i >= end; i--) {
        articleIds.push(i)
      }
    } else if (params.specificArticles) {
      params.specificArticles.forEach(articleId => {
        articleIds.push(articleId)
      })
    } else {
      throw new Error("fetchArticlePreviews must be called with at least one parameter")
    }
  
    const promises:Promise<ArticlePreview|null>[] = []
    articleIds.forEach(articleId => {
      promises.push(
        (async (id:bigint):Promise<ArticlePreview|null> => {
          return _fetchArticlePreview(id, network)
        })(articleId)
      )
    })
  
    const articlePreviews = await Promise.all(promises)
  
    return articlePreviews
  }
  
  export const _fetchArticleNFT = async (_articleId:bigint|string, network:Chain):Promise<ArticleNFT|null> => {
  
    let articleId:bigint
    if (typeof _articleId === 'string') { // fetch the latest article ID from the contract
      if (_articleId !== 'latest') {
        throw new Error('article must be an integer or \'latest\'')
      }
      articleId = await _fetchLatestArticleId(network)
  
    } else { // we are grabbing the passed article ID
      if (_articleId % 1n !== 0n) {
        throw new Error('article must be an integer or \'latest\'')
      }
      const latestArticleId = await _fetchLatestArticleId(network)
      articleId = _articleId
      if (articleId > latestArticleId) {
        return null
      }
    }
  
    const promises:Promise<void>[] = []
  
    let mintTimeRange:TimeRange = {start: 0n, end: 0n}
    let articleNFTImage:string = ''
    let mintPrice:bigint = 0n
  
    let nullReturned:boolean = false
    promises.push(
      //fetch mint time range
      (async () => {
        const _mintTimeRange = await fetchArticleMintTime(articleId, network)
        if (_mintTimeRange === null) {
          nullReturned = true
          return
        }
        mintTimeRange = _mintTimeRange
      })(),
      //fetch nft image
      (async () => {
        const articleNFTImageURL = await fetchArticleNFTImageURL(articleId, network)
        if (articleNFTImageURL === null) {
          nullReturned = true
          return
        }
        const _articleNFTImage = await fetchIPFS(articleNFTImageURL, true)
        if (_articleNFTImage === null) {
          nullReturned = true
          return
        }
        articleNFTImage = _articleNFTImage
      })(),
      (async () => {
        const _mintPrice = await fetchArticleMintPrice(articleId, network)
        if (_mintPrice === null) {
          nullReturned = true
          return
        }
        mintPrice = _mintPrice
      })()
    )
  
    await Promise.all(promises)
    if (nullReturned) {
      return null
    }
  
    const articleNFT:ArticleNFT = {
      articleNFTImageURL: new URL(articleNFTImage), 
      mintStart: mintTimeRange.start,
      mintEnd: mintTimeRange.end, 
      mintPriceTrue: mintPrice,
      mintPriceDisplay: Number(mintPrice) / (10 ** 18), //ether has 18 decimal places
    }
  
    //cache and return
    articleNFTCache[key(articleId, network)] = articleNFT
    return articleNFT
  }
  
  export const _fetchArticleNFTPreview = async (articleId:bigint, network:Chain):Promise<ArticleNFTPreview | null> => {
  
    //TODO fetch a smaller image for the preview instead of the base article NFT image
    if (articleNFTPreviewCache.hasOwnProperty(key(articleId, network))) {
      return articleNFTPreviewCache[key(articleId, network)]
    }
    const articleNFT = await _fetchArticleNFT(articleId, network)
    if (articleNFT === null) {
      return null
    }
    const articlePreview = await _fetchArticlePreview(articleId, network)
    if (articlePreview === null) {
      return null
    }
    const articleNFTPreview:ArticleNFTPreview = {
      articleImageUrl: articleNFT.articleNFTImageURL,
      articleTitle: articlePreview.articleTitle,
      articleDate: articlePreview.articleDate,
      articleId: articleId,
    }
  
    //cache and return
    articleNFTPreviewCache[key(articleId, network)] = articleNFTPreview
  
    return articleNFTPreview
  }
  
  //returns the balances for all token IDs owned by this account
  //TODO: this function will not scale forever, it needs to be optimized when the number of articles exceeds ~100
  
  //balances cannot be cached, because they will likely updated during the session
  export const _fetchArticleNFTBalances = async (account:Address, network:Chain):Promise<NFTBalance[]> => {
    const addressList:string[] = []
    const articleIdList:bigint[] = []
    const latestArticleId = await _fetchLatestArticleId(network)
    if (latestArticleId  > 1000n) {
      console.log("too many articles for optimal performance, consider optimizing the fetchArticleNFTBalances() api")
    }
    for (let i = 0n; i <= latestArticleId; i++) {
      addressList.push(account)
      articleIdList.push(i)
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const data = await client.readContract({
      abi: articleNFTABI,
      address: getTheDailyPepeArticleNFTAddress(),
      functionName: 'balanceOfBatch',
      args: [addressList, articleIdList],
    })
  
    const balances = data as bigint[]
  
    const NFTBalances:NFTBalance[] = []
    for (let i = 0; i < articleIdList.length; i++) {
      if (balances[i] != 0n) {
        NFTBalances.push({
          articleId: articleIdList[i],
          balance: balances[i],
        })
      }
    }
  
    return NFTBalances
  }
  
  //TODO: change the mint function to use the prepareWriteContract functions before writeContract
  // type prepareMintArticleNFTResult = {
  //   config?: PrepareWriteContractResult,
  //   error?: string,
  //   isError: boolean,
  //   isSuccess: boolean,
  // }
  
  // export const _prepareMintArticleNFT = (id:bigint, numMinted:bigint, recipientAccount:`0x${string}`):{}
  
  export const _mintArticleNFT = async (
    id:bigint, 
    numMinted:bigint, 
    recipientAccount:Address, 
    senderAccount:Address,
    network:Chain, 
    walletClient:WalletClient,
    affiliateAccount?:Address,
  ):Promise<{hash:Hash, error:Error|null, isError:boolean}> => {
    if (!isAddress(recipientAccount)) {
      return {hash: '0x', error: new Error('invalid recipient account: '+recipientAccount+'. not a valid address'), isError: true}
    }
  
    const client = createPublicClient({
      chain: network,
      transport: http()
    })
  
    const mintPrice = await fetchArticleMintPrice(id, network)
    if (!mintPrice) {
      return {hash: '0x', error: new Error('failed to get mint price for article id: '+id.toString()), isError: true}
    }
  
    //mint affiliate
    if(affiliateAccount) {
      const { request } = await client.simulateContract({
        account: senderAccount,
        address: getTheDailyPepeMintControllerAddress(),
        abi: mintControllerABI,
        functionName: 'mintAffiliate',
        chain: network,
        args: [recipientAccount, id, numMinted, affiliateAccount],
        value: mintPrice * numMinted
      })
      const txHash = await walletClient.writeContract(request)
      return { hash: txHash, error: null, isError: false }
    } else {//regular mint
      const { request } = await client.simulateContract({
        account: senderAccount,
        address: getTheDailyPepeMintControllerAddress(),
        abi: mintControllerABI,
        functionName: 'mint',
        chain: network,
        args: [recipientAccount, id, numMinted],
        value: mintPrice * numMinted
      })
      const txHash = await walletClient.writeContract(request)
      return { hash: txHash, error: null, isError: false }
    }
  }
  