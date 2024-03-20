import { ArticleToAlgoliaIndexArticle } from "../../types/apiTypes";
import { fetchArticle, fetchLatestArticleId } from "../dataSource/api";

export async function FetchLatestArticle() {
    fetchLatestArticleId().then((res) => {
        if (res == null)  throw new Error("FetchLatestArticle: articleId is null");
        return fetchArticle(res).then((res) => {
            if (res == null) throw new Error("FetchLatestArticle: article is null");
            return ArticleToAlgoliaIndexArticle(res);
        });
    });
}