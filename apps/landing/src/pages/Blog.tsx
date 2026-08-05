import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  previewImage: string;
  coverImage: string;
  category: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.get("/api/public/blogs");
        setPosts(data.blogs || []);
      } catch (err) {
        console.error("Failed to fetch blog posts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(posts.map((p) => p.category))).filter(Boolean);
  }, [posts]);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt &&
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory
      ? post.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl text-center md:text-left mx-auto md:mx-0"
          >
            <p className="text-gold font-body text-xs md:text-sm tracking-[0.3em] uppercase mb-3">
              Market Insights
            </p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-7xl font-bold text-primary-foreground leading-[1.1]">
              OMNIS <span className="text-gradient-gold">Perspectives</span>
            </h1>
            <p className="text-primary-foreground/60 font-body text-base md:text-lg mt-4 md:mt-6 max-w-2xl">
              Deep dives into Dubai's real estate trends, investment guides, and
              regulatory updates from our local experts.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Main Content Area */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-[400px] md:h-[450px] bg-muted/20 animate-pulse rounded-2xl border border-border"
                    />
                  ))}
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
                  {filteredPosts.map((post, i) => (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        className="group bg-background rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-500 block h-full flex flex-col"
                      >
                        <div className="h-52 md:h-60 overflow-hidden relative">
                          <img
                            src={post.previewImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-primary/90 backdrop-blur-md text-gold text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                              {post.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-5 md:p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3 md:mb-4 text-muted-foreground font-body text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.publishedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </div>
                          <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-3 group-hover:text-gold transition-colors line-clamp-2 leading-tight">
                            {post.title}
                          </h2>
                          <p className="text-muted-foreground font-body text-xs md:text-sm leading-relaxed mb-4 md:mb-6 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="mt-auto pt-4 md:pt-6 border-t border-border flex items-center justify-between">
                            <span className="text-foreground font-display font-bold text-[10px] md:text-xs uppercase tracking-widest group-hover:text-gold transition-colors flex items-center gap-2">
                              Explore Article <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/5 rounded-[2.5rem] border-2 border-dashed border-border/50">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    No articles found
                  </h3>
                  <p className="text-muted-foreground font-body">
                    Refine your search parameters and try again.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory(null);
                    }}
                    className="mt-6 text-gold font-display font-black text-xs uppercase tracking-widest hover:tracking-[0.15em] transition-all"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar (Search & Filter) */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-background md:bg-muted/10 p-1 md:p-6 rounded-2xl md:border border-border sticky top-24">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border text-foreground">
                  <Filter className="w-4 h-4 text-gold" />
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest">
                    Search & Filter
                  </h3>
                </div>

                <div className="space-y-8">
                  {/* Search */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                      Keywords
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search articles..."
                        className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3 text-foreground font-body text-sm outline-none focus:border-gold transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
                      Categories
                    </label>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`text-left px-4 py-3 rounded-xl text-sm font-body transition-all border ${
                          selectedCategory === null
                            ? "bg-gold border-gold text-white shadow-md shadow-gold/20 font-bold"
                            : "bg-background border-border hover:border-gold/50 text-foreground"
                        }`}
                      >
                        All Topics
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-left px-4 py-3 rounded-xl text-sm font-body transition-all border ${
                            selectedCategory === cat
                              ? "bg-gold border-gold text-white shadow-md shadow-gold/20 font-bold"
                              : "bg-background border-border hover:border-gold/50 text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
