import algoliasearch, { SearchClient } from 'algoliasearch';
import { Article } from '../../types/apiTypes';

declare type SerializableArticle = {
  objectID: string,
  articleDate: string //format DD-MM-YYYY
  articleTitle: string
  articleImageURL: URL | string
  articleText: string
  articleAuthor: string
  mintStart: string //earliest time this article can be minted in unix time (seconds)
  mintEnd: string //deadline to mint this article in unix time (seconds)
  tags: string[]
  articleId: string
}

// Clean this up later
export const algoliaClient = algoliasearch(
    process.env.ALGOLIA_APP_ID == undefined ? "" : process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY == undefined ? "" : process.env.ALGOLIA_API_KEY,
);

export async function pushToAlgolia(
  client: SearchClient,
  indexName: string,
  records: Article[]
) {
  const index = client.initIndex(indexName);
  const recordsWithIds = records.map(record => {
    const serializableRecord:SerializableArticle = {
      articleDate: record.articleDate,
      articleTitle: record.articleTitle,
      articleImageURL: record.articleImageURL,
      articleText: record.articleText,
      articleAuthor: record.articleAuthor,
      mintStart: record.mintStart.toString(),
      mintEnd: record.mintEnd.toString(),
      tags: record.tags,
      articleId: record.articleId.toString(),
      objectID: record.articleId.toString(),
    }
    return serializableRecord
  })
  await index.saveObjects(recordsWithIds);
}
