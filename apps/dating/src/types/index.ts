export interface Author {
  id: number;
  full_name: string;
  avatar: string;
}

export interface Post {
  id: number;
  author: Author;
  content: string;
  created_at: string;
  images: string[];
  hashtags: string[];
  is_liked: boolean;
  like_count: number;
  comment_count: number;
}

export interface Profile {
  id: number;
  full_name: string;
  avatar: string;
  age: number;
  city: string;
  bio: string;
  is_verified: boolean;
  photos: string[];
  tags: string[];
}
