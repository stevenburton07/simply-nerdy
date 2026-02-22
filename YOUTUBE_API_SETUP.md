# YouTube Data API Setup Guide

Follow these steps to get your YouTube API key and enable automatic video loading.

## Step 1: Create Google Cloud Project (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** → **"New Project"**
4. Name it: `Simply Nerdy Website`
5. Click **"Create"**

## Step 2: Enable YouTube Data API (1 minute)

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for: `YouTube Data API v3`
3. Click on it
4. Click **"Enable"**

## Step 3: Create API Key (1 minute)

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"API Key"**
3. Your API key will be created! Copy it immediately
4. Click **"Restrict Key"** (recommended for security)

## Step 4: Restrict Your API Key (Optional but Recommended)

### Application Restrictions:
- Select: **"HTTP referrers (websites)"**
- Add your website URLs:
  - `https://your-domain.com/*`
  - `http://127.0.0.1:*` (for local testing)
  - `http://localhost:*` (for local testing)

### API Restrictions:
- Select: **"Restrict key"**
- Choose: **"YouTube Data API v3"**
- Click **"Save"**

## Step 5: Add API Key to Your Website (30 seconds)

1. Open `js/youtube-gallery.js`
2. Find this line:
   ```javascript
   const YOUTUBE_API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE';
   ```
3. Replace with your actual API key:
   ```javascript
   const YOUTUBE_API_KEY = 'AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY';
   ```
   (This is an example - use YOUR key!)

4. Save the file

## Step 6: Test It! (10 seconds)

1. Open your website in a browser
2. Check the browser console (F12)
3. You should see: `Successfully loaded X videos from YouTube Data API`
4. Your latest videos should appear!

## Quota Information

**Free Tier Limits:**
- 10,000 units per day (FREE!)
- 1 video list request = 100 units
- You can make **100 requests per day** for free
- This means **100 page loads per day** showing fresh videos

**For most websites, this is more than enough!**

If you exceed the limit:
- Videos will load from cache (30 minutes)
- Or from backup JSON file
- No errors shown to users

## Troubleshooting

### "YouTube API error: 403"
**Problem**: API key restrictions are too strict or quota exceeded

**Solution**:
1. Check API key restrictions match your domain
2. Check quota usage in Google Cloud Console
3. Wait 24 hours if quota exceeded

### "YouTube API error: 400"
**Problem**: Invalid request format

**Solution**: Make sure your channel ID is correct in `youtube-gallery.js`

### "YouTube API key not configured"
**Problem**: API key still has placeholder value

**Solution**: Replace `YOUR_YOUTUBE_API_KEY_HERE` with your actual key

### Videos still not loading
**Solution**:
1. Open browser console (F12)
2. Check for error messages
3. Verify API key is correct (no typos)
4. Check if YouTube Data API v3 is enabled in Google Cloud

## Cost

**Completely FREE** for normal website usage!

YouTube Data API v3 free tier includes:
- 10,000 units/day
- Perfect for personal/small websites
- Resets daily at midnight Pacific Time

## Security Best Practices

✅ **DO**:
- Restrict API key to your domain
- Restrict to YouTube Data API v3 only
- Keep API key in version control (it's meant to be public for client-side use)

❌ **DON'T**:
- Share your API key publicly in forums
- Use the same key for multiple projects
- Use a service account key (use API key instead)

## Alternative: Keep Using Backup JSON

If you don't want to set up the API:
1. Leave `YOUTUBE_API_KEY` as `'YOUR_YOUTUBE_API_KEY_HERE'`
2. Manually update `data/videos.json` with your video IDs
3. Videos will load from your backup file

This works fine, but requires manual updates when you post new videos.

## Support

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)

---

**Estimated Setup Time**: 5 minutes
**Cost**: $0 (FREE tier)
**Difficulty**: Easy ⭐
