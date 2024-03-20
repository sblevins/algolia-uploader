import { Address } from "viem"

const addressBook = {
  hardhat: {
    theDailyPepeArticleNFTAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as Address,
    theDailyPepeMintControllerAddress: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as Address
  },
  sepolia: {
    theDailyPepeArticleNFTAddress: '0xe38ff38e956ac9aB0E7ab4DE190d3EC320172357' as Address,
    theDailyPepeMintControllerAddress: '0x04254954e09A0805401B7827C013ceaE47fB7de4' as Address
  },
  arbitrum: {
    theDailyPepeArticleNFTAddress: '' as Address,
    theDailyPepeMintControllerAddress: '' as Address
  }
}

export const getTheDailyPepeArticleNFTAddress = ():Address => {
  switch (process.env.REACT_APP_NETWORK) {
  case 'HARDHAT':
    return addressBook.hardhat.theDailyPepeArticleNFTAddress
  case 'SEPOLIA':
    return addressBook.sepolia.theDailyPepeArticleNFTAddress
  case 'ARBITRUM':
    return addressBook.arbitrum.theDailyPepeArticleNFTAddress
  default:
    console.log("error! network environment variable set, returning arbitrum")
    return addressBook.arbitrum.theDailyPepeArticleNFTAddress
  }
}

export const getTheDailyPepeMintControllerAddress = ():Address => {
  switch (process.env.REACT_APP_NETWORK) {
    case 'HARDHAT':
      return addressBook.hardhat.theDailyPepeMintControllerAddress
    case 'SEPOLIA':
      return addressBook.sepolia.theDailyPepeMintControllerAddress
    case 'ARBITRUM':
      return addressBook.arbitrum.theDailyPepeMintControllerAddress
    default:
      console.log("error! network environment variable set, returning arbitrum")
      return addressBook.arbitrum.theDailyPepeMintControllerAddress
  }
}