import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { ArrowLeft, Save, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const categories = [
  "Investment",
  "Guide",
  "News",
  "Lifestyle",
  "Market Report",
];

const BlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "News",
    status: "published",
    coverImage: "",
    previewImage: "",
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [previewPreview, setPreviewPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      const fetchBlog = async () => {
        try {
          const { data } = await api.get(`/api/public/blogs/id/${id}`);
          setFormData({
            title: data.blog.title,
            excerpt: data.blog.excerpt,
            content: data.blog.content,
            category: data.blog.category,
            status: data.blog.status,
            coverImage: data.blog.coverImage,
            previewImage: data.blog.previewImage,
          });
          setCoverPreview(data.blog.coverImage);
          setPreviewPreview(data.blog.previewImage);
        } catch (err) {
          toast.error("Failed to load blog post");
          navigate("/admin/blogs");
        } finally {
          setLoading(false);
        }
      };
      fetchBlog();
    }
  }, [id, isEdit, navigate]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "preview",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "cover") {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      } else {
        setPreviewFile(file);
        setPreviewPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("excerpt", formData.excerpt);
      submitData.append("content", formData.content);
      submitData.append("category", formData.category);
      submitData.append("status", formData.status);

      if (coverFile) submitData.append("coverImage", coverFile);
      if (previewFile) submitData.append("previewImage", previewFile);

      if (isEdit) {
        await api.patch(`/api/dashboard/blogs/${id}`, {
          data: submitData,
        });
        toast.success("Blog post updated successfully");
      } else {
        if (!coverFile || !previewFile) {
          toast.error("Please upload both cover and preview images");
          setSaving(false);
          return;
        }
        await api.post("/api/dashboard/blogs", {
          data: submitData,
        });
        toast.success("Blog post created successfully");
      }
      navigate("/admin/blogs");
    } catch (err) {
      toast.error("Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/blogs"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </Link>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground font-title">
            {isEdit ? "Edit Article" : "Create New Article"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-background rounded-2xl border border-border p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Article Title
              </label>
              <input
                required
                type="text"
                placeholder="e.g., The Future of Dubai Real Estate"
                className="w-full bg-muted/20 border-border rounded-xl px-4 py-3 outline-none focus:ring-1 ring-gold font-body"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Category
                </label>
                <select
                  className="w-full bg-muted/20 border-border rounded-xl px-4 py-3 outline-none focus:ring-1 ring-gold font-body appearance-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Status
                </label>
                <select
                  className="w-full bg-muted/20 border-border rounded-xl px-4 py-3 outline-none focus:ring-1 ring-gold font-body appearance-none"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Cover Image (Large)
                </label>
                <div className="relative group">
                  <div className="aspect-video bg-muted/20 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Upload cover image
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileChange(e, "cover")}
                    />
                  </div>
                  {coverPreview && (
                    <div className="mt-2 text-[10px] text-muted-foreground font-body">
                      Click to change cover image
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Preview Image (Card)
                </label>
                <div className="relative group">
                  <div className="aspect-square bg-muted/20 rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center relative">
                    {previewPreview ? (
                      <img
                        src={previewPreview}
                        alt="Preview Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Upload card preview
                        </p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileChange(e, "preview")}
                    />
                  </div>
                  {previewPreview && (
                    <div className="mt-2 text-[10px] text-muted-foreground font-body">
                      Click to change preview image
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Short Excerpt
              </label>
              <textarea
                required
                rows={3}
                placeholder="A brief summary for the blog card..."
                className="w-full bg-muted/20 border-border rounded-xl px-4 py-3 outline-none focus:ring-1 ring-gold font-body text-sm"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Content
              </label>
              <div className="bg-muted/5 rounded-xl border border-border overflow-hidden min-h-[400px]">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  modules={quillModules}
                  className="h-[350px] font-body"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild disabled={saving}>
              <Link to="/admin/blogs">Cancel</Link>
            </Button>
            <Button variant="gold" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {isEdit ? "Update Article" : "Publish Article"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default BlogForm;
