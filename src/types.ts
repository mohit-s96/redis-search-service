import { ObjectId } from "bson";
export interface BlogMetadata {
  links: string[];
  atMentions: string[];
  hashTags: string[];
}
export type SupaUploadResponseType = {
  data: {
    Key: string;
  } | null;
  error: Error | null;
};
export interface NewImageData {
  permUri: SupaUploadResponseType[];
  alt: string;
  uri?: string;
  isHero?: boolean | undefined;
}
export type SlugType = "html" | "md" | "nm";

export interface BlogSlug {
  _id?: ObjectId;
  rawBody?: string;
  title: string;
  uri: string;
  tags: string[];
  createdAt: number;
  images: NewImageData[];
  blogData: string;
  shares: number;
  likes: number;
  excerpt: string;
  author: string;
  commentsAllowed: boolean;
  commentCount: number;
  metadata?: BlogMetadata;
  viewCount: number;
  slugType: SlugType;
  readingTime: string;
  lastEdited: number | null;
  isArchived: boolean;
}
