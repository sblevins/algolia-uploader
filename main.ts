import { FetchLatestArticle } from "./lib/workflows/fetchFromWeb3";
import { algoliaClient, pushToAlgolia } from "./lib/workflows/pushToAlgolia";
const INDEX = "dev_articles";
console.log("Using index: ", INDEX, "for Algolia. You can change this in the .env file.");

(async()=>{
    const client = algoliaClient;
    const indexName = 
        process.env.ALGOLIA_INDEX_NAME == undefined 
        ? "dev_articles" 
        : process.env.ALGOLIA_INDEX_NAME;
    await FetchLatestArticle().then((res) => {
        return pushToAlgolia(client, indexName, [res]);
    })
})();