const Blog = require("../models/Blog");
const marked = require("marked");

exports.getBlogs = async (req, res) => {
    try {
      const language = req.query.lang || "en";
  
      const blogs = await Blog.find({}, "_id title translations createdAt").lean();
  
      const formattedBlogs = blogs.map((blog) => {
        return {
          title: blog.title,
          content: marked.parse(blog.translations?.[language]) || marked.parse(blog.translations?.en) || "Translation not available",
          createdAt: blog.createdAt,
          _id: blog._id
        };
      });

      res.render("blogs", { title: "Blogs", blogs: formattedBlogs, language });
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  