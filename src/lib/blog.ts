// blog-data.generated.json is produced by scripts/generate-blog-data.js
// (runs before `next build`, see package.json). Reading it as a plain JSON
// import -- rather than the filesystem at request time -- means every
// consumer of this module (static pages, ISR routes, on-demand
// regeneration functions) gets a dependency every bundler resolves
// correctly by construction. See generate-blog-data.js for why that
// matters here.
import blogData from './blog-data.generated.json';

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  image: string;
  imageAlt: string;
  tags: string[];
  readingTime: string;
}

export interface BlogPost extends BlogFrontmatter {
  slug: string;
  content: string;
}

const posts = blogData as BlogPost[];

export function getAllPostSlugs(): string[] {
  return posts.map((post) => post.slug);
}

export function getPostBySlug(slug: string): BlogPost | null {
  return posts.find((post) => post.slug === slug) ?? null;
}

export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
