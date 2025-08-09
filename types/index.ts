export interface Novel {
  id: string
  title: string
  author: string
  description: string
  cover_image: string | null
  category: string
  original_language: string
  translated_language: string
  total_chapters: number
  free_chapters: number
  price: number
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  novel_id: string
  chapter_number: number
  title: string
  content: string
  is_free: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface UserPurchase {
  id: string
  user_id: string
  novel_id: string
  purchased_at: string
}

export interface BookshelfItem {
  id: string
  user_id: string
  novel_id: string
  last_read_chapter: number | null
  added_at: string
  novel?: Novel
}

export type RootStackParamList = {
  Main: undefined
  NovelDetail: { novel: Novel; isInBookshelf?: boolean }
  Reader: { novel: Novel, chapterNumber: number }
  Auth: undefined
}

export type MainTabParamList = {
  Bookshelf: undefined
  Recommendations: undefined
  Categories: undefined
  Profile: undefined
}

export const CATEGORIES = [
  'Fantasy',
  'Urban',
  'Xianxia',
  'Historical',
  'Military',
  'Gaming',
  'Sports',
  'Sci-Fi',
  'Supernatural',
  'Fanfiction'
] as const

export type Category = typeof CATEGORIES[number]

// Category mapping for display
export const CATEGORY_MAPPING = {
  '玄幻': 'Fantasy',
  '都市': 'Urban', 
  '仙侠': 'Xianxia',
  '历史': 'Historical',
  '军事': 'Military',
  '游戏': 'Gaming',
  '竞技': 'Sports',
  '科幻': 'Sci-Fi',
  '灵异': 'Supernatural',
  '同人': 'Fanfiction'
} as const 