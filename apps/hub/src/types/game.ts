export interface Category {
  id: string | number;
  name: string;
}

export interface Game {
  id: string | number;
  name: string;
  slug: string;
  image: string;
  link?: string;
  category?: {
    name: string;
  };
}
