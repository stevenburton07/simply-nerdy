# Simply Nerdy - Transcript-to-Article Automation

Automated system that converts Simply Nerdy podcast episode transcripts into formatted articles for the website using **Claude API** by Anthropic.

## Features

✅ **Automated Processing** - Drop transcript files and get published articles
✅ **AI-Powered** - Uses Claude Sonnet 4.5 to transform transcripts into polished content
✅ **Complete Metadata** - Automatically generates titles, categories, tags, excerpts
✅ **Image Fetching** - Finds appropriate featured images from Unsplash (optional)
✅ **Backup System** - Creates backups before modifying articles.json
✅ **Error Handling** - Robust retry logic and error recovery
✅ **Detailed Logging** - Track every step of the process
✅ **Cost Effective** - Uses Claude Sonnet (~$0.003 per article)

## Quick Start

### 1. Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Create an API key

### 2. Setup Environment

Create a `.env` file in the `automation/` directory:

```bash
cd automation
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Automation

```bash
npm start
```

You should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     SIMPLY NERDY AUTOMATION STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Watching folder: /path/to/transcripts/incoming
Drop .txt transcript files to process them automatically
Press Ctrl+C to stop

✓ Watcher ready. Monitoring for new transcript files...
```

### 5. Process Your First Transcript

1. Save your episode transcript as a `.txt` file (UTF-8 encoding)
2. Drop it into `transcripts/incoming/`
3. Watch the magic happen! ✨

The automation will:
- Transform the transcript into an article with Claude API
- Generate title, excerpt, tags, and category
- Fetch an appropriate featured image
- Add it to `data/articles.json`
- Move the transcript to `transcripts/processed/`

Your new article will appear on the website immediately!

## How It Works

```
Transcript (.txt)
    ↓
Watch Folder Detection
    ↓
Read & Validate
    ↓
Claude API Transformation
    ↓
Generate Metadata (ID, slug, date)
    ↓
Fetch Featured Image
    ↓
Backup articles.json
    ↓
Append Article
    ↓
Move to Processed Folder
    ↓
Article Live on Website! 🎉
```

## Configuration

### Settings (config/settings.json)

- `claudeModel`: AI model to use (default: `claude-sonnet-4-5`)
- `claudeMaxTokens`: Maximum response length (default: 4096)
- `claudeTemperature`: Creativity level 0-1 (default: 0.7)
- `retryAttempts`: Number of retries on failure (default: 3)
- `maxBackups`: Number of backups to keep (default: 10)
- `unsplashEnabled`: Enable/disable Unsplash integration (default: false)

### Available Models

- **claude-sonnet-4-5** (Recommended) - Fast, high quality, cost-effective (~$0.003/article)
- **claude-opus-4-6** - Highest quality, slower, more expensive (~$0.015/article)
- **claude-haiku-3-5** - Ultra-fast, basic quality, cheapest (~$0.001/article)

To change models, edit `config/settings.json`:
```json
"claudeModel": "claude-opus-4-6"
```

### Unsplash Images (Optional)

To use Unsplash instead of category defaults:

1. Get an API key from https://unsplash.com/developers
2. Add to `.env`:
   ```
   UNSPLASH_ACCESS_KEY=your-key-here
   ```
3. Enable in `config/settings.json`:
   ```json
   "unsplashEnabled": true
   ```

## Folder Structure

```
automation/
├── src/                   # Source code
│   ├── transcript-processor.js    # Main orchestrator
│   ├── claude-api.js              # Claude API integration
│   ├── articles-manager.js        # JSON operations
│   ├── image-handler.js           # Image fetching
│   └── utils.js                   # Helper functions
├── config/
│   └── settings.json             # Configuration
├── templates/
│   └── article-prompt.txt        # Claude prompt
├── logs/
│   ├── automation.log            # All logs
│   └── error.log                 # Errors only
├── package.json
├── .env                          # API keys (not in git)
└── README.md

transcripts/
├── incoming/                 # Drop transcripts here
├── processed/                # Successfully processed
└── failed/                   # Failed processing

data/
├── articles.json            # Website articles
└── backups/                 # Automatic backups
```

