import { MongoClient } from "mongodb";
import { BlogSlug } from "./types";

type mongoCallback<T> = (client: MongoClient) => Promise<T>;

export async function dbConnect<T>(cb: mongoCallback<T>) {
  const client = new MongoClient(process.env.MONGO_URI as string);
  return cb(client);
}
export function fetchSearchQuery(key: string) {
  return dbConnect<Array<Partial<BlogSlug>>>(async (client) => {
    try {
      await client.connect();
      const cursors = client
        .db()
        .collection(process.env.BLOG_COLLECTION as string)
        .find(
          { isArchived: false, $text: { $search: key } },
          { projection: { title: 1, uri: 1, tags: 1, createdAt: 1 } }
        );
      const blogs = (await cursors.toArray()) as Array<Partial<BlogSlug>>;
      return blogs;
    } catch (e) {
      console.error(e);
      return Promise.reject(
        "Something went wrong. Error => " + JSON.stringify(e)
      );
    } finally {
      await client.close();
    }
  });
}
