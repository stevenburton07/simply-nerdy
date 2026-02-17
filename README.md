# Simply Nerdy

A modern, minimal website for the Simply Nerdy YouTube channel. Built with vanilla HTML, CSS, and JavaScript.

## Features

- **Homepage** with hero section, featured YouTube videos, and latest blog posts
- **Blog System** with JSON-based content management, category filtering, and dynamic post rendering
- **About Page** showcasing the channel's mission and topics
- **YouTube Video Gallery** displaying latest videos with thumbnails
- **Responsive Design** optimized for mobile, tablet, and desktop
- **Modern UI** with custom red (#E60012) and light gray (#F2F2F2) color scheme

## Project Structure

```
simply_nerdy/
├── index.html              # Homepage
├── about.html              # About page
├── articles.html           # Articles archive
├── article.html            # Single article template
├── css/
│   ├── main.css           # Design system & global styles
│   ├── layout.css         # Grid systems & layouts
│   ├── components.css     # Reusable components
│   └── responsive.css     # Mobile-first breakpoints
├── js/
│   ├── app.js             # Main app initialization
│   ├── blog-loader.js     # Blog post loading & rendering
│   ├── youtube-gallery.js # YouTube video gallery
│   └── utils.js           # Utility functions
├── data/
│   ├── blog-posts.json    # Blog post content
│   └── videos.json        # YouTube video data
└── images/
    ├── logo.svg           # Channel logo (add your own)
    ├── hero.jpg           # Hero image (add your own)
    └── thumbnails/        # Blog post images
```

## Getting Started

### Local Development

1. Clone the repository or download the files
2. Open `index.html` in your browser
3. Use a local server for the best experience:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve

   # Using PHP
   php -S localhost:8000
   ```
4. Navigate to `http://localhost:8000`

### Customization

#### Update YouTube Videos

Edit `data/videos.json` and replace the video IDs with your actual YouTube video IDs:

```json
{
  "videos": [
    {
      "id": "YOUR_VIDEO_ID",
      "title": "Your Video Title",
      "date": "2024-02-12",
      "description": "Video description"
    }
  ]
}
```

To find your video ID: the ID is the part after `v=` in your YouTube URL.
Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` → ID is `dQw4w9WgXcQ`

#### Add Blog Posts

Edit `data/blog-posts.json` to add new blog posts:

```json
{
  "posts": [
    {
      "id": "unique-id",
      "title": "Post Title",
      "slug": "post-title",
      "date": "2024-02-12",
      "category": "JavaScript",
      "excerpt": "Brief description...",
      "content": "<p>Full HTML content...</p>",
      "tags": ["tag1", "tag2"],
      "author": "Simply Nerdy",
      "image": "path/to/image.jpg"
    }
  ]
}
```

#### Update Colors

The color scheme is defined in `css/main.css` using CSS variables:

```css
:root {
    --primary: #E60012;      /* Main brand color */
    --accent: #F2F2F2;       /* Accent color */
    /* ... */
}
```

#### Update Links

Replace placeholder links throughout the HTML files:
- YouTube channel URL: `https://youtube.com/@SimplyNerdy`
- Social media links in footer and about page
- Update `href` attributes with your actual URLs

## Deployment

### GitHub Pages

1. Initialize Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push to GitHub:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git branch -M main
   git push -u origin main
   ```

4. Enable GitHub Pages:
   - Go to repository Settings > Pages
   - Select branch: `main`
   - Select folder: `/ (root)`
   - Click Save

5. Your site will be live at: `https://yourusername.github.io/simply-nerdy/`

### Netlify

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Log in to [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Connect your repository
5. Configure build settings:
   - Build command: Leave empty (static site)
   - Publish directory: `/` (root)
6. Click "Deploy site"

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- HTML5
- CSS3 (Flexbox, Grid, CSS Variables)
- Vanilla JavaScript (ES6+)
- No build tools or dependencies required

## License

This project is open source and available for personal and commercial use.

## Credits

Created for the Simply Nerdy YouTube channel.

Sample images from Unsplash (replace with your own images).
