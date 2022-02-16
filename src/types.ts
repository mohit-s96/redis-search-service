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

export interface CommentSchema {
  _id?: string;
  blogId: string;
  createdAt: number;
  author: string;
  authorGhId: number;
  inReplyToUser: number | "default";
  isAdmin: boolean;
  hasMarkdown: boolean;
  isVisible: boolean;
  isDeleted: boolean;
  inReplyToComment: string;
  body: string;
  html: string;
  hadIllegalHtml: boolean;
  lastUpdated: number;
  deletedAt: number;
  inReplyToUsername: string;
  authorAvatar: string;
}

export type UserSubmittedCommentSchema = Omit<
  CommentSchema,
  | "createdAt"
  | "author"
  | "authorGhId"
  | "isAdmin"
  | "isVisible"
  | "isDeleted"
  | "html"
  | "hadIllegalHtml"
  | "lastUpdated"
  | "deletedAt"
  | "authorAvatar"
>;

export interface Auth {
  username: string;
  id: number;
  avatar: string;
}

export interface GithubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export type PatchComment = Pick<
  CommentSchema,
  "body" | "html" | "hasMarkdown" | "hadIllegalHtml" | "lastUpdated"
>;
