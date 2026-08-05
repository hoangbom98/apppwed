// ApiEnvelope đã tồn tại trong api.types.ts — không re-export ở đây

export interface DatingUser {
  id: string | number;
  email?: string | null;
  username?: string | null;
  /** camelCase from backend transform */
  fullName?: string | null;
  /** snake_case alias — some API endpoints return this */
  full_name?: string | null;
  phone?: string | null;
  avatar?: string | null;
  /** photo urls or photo objects returned by some endpoints */
  photos?: string[] | Array<{ id: string | number; url: string }>;
  bio?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  /** snake_case date of birth */
  dob?: string | null;
  /** computed age returned by some endpoints */
  age?: number | null;
  location?: string | null;
  /** snake_case city/location */
  city?: string | null;
  /** proximity in km */
  distance?: number | null;
  coins?: number | string | null;
  diamonds?: number | null;
  isVerified?: boolean;
  /** snake_case alias */
  is_verified?: boolean;
  isVip?: boolean;
  /** snake_case alias */
  is_online?: boolean;
  /** numeric VIP tier */
  vip_level?: number;
  role?: string;
  status?: string;
  lastSeen?: string | null;
  createdAt?: string;
  albums?: DatingAlbum[];
  tags?: string[];
  height?: number | null;
  education?: string | null;
  job?: string | null;
  marriage?: string | null;
  /** nested user wrapper returned by some endpoints */
  user?: DatingUser;
}

export interface DatingAlbumPhoto {
  id: string;
  url: string;
  /** snake_case alias */
  avatar_url?: string | null;
  caption?: string | null;
  sortOrder?: number;
}

export interface DatingAlbum {
  id: string;
  name: string;
  photos: DatingAlbumPhoto[];
}

export interface DatingHomeBanner {
  id: string | number;
  image: string;
  link?: string;
  title?: string;
  subtitle?: string;
}

export interface DatingHomeData {
  me: Pick<DatingUser, 'id' | 'fullName' | 'avatar' | 'coins' | 'isVip' | 'isVerified'> | null;
  recentLikes: number;
  unreadMatches: number;
  /** extra fields returned by home endpoint */
  banners?: DatingHomeBanner[];
  hot_users?: DatingUser[];
  online_users?: DatingUser[];
  nearby_users?: DatingUser[];
  new_users?: DatingUser[];
  vip_users?: DatingUser[];
  recommended?: DatingUser[];
  stories?: DatingStory[];
}

export interface DatingStory {
  id: string | number;
  user?: Pick<DatingUser, 'id' | 'username' | 'avatar' | 'fullName' | 'full_name'>;
  media_url?: string;
  mediaUrl?: string;
  createdAt?: string;
}

export interface DiscoveryFilters {
  minAge: number;
  maxAge: number;
  gender: string;
  onlineOnly: boolean;
  verifiedOnly: boolean;
}

export interface DiscoveryResponse {
  users: DatingUser[];
}

export interface DatingMessage {
  id: string | number;
  roomId?: string;
  room_id?: string;
  senderId?: string | number;
  sender_id?: string | number;
  content: string;
  type: string;
  fileUrl?: string | null;
  media_url?: string | null;
  isRead?: boolean;
  is_recalled?: boolean;
  seen?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  created_at?: string;
  sender?: Pick<DatingUser, 'id' | 'username' | 'avatar'>;
}

export interface DatingConversation {
  id: string;
  type: string;
  name?: string | null;
  members: Array<{
    userId: string;
    user?: Pick<DatingUser, 'id' | 'username' | 'avatar'>;
  }>;
  messages: DatingMessage[];
  updatedAt: string;
}

export interface DatingStats {
  stats: {
    likes_received: number;
    matches: number;
    followers: number;
  };
}

export interface OnboardingPayload {
  gender?: string;
  birthDate?: string;
  bio?: string;
  location?: string;
  goals?: string[];
  interests?: string[];
  /** camelCase */
  genderPref?: string;
  /** snake_case alias some pages send */
  gender_pref?: string;
}

// AuthTokens đã tồn tại trong user.types.ts — không re-export ở đây

export interface DatingAuthTokens {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: DatingUser;
}

export interface UploadAvatarResponse {
  /** snake_case field from upload endpoint */
  avatar_url?: string;
  url?: string;
}
