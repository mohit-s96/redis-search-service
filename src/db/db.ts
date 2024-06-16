import { MongoClient, ObjectId } from "mongodb";
import { BlogSlug, CommentSchema, PatchComment } from "../types";

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
        .aggregate([
          {
            $search: {
              index: "default",
              text: {
                query: key,
                path: {
                  wildcard: "*",
                },
              },
            },
          },
          {
            $project: {
              title: 1,
              uri: 1,
              tags: 1,
              createdAt: 1,
              isArchived: 1,
              excerpt: 1,
            },
          },
        ]);
      let blogs = (await cursors.toArray()) as Array<Partial<BlogSlug>>;
      blogs = blogs.filter((blog) => !blog.isArchived);
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
export function setComment(data: CommentSchema) {
  return dbConnect(async (client) => {
    try {
      await client.connect();
      const cursors = client
        .db()
        .collection(process.env.COMMENT_COLLECTION as string);

      const doc = await cursors.insertOne(data as any);
      return doc;
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

export function fetchComments(idString: string) {
  return dbConnect<CommentSchema[]>(async (client) => {
    try {
      await client.connect();
      const cursors = client
        .db()
        .collection(process.env.COMMENT_COLLECTION as string)
        .find({ blogId: idString });
      const blogs = ((await cursors.toArray()) as any) as CommentSchema[];
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

export function deleteComment(_id: ObjectId | string) {
  _id = new ObjectId(_id);
  return dbConnect(async (client) => {
    try {
      await client.connect();
      const cursors = client
        .db()
        .collection(process.env.COMMENT_COLLECTION as string);
      await cursors.updateOne(
        { _id },
        {
          $set: {
            isDeleted: true,
            deletedAt: Date.now(),
          },
        }
      );
      return "success";
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

export function updateComment(_id: string | ObjectId, data: PatchComment) {
  _id = new ObjectId(_id);
  return dbConnect(async (client) => {
    try {
      await client.connect();
      const cursors = client
        .db()
        .collection(process.env.COMMENT_COLLECTION as string);
      await cursors.updateOne(
        { _id },
        {
          $set: {
            hasMarkdown: data.hasMarkdown,
            body: data.body,
            html: data.html,
            hadIllegalHtml: data.hadIllegalHtml,
            lastUpdated: data.lastUpdated,
          },
        }
      );
      return "success";
    } catch (e) {
      console.error(e);
      throw "Something went wrong. Error => " + e;
    } finally {
      await client.close();
    }
  });
}
