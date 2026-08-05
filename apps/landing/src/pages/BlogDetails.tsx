import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft, Share2, Facebook, Linkedin } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BlogPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  coverImage: string;
  previewImage: string;
  category: string;
  publishedAt: string;
}

const BlogDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/api/public/blogs/${slug}`);
        setPost(data.blog);
      } catch (error) {
        console.error("Failed to fetch blog post", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-64 bg-muted rounded-xl w-full" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="pt-32 pb-20 px-4 text-center">
          <h1 className="text-2xl font-bold mb-6">Post not found</h1>
          <Button asChild>
            <Link to="/blog">Return to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="pt-24 md:pt-32 pb-20 overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14"
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="px-3 py-1 bg-primary/10 rounded text-primary text-xs font-semibold uppercase tracking-wide">
                {post.category}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-8">
              {post.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-b py-6">
              <div>
                <p className="font-semibold">{post.author}</p>
                <p className="text-sm text-muted-foreground">
                  Senior Market Strategist
                </p>
              </div>

              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border rounded hover:bg-muted transition"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border rounded hover:bg-muted transition"
                >
                  <Linkedin className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied!");
                  }}
                  className="p-2 border rounded hover:bg-muted transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* COVER IMAGE */}
          <div className="rounded-xl overflow-hidden mb-16">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* BLOG CONTENT (FULLY RESPONSIVE FIXED) */}
          <div
            className="
              prose
              prose-sm
              sm:prose-base
              lg:prose-lg
              max-w-none
              w-full

              prose-img:rounded-xl
              prose-img:w-full
              prose-img:max-w-full
              prose-img:h-auto

              prose-video:w-full
              prose-iframe:w-full

              prose-table:block
              prose-table:overflow-x-auto

              [&_*]:max-w-full
              [&_*]:break-words
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* NEWSLETTER */}
          <div className="mt-20 bg-muted rounded-xl p-8 sm:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get expert insights delivered directly to your inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 border rounded px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
              />
              <Button className="px-6 py-3">Subscribe</Button>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogDetails;