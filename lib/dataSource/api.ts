import { 
    Address, 
    Chain,
    Hash,
  } from 'viem'
  import { arbitrum, sepolia } from 'viem/chains'
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
  import { getAccount, getNetwork, getWalletClient, switchNetwork } from '@wagmi/core'
  
  const validNetworks = [arbitrum, sepolia]
  const defaultNetwork = sepolia //TODO: set this to arbitrum once testing is done
  
  //check if the user's wallet is connected to a valid network, if not, switch it to the defaultNetwork
  const validateNetwork = async ():Promise<Chain> => {
    const currentNet = getNetwork()
    //if we can't get hte current network
    if (!currentNet.chain) {
      const res = await switchNetwork({chainId: defaultNetwork.id})
      return defaultNetwork
    }
    //check if the current network is valid
    for (let i = 0; i < validNetworks.length; i++) {
      if(currentNet.chain?.id === validNetworks[i].id) {
        return currentNet.chain
      }
    }
    //invalid network, switch to default
    const res = await switchNetwork({chainId: defaultNetwork.id})
    return defaultNetwork
  }
  
  //used for generic deplay api calls, not for calls specific to a single user's account
  //check if the user's current network is a valid network, if valid return user's network, if not return default network
  export const getReadOnlyNetwork = ():Chain => {
    const currentNet = getNetwork()
    //if we can't get hte current network
    if (!currentNet.chain) {
      return defaultNetwork
    }
    //check if the current network is valid
    for (let i = 0; i < validNetworks.length; i++) {
      if(currentNet.chain?.id === validNetworks[i].id) {
        return currentNet.chain
      }
    }
    //invalid network, return the default
    return defaultNetwork
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
  
  export const fetchArticleNFTBalances = async (account:Address):Promise<NFTBalance[]> => {
    const network = await validateNetwork()
    return _fetchArticleNFTBalances(account, network)
  }
  
  export const mintArticleNFT = async (
    id:bigint,
    numMinted:bigint,
    recipientAccount:Address,
    affiliateAccount?:Address,
  ):Promise<{hash:Hash, error:Error|null, isError:boolean}> => {
    const promises:Promise<any>[] = []
    promises.push(
      validateNetwork()
    )
    promises.push(
      getWalletClient()
    )
    const senderAccount = getAccount()
    if (!senderAccount.address) {
      throw new Error("failed to get wallet account")
    }
    try {
      const [ network, walletClient ] = await Promise.all(promises)
      return await _mintArticleNFT(id, numMinted, recipientAccount, senderAccount.address, network, walletClient, affiliateAccount)
    } catch (error:any) {
      return {hash: "0x", error, isError:true}
    }
  }