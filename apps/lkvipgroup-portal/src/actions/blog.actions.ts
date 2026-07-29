"use server";

import { blogService } from "@/services";
import type { BlogInput } from "@/services/blog.service";

export async function createBlogAction(data: BlogInput) {
  try {
    const post = await blogService.createBlog(data);
    return { success: true, data: JSON.parse(JSON.stringify(post)) };
  } catch {
    return { success: false, message: "Failed to create blog post" };
  }
}

export async function updateBlogAction(slug: string, data: Partial<BlogInput>) {
  try {
    const post = await blogService.updateBlog(slug, data);
    return { success: true, data: JSON.parse(JSON.stringify(post)) };
  } catch {
    return { success: false, message: "Failed to update blog post" };
  }
}

export async function deleteBlogAction(slug: string) {
  try {
    await blogService.deleteBlog(slug);
    return { success: true };
  } catch {
    return { success: false, message: "Failed to delete blog post" };
  }
}

export async function publishBlogAction(slug: string) {
  try {
    const post = await blogService.publishBlog(slug);
    return { success: true, data: JSON.parse(JSON.stringify(post)) };
  } catch {
    return { success: false, message: "Failed to publish blog post" };
  }
}
