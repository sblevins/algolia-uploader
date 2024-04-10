import { 
    Address, 
    Chain,
    Hash,
  } from 'viem'
  import { base, sepolia } from 'viem/chains'
  import { Article, ArticleNFT, ArticlePreview, ArticleNFTPreview, NFTBalance } from '../../types/apiTypes'
  import { 
    _fetchArticle, 
    _fetchArticleNFT, 
    _fetchArticleNFTBalances, 
    _fetchArticleNFTPreview, 
    _fetchArticlePreview, 
    _fetchArticlePreviews, 
    _fetchLatestArticleId, 
    _mintArticleNFT
  } from './apiCore'
  
  const validNetworks = [base, sepolia]
  const defaultNetwork = sepolia //TODO: set this to arbitrum once testing is done
  
  
  //used for generic deplay api calls, not for calls specific to a single user's account
  //check if the user's current network is a valid network, if valid return user's network, if not return default network
  export const getReadOnlyNetwork = ():Chain => {
    if (process.env.NETWORK == "SEPOLIA") {
      return sepolia
    } else if (process.env.NETWORK == "BASE") {
      return base
    } else {
      console.log("invalid network! set the env variable for network:", process.env.NETWORK)
      process.abort()
    }
  }
  
  export const fetchLatestArticleId = async ():Promise<bigint> => {
    const network = getReadOnlyNetwork()
    return _fetchLatestArticleId(network)
  }
  
  
  export const fetchArticle = async (articleId:string|bigint):Promise<Article|null> => {
    const network = getReadOnlyNetwork()
    return _fetchArticle(articleId, network)
  }
  
  export const fetchArticlePreview = async (articleId:bigint):Promise<ArticlePreview|null> => {
    const network = getReadOnlyNetwork()
    return _fetchArticlePreview(articleId, network)
  }
  
  export const fetchArticlePreviews = async (params:{numArticles?:bigint, offset?:bigint, specificArticles?:bigint[]}) => {
    const network = getReadOnlyNetwork()
    return _fetchArticlePreviews(params, network)
  }
  
  export const fetchArticleNFT = async (articleId:bigint|string):Promise<ArticleNFT|null> => {
    const network = getReadOnlyNetwork()
    return _fetchArticleNFT(articleId, network)
  }
  
  export const fetchArticleNFTPreview = async (articleId:bigint):Promise<ArticleNFTPreview|null> => {
    const network = getReadOnlyNetwork()
    return _fetchArticleNFTPreview(articleId, network)
  }
  
  export const fetchArticleNFTPreviews = (articleIds:bigint[]):Promise<ArticleNFTPreview|null>[] => {
    const network = getReadOnlyNetwork()
    return articleIds.map((articleId:bigint):Promise<ArticleNFTPreview|null> => {
      return _fetchArticleNFTPreview(articleId, network)
    })
  }
