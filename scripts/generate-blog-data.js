// Runs before `next build` (see package.json's build script) to bake every
// content/blog/*.mdx file into a plain JSON module. src/lib/blog.ts imports
// that JSON directly instead of reading the filesystem at request time.
//
// Why this exists: the previous approach (fs.readdirSync/readFileSync on a
// path built from process.cwd()) worked for statically-generated blog pages
// (Next's tracer observes their real build-time execution) but not for the
// sitemap's on-demand ISR regeneration, which runs through a separate,
// independently-bundled function on Vercel that never picked up content/blog
// in its own file trace -- silently returning an empty post list per region
// as each region's cache expired and regenerated. A JSON import is a plain
// static dependency every bundler (webpack, Turbopack, @vercel/nft) resolves
// correctly by construction, so there's no tracer heuristic left to miss it.
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'lib', 'blog-data.generated.json');

function generate() {
  if (!fs.existsSync(BLOG_DIR)) {
    fs.writeFileSync(OUTPUT_FILE, '[]\n');
    console.log('[generate-blog-data] content/blog not found, wrote empty array');
    return;
  }

  const posts = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      return { slug, content, ...data };
    });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2) + '\n');
  console.log(`[generate-blog-data] wrote ${posts.length} post(s) to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

generate();
