import { FetchLatestArticle } from "./lib/workflows/fetchFromWeb3";
import { algoliaClient, pushToAlgolia } from "./lib/workflows/pushToAlgolia";

(async()=>{
    const client = algoliaClient;
    const indexName = 
        process.env.ALGOLIA_INDEX_NAME == undefined 
        ? "daily-pepe-test-index-article" 
        : process.env.ALGOLIA_INDEX_NAME;
    await FetchLatestArticle().then((res) => {
        return pushToAlgolia(client, indexName, [res]);
    })
})();