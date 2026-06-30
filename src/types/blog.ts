export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverColor: string
  category: string
  tag: string
  date: string
  readingTime: number
  views: number
}

export interface Author {
  name: string
  role: string
  bio: string
  socials: SocialLink[]
  skills: string[]
}

export interface SocialLink {
  label: string
  href: string
}
