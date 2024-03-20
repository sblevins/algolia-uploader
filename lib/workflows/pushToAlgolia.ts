import algoliasearch, { SearchClient } from 'algoliasearch';
import { Article } from '../../types/apiTypes';

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
  await index.saveObjects(records);
}
