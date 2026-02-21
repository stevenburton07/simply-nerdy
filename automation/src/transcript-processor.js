#!/usr/bin/env node

/**
 * Simply Nerdy - Transcript Processor
 * Main orchestrator for automated transcript-to-article conversion
 */

import dotenv from 'dotenv';
import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  logger,
  validateTranscript,
  generateSlug,
  getCurrentDate,
  moveFile,
  getTimestamp
} from './utils.js';

import {
  getNextArticleId,
  appendArticle
} from './articles-manager.js';

import { transformTranscript } from './claude-api.js';
import { getImageForArticle } from './image-handler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let settings = null;
const processingFiles = new Set(); // Track files currently being processed

/**
 * Load settings from config file
 * @returns {Promise<Object>} Settings object
 */
async function loadSettings() {
  if (settings) return settings;

  const settingsPath = path.resolve(__dirname, '../config/settings.json');
  const content = await fs.readFile(settingsPath, 'utf8');
  settings = JSON.parse(content);
  return settings;
}

/**
 * Process a single transcript file
 * @param {string} filePath - Path to transcript file
 */
async function processTranscript(filePath) {
  const startTime = Date.now();
  const filename = path.basename(filePath);

  // Check if already processing this file
  if (processingFiles.has(filePath)) {
    logger.debug(`File already being processed: ${filename}`);
    return;
  }

  processingFiles.add(filePath);

  try {
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(`Processing new transcript: ${filename}`);
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Step 1: Read and validate transcript
    logger.info('Step 1/7: Reading transcript file...');
    const transcriptText = await fs.readFile(filePath, 'utf8');

    const validation = validateTranscript(transcriptText);
    if (!validation.valid) {
      throw new Error(`Invalid transcript: ${validation.error}`);
    }

    logger.info(`✓ Transcript loaded (${transcriptText.length} characters)`);

    // Step 2: Transform transcript with Claude API
    logger.info('Step 2/7: Transforming transcript with Claude API...');
    const articleData = await transformTranscript(transcriptText);
    logger.info(`✓ Article generated: "${articleData.title}"`);

    // Step 3: Generate metadata
    logger.info('Step 3/7: Generating metadata...');
    const nextId = await getNextArticleId();
    const slug = generateSlug(articleData.title);
    const date = getCurrentDate();
    const author = 'Simply Nerdy';

    logger.info(`✓ ID: ${nextId}, Slug: ${slug}, Date: ${date}`);

    // Step 4: Fetch image
    logger.info('Step 4/7: Fetching featured image...');
    const imageUrl = await getImageForArticle(articleData.imageSearchTerms, articleData.category);
    logger.info(`✓ Image: ${imageUrl}`);

    // Step 5: Build complete article object
    logger.info('Step 5/7: Building article object...');
    const article = {
      id: nextId,
      title: articleData.title,
      slug: slug,
      date: date,
      category: articleData.category,
      excerpt: articleData.excerpt,
      content: articleData.content,
      tags: articleData.tags,
      author: author,
      image: imageUrl
    };

    logger.info(`✓ Article complete (category: ${article.category}, tags: ${article.tags.length})`);

    // Step 6: Append to articles.json
    logger.info('Step 6/7: Saving to articles.json...');
    await appendArticle(article);
    logger.info(`✓ Article saved successfully!`);

    // Step 7: Move transcript to processed folder
    logger.info('Step 7/7: Archiving transcript...');
    await cleanupOnSuccess(filePath);
    logger.info(`✓ Transcript archived`);

    // Calculate processing time
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    logger.info(`✅ SUCCESS! Processing complete in ${duration}s`);
    logger.info(`   Article ID: ${nextId}`);
    logger.info(`   Title: ${article.title}`);
    logger.info(`   Category: ${article.category}`);
    logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (error) {
    logger.error(`❌ FAILED: ${error.message}`);
    await handleError(filePath, error);
  } finally {
    processingFiles.delete(filePath);
  }
}

/**
 * Move transcript to processed folder on success
 * @param {string} filePath - Original file path
 */
async function cleanupOnSuccess(filePath) {
  const config = await loadSettings();
  const filename = path.basename(filePath);
  const timestamp = getTimestamp();

  // Add timestamp to filename to prevent overwrites
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename);
  const newFilename = `${nameWithoutExt}-${timestamp}${ext}`;

  const processedFolder = path.resolve(__dirname, config.processedFolder);
  const destination = path.join(processedFolder, newFilename);

  await moveFile(filePath, destination);
}

/**
 * Move transcript to failed folder on error
 * @param {string} filePath - Original file path
 * @param {Error} error - Error object
 */
async function handleError(filePath, error) {
  try {
    const config = await loadSettings();
    const filename = path.basename(filePath);
    const timestamp = getTimestamp();

    // Add timestamp and error indicator to filename
    const nameWithoutExt = path.basename(filename, path.extname(filename));
    const ext = path.extname(filename);
    const newFilename = `${nameWithoutExt}-${timestamp}-FAILED${ext}`;

    const failedFolder = path.resolve(__dirname, config.failedFolder);
    const destination = path.join(failedFolder, newFilename);

    await moveFile(filePath, destination);

    // Write error log alongside failed file
    const errorLogPath = destination.replace(ext, '.error.txt');
    const errorLog = `
Processing Failed: ${new Date().toISOString()}
File: ${filename}
Error: ${error.message}

Stack Trace:
${error.stack}
    `.trim();

    await fs.writeFile(errorLogPath, errorLog, 'utf8');

    logger.error(`Moved failed transcript to: ${newFilename}`);
  } catch (moveError) {
    logger.error(`Failed to move error file: ${moveError.message}`);
  }
}

/**
 * Handle file added event
 * @param {string} filePath - Path to added file
 */
async function handleFileAdded(filePath) {
  // Only process .txt files
  if (!filePath.endsWith('.txt')) {
    logger.debug(`Ignoring non-.txt file: ${path.basename(filePath)}`);
    return;
  }

  // Wait a bit to ensure file is fully written
  await new Promise(resolve => setTimeout(resolve, 1000));

  await processTranscript(filePath);
}

/**
 * Start file watcher
 */
async function startWatcher() {
  const config = await loadSettings();
  const watchFolder = path.resolve(__dirname, config.watchFolder);

  // Ensure watch folder exists
  await fs.mkdir(watchFolder, { recursive: true });

  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.info(`     SIMPLY NERDY AUTOMATION STARTED`);
  logger.info(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.info(`Watching folder: ${watchFolder}`);
  logger.info(`Drop .txt transcript files to process them automatically`);
  logger.info(`Press Ctrl+C to stop\n`);

  // Create watcher
  const watcher = chokidar.watch(watchFolder, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: false, // Process existing files
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  // Handle events
  watcher
    .on('add', handleFileAdded)
    .on('error', error => logger.error(`Watcher error: ${error.message}`))
    .on('ready', () => {
      logger.info(`✓ Watcher ready. Monitoring for new transcript files...\n`);
    });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\n\nShutting down...');
    await watcher.close();
    logger.info('Watcher stopped. Goodbye!');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n\nShutting down...');
    await watcher.close();
    logger.info('Watcher stopped. Goodbye!');
    process.exit(0);
  });
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Check for required environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.error('ERROR: ANTHROPIC_API_KEY environment variable not set');
      logger.error('Please create a .env file with your API key');
      logger.error('See .env.example for reference');
      process.exit(1);
    }

    // Start the watcher
    await startWatcher();
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { processTranscript, startWatcher };
