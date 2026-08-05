import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  FileText,
  Search as SearchIcon,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface BlogPost {
  _id: string;
  title: string;
  category: string;
  status: string;
  publishedAt: string;
  createdAt: string;
  slug: string;
}

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get("/api/dashboard/blogs");
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error("Failed to fetch blogs", err);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await api.delete(`/api/dashboard/blogs/${id}`);
      toast.success("Blog post deleted");
      setBlogs(blogs.filter((b) => b._id !== id));
    } catch (err) {
      toast.error("Failed to delete blog post");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground font-title">
            Manage Blogs
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Create and edit insights, news, and guides.
          </p>
        </div>
        <Button variant="gold" asChild className="shrink-0">
          <Link to="/admin/blogs/add">
            <Plus className="w-4 h-4 mr-2" /> New Article
          </Link>
        </Button>
      </div>

      <div className="mb-8 p-3 md:p-4 bg-background rounded-2xl border border-border shadow-sm flex items-center">
        <div className="relative w-full">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title or category..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/20 border-border font-body text-sm outline-none focus:ring-1 ring-gold/30 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            Loading articles...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body bg-muted/5 rounded-2xl border-2 border-dashed border-border/50">
            <FileText className="w-12 h-12 mx-auto opacity-20 mb-3" />
            <p>No articles found.</p>
          </div>
        ) : (
          filteredBlogs.map((blog, i) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-background rounded-xl border border-border p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base md:text-lg mb-1">
                    {blog.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-body">
                    <span className="text-gold font-bold uppercase tracking-wider">
                      {blog.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(
                        blog.publishedAt || blog.createdAt,
                      ).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        blog.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0"
                >
                  <Link to={`/blog/${blog.slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0"
                >
                  <Link to={`/admin/blogs/edit/${blog._id}`}>
                    <Edit className="w-4 h-4 text-primary" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(blog._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

export default ManageBlogs;