## Monitoring

### View Logs

```bash
# Real-time monitoring
tail -f logs/automation.log

# Errors only
tail -f logs/error.log
```

### Check Status

- **Processed**: Check `transcripts/processed/` for successfully processed files
- **Failed**: Check `transcripts/failed/` for files that failed (includes `.error.txt` logs)
- **Backups**: Check `data/backups/` for articles.json backups

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable not set"

**Solution**: Create `.env` file with your API key (see Quick Start step 2)

### "No processing happening"

**Checks**:
1. Is the automation running? (`npm start`)
2. Is the file a `.txt` file?
3. Check logs: `tail -f logs/automation.log`
4. Is the file in the correct folder? (`transcripts/incoming/`)

### "Wrong category assigned"

**Solution**: Edit the prompt template at `templates/article-prompt.txt` to provide better category examples for the AI

### "API rate limit errors"

**Solutions**:
- Wait a few minutes and try again
- Consider using `claude-sonnet-4-5` instead of `claude-opus-4-6` (cheaper, faster)
- Check your API usage at https://console.anthropic.com/

### "Articles not appearing on website"

**Checks**:
1. Verify article was added to `data/articles.json`
2. Check browser console for JavaScript errors
3. Hard refresh the website (Cmd/Ctrl + Shift + R)
4. Check if article ID is correct (should increment from previous)

## Advanced Usage

### Custom Prompt

Edit `templates/article-prompt.txt` to customize how Claude transforms transcripts. You can:
- Adjust tone and style
- Add specific formatting rules
- Include examples from existing articles
- Change metadata requirements

### Cost Optimization

Using `claude-sonnet-4-5` (default and recommended):

**Cost comparison**:
- **Sonnet 4.5**: ~$0.003 per transcript (recommended)
- Opus 4.6: ~$0.015 per transcript (highest quality)
- Haiku 3.5: ~$0.001 per transcript (basic quality)

**Expected monthly cost**: <$1 for ~50 articles with Sonnet

## Performance

### Processing Time

- **claude-sonnet-4-5**: ~5-10 seconds per transcript
- **claude-opus-4-6**: ~10-15 seconds per transcript
- **claude-haiku-3-5**: ~2-5 seconds per transcript

### API Usage

Per transcript (2000-4000 words):
- **Input**: ~1000-2000 tokens (transcript)
- **Output**: ~800-1200 tokens (article)
- **Total**: ~1800-3200 tokens per conversion

### Rate Limits

Anthropic API limits:
- **Sonnet 4.5**: 100,000 tokens/minute
- **Opus 4.6**: 50,000 tokens/minute

You can process many transcripts per hour without hitting limits.

## Maintenance

### Clean Old Backups

Old backups are automatically cleaned (keeps latest 10). To change:

**Edit `config/settings.json`**:
```json
"maxBackups": 20
```

### Update Dependencies

```bash
npm update
```

### Check for Security Issues

```bash
npm audit
npm audit fix
```

## Support

### Sample Transcript

Use the provided sample:

```bash
cp ../transcripts/sample-transcript.txt ../transcripts/incoming/
```

Or create your own following this format:

```
Episode 1: Baldur's Gate 3 - A Gaming Masterpiece

Welcome to Simply Nerdy! Today we're discussing Baldur's Gate 3,
the game that has taken the RPG world by storm.

[Continue with 2-3 paragraphs of discussion about the topic...]

Thanks for listening to Simply Nerdy!
```

Drop it in `transcripts/incoming/` and watch it process!

## Cost

**Very Affordable!**
- Claude Sonnet 4.5: ~$0.003 per transcript (recommended)
- Expected: <$1/month for ~50 articles
- No setup costs
- Pay as you go

## License

MIT License - Simply Nerdy

## Version

1.0.0 - Initial Release (February 2026)
