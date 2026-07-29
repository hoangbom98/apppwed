import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, Clock, Tag, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogService } from "@/services";

interface Props {
  params: Promise<{ slug: string }>;
}

const CAT_IMAGES: Record<string, string> = {
  "Real Estate": "/business.jpg",
  "Business Acquisitions": "/black-men-cafe-have-business.jpg",
  "Private Equity": "/plants-coins.jpg",
  "AI & Technology": "/businessman-reading.jpg",
  "Digital Assets & Blockchain": "/gold-coins.jpg",
  "Hospitality": "/employees.jpg",
  "Trading & Distribution": "/discussing-business.jpg",
  "Market Insights": "/strategy-ideas.jpg",
  "Company News": "/african-man-black-suit.jpg",
  "Strategic Investment Management": "/portrait-smiling.jpg",
};

const CAT_COLORS: Record<string, string> = {
  "Real Estate": "bg-amber-50 text-amber-700 border-amber-200",
  "Business Acquisitions": "bg-blue-50 text-blue-700 border-blue-200",
  "Private Equity": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "AI & Technology": "bg-purple-50 text-purple-700 border-purple-200",
  "Digital Assets & Blockchain": "bg-orange-50 text-orange-700 border-orange-200",
  "Hospitality": "bg-pink-50 text-pink-700 border-pink-200",
  "Trading & Distribution": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Market Insights": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Company News": "bg-red-50 text-red-700 border-red-200",
  "Strategic Investment Management": "bg-teal-50 text-teal-700 border-teal-200",
};

function formatDate(date: Date | string | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function computeReadTime(content: string) {
  return `${Math.max(1, Math.ceil((content || "").length / 2000))} min read`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPost(post: Record<string, unknown>): any {
  return {
    ...post,
    date: formatDate((post.publishedAt as string | undefined) || (post.createdAt as string | undefined)),
    readTime: computeReadTime(post.content as string),
  };
}

async function getPost(slug: string) {
  try {
    const post = await blogService.getBlogBySlug(slug);
    return mapPost(post as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function getAllPosts() {
  try {
    const { posts } = await blogService.getBlogs({});
    return posts.map((p) => mapPost(p as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPost(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: `${article.title} | Fortress Investment Holdings`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPost(slug);
  if (!article) { notFound(); return; }

  const allPosts = await getAllPosts();
  const related = allPosts.filter((a) => a.slug !== slug).slice(0, 3);
  const heroImage = article.featuredImage || CAT_IMAGES[article.category] || "/business.jpg";

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="relative h-[420px] md:h-[520px] w-full overflow-hidden mt-16">
        <Image
          src={heroImage}
          alt={article.title}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111D] via-[#07111D]/60 to-[#07111D]/20" />
        <div className="absolute bottom-0 left-0 right-0 max-w-[860px] mx-auto px-6 lg:px-8 pb-10">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#C9A24A] text-sm font-medium transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Insights
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[11px] font-bold px-3 py-1.5 border backdrop-blur-sm ${CAT_COLORS[article.category] || "bg-white/90 text-gray-700 border-gray-200"}`}>
              {article.category}
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Article
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
            {article.title}
          </h1>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-[860px] mx-auto px-6 lg:px-8 py-4 flex flex-wrap items-center gap-5 text-sm text-gray-400">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C9A24A]" /> {article.date}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C9A24A]" /> {article.readTime}</span>
          {article.tags && (article.tags as string[]).length > 0 && (
            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#C9A24A]" /> {(article.tags as string[]).join(", ")}</span>
          )}
        </div>
      </div>

      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[860px] mx-auto px-6 lg:px-8">
          <p className="text-xl md:text-2xl text-gray-700 leading-relaxed border-l-4 border-[#C9A24A] pl-6 mb-10 font-light">
            {article.excerpt}
          </p>

          <div
            className="prose prose-gray max-w-none text-gray-600 leading-relaxed space-y-6 text-base"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <div className="mt-14 pt-8 border-t border-gray-200">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#07111D] hover:bg-[#C9A24A] text-white hover:text-[#07111D] text-sm font-bold transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" /> Back to All Insights
            </Link>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-[#F8F9FB] border-t border-gray-200 py-16">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-gray-200" />
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Continue Reading</p>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">More Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((a) => (
                <Link key={a.slug} href={`/insights/${a.slug}`} className="group">
                  <article className="bg-white border border-gray-200 hover:border-[#C9A24A]/40 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="relative h-44 overflow-hidden shrink-0">
                      <Image
                        src={a.featuredImage || CAT_IMAGES[a.category] || "/business.jpg"}
                        alt={a.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width:768px)100vw,33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 border backdrop-blur-sm ${CAT_COLORS[a.category] || "bg-white/90 text-gray-700 border-gray-200"}`}>
                          {a.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 group-hover:text-[#C9A24A] transition-colors flex-1">
                        {a.title}
                      </h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-4 line-clamp-2">{a.excerpt}</p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {a.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.readTime}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
