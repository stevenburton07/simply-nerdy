/**
 * Simply Nerdy - Articles Manager
 * Handles all CRUD operations for articles.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger, generateId, getTimestamp, copyFile, fileExists } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let settings = null;

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
 * Get absolute path to articles.json
 * @returns {Promise<string>} Absolute path
 */
async function getArticlesPath() {
  const config = await loadSettings();
  return path.resolve(__dirname, config.articlesJsonPath);
}

/**
 * Get absolute path to backup folder
 * @returns {Promise<string>} Absolute path
 */
async function getBackupPath() {
  const config = await loadSettings();
  return path.resolve(__dirname, config.backupFolder);
}

/**
 * Read articles.json file
 * @returns {Promise<Object>} Articles data
 */
export async function readArticles() {
  try {
    const articlesPath = await getArticlesPath();
    const content = await fs.readFile(articlesPath, 'utf8');
    const data = JSON.parse(content);

    logger.debug(`Read articles.json: ${data.posts.length} articles found`);
    return data;
  } catch (error) {
    logger.error(`Failed to read articles.json: ${error.message}`);
    throw new Error(`Failed to read articles.json: ${error.message}`);
  }
}

/**
 * Write articles.json file
 * @param {Object} data - Articles data
 */
export async function writeArticles(data) {
  try {
    const articlesPath = await getArticlesPath();

    // Pretty-print with 2-space indentation
    const content = JSON.stringify(data, null, 2);

    await fs.writeFile(articlesPath, content, 'utf8');
    logger.info(`Successfully wrote articles.json (${data.posts.length} articles)`);

    // Verify the write succeeded
    await verifyIntegrity();
  } catch (error) {
    logger.error(`Failed to write articles.json: ${error.message}`);
    throw new Error(`Failed to write articles.json: ${error.message}`);
  }
}

/**
 * Get the next available article ID
 * @returns {Promise<string>} Next ID (zero-padded, e.g., "007")
 */
export async function getNextArticleId() {
  try {
    const data = await readArticles();

    if (!data.posts || data.posts.length === 0) {
      return '001';
    }

    // Find the highest numeric ID
    let maxId = 0;
    data.posts.forEach(post => {
      const numericId = parseInt(post.id, 10);
      if (!isNaN(numericId) && numericId > maxId) {
        maxId = numericId;
      }
    });

    const nextId = generateId(String(maxId));
    logger.debug(`Generated next article ID: ${nextId} (from max: ${maxId})`);

    return nextId;
  } catch (error) {
    logger.error(`Failed to generate next article ID: ${error.message}`);
    throw error;
  }
}

/**
 * Validate article structure
 * @param {Object} article - Article object to validate
 * @returns {Promise<Object>} Validation result { valid: boolean, errors: string[] }
 */
export async function validateArticleStructure(article) {
  const errors = [];
  const requiredFields = ['id', 'title', 'slug', 'date', 'category', 'excerpt', 'content', 'tags', 'author', 'image'];

  // Check required fields
  requiredFields.forEach(field => {
    if (!(field in article)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate field types and formats
  if (article.id && !/^\d{3}$/.test(article.id)) {
    errors.push('ID must be 3-digit zero-padded number (e.g., "007")');
  }

  if (article.title && (article.title.length < 10 || article.title.length > 100)) {
    errors.push('Title must be between 10 and 100 characters');
  }

  if (article.slug && !/^[a-z0-9-]+$/.test(article.slug)) {
    errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
  }

  if (article.date && !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }

  const config = await loadSettings();
  if (article.category && !config.categories.includes(article.category)) {
    errors.push(`Category must be one of: ${config.categories.join(', ')}`);
  }

  if (article.excerpt && article.excerpt.length < 50) {
    errors.push('Excerpt must be at least 50 characters');
  }

  if (article.content && article.content.length < 100) {
    errors.push('Content must be at least 100 characters');
  }

  if (article.tags && (!Array.isArray(article.tags) || article.tags.length < 3)) {
    errors.push('Tags must be an array with at least 3 items');
  }

  if (article.author && article.author !== 'Simply Nerdy') {
    errors.push('Author must be "Simply Nerdy"');
  }

  if (article.image && !article.image.startsWith('http')) {
    errors.push('Image must be a valid URL starting with http');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create a backup of articles.json
 * @returns {Promise<string>} Backup file path
 */
export async function createBackup() {
  try {
    const articlesPath = await getArticlesPath();
    const backupFolder = await getBackupPath();

    // Ensure backup folder exists
    await fs.mkdir(backupFolder, { recursive: true });

    // Create backup filename with timestamp
    const timestamp = getTimestamp();
    const backupFilename = `articles.backup.${timestamp}.json`;
    const backupPath = path.join(backupFolder, backupFilename);

    // Copy articles.json to backup
    await copyFile(articlesPath, backupPath);

    logger.info(`Created backup: ${backupFilename}`);
    return backupPath;
  } catch (error) {
    logger.error(`Failed to create backup: ${error.message}`);
    throw error;
  }
}

/**
 * Clean old backups (keep only N most recent)
 */
export async function cleanOldBackups() {
  try {
    const config = await loadSettings();
    const backupFolder = await getBackupPath();

    // Get all backup files
    const files = await fs.readdir(backupFolder);
    const backupFiles = files
      .filter(f => f.startsWith('articles.backup.') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupFolder, f),
        timestamp: f.replace('articles.backup.', '').replace('.json', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Newest first

    // Delete old backups
    if (backupFiles.length > config.maxBackups) {
      const toDelete = backupFiles.slice(config.maxBackups);

      for (const file of toDelete) {
        await fs.unlink(file.path);
        logger.debug(`Deleted old backup: ${file.name}`);
      }

      logger.info(`Cleaned up ${toDelete.length} old backups (keeping ${config.maxBackups})`);
    }
  } catch (error) {
    logger.warn(`Failed to clean old backups: ${error.message}`);
    // Don't throw - this is not critical
  }
}

/**
 * Restore from most recent backup
 * @returns {Promise<string>} Restored backup filename
 */
export async function restoreFromBackup() {
  try {
    const articlesPath = await getArticlesPath();
    const backupFolder = await getBackupPath();

    // Get all backup files
    const files = await fs.readdir(backupFolder);
    const backupFiles = files
      .filter(f => f.startsWith('articles.backup.') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupFolder, f),
        timestamp: f.replace('articles.backup.', '').replace('.json', '')
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Newest first

    if (backupFiles.length === 0) {
      throw new Error('No backups found');
    }

    const latestBackup = backupFiles[0];

    // Restore from backup
    await copyFile(latestBackup.path, articlesPath);

    logger.info(`Restored from backup: ${latestBackup.name}`);
    return latestBackup.name;
  } catch (error) {
    logger.error(`Failed to restore from backup: ${error.message}`);
    throw error;
  }
}

/**
 * Verify articles.json integrity
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyIntegrity() {
  try {
    const data = await readArticles();

    // Check structure
    if (!data._instructions || !data.posts || !Array.isArray(data.posts)) {
      throw new Error('Invalid articles.json structure');
    }

    logger.debug('Articles.json integrity check passed');
    return true;
  } catch (error) {
    logger.error(`Articles.json integrity check failed: ${error.message}`);
    throw error;
  }
}

/**
 * Append a new article to articles.json
 * @param {Object} article - Article object
 * @returns {Promise<void>}
 */
export async function appendArticle(article) {
  try {
    // Validate article structure
    const validation = await validateArticleStructure(article);
    if (!validation.valid) {
      throw new Error(`Article validation failed:\n${validation.errors.join('\n')}`);
    }

    // Create backup before modifying
    await createBackup();

    // Read current articles
    const data = await readArticles();

    // Check for duplicate slug
    const existingSlug = data.posts.find(p => p.slug === article.slug);
    if (existingSlug) {
      logger.warn(`Duplicate slug detected: ${article.slug}. Appending timestamp.`);
      article.slug = `${article.slug}-${getTimestamp()}`;
    }

    // Append new article
    data.posts.push(article);

    // Write back to file
    await writeArticles(data);

    logger.info(`Successfully added article: ${article.id} - ${article.title}`);

    // Clean up old backups
    await cleanOldBackups();
  } catch (error) {
    logger.error(`Failed to append article: ${error.message}`);

    // Try to restore from backup
    try {
      logger.warn('Attempting to restore from backup...');
      await restoreFromBackup();
      logger.info('Successfully restored from backup');
    } catch (restoreError) {
      logger.error(`Failed to restore from backup: ${restoreError.message}`);
    }

    throw error;
  }
}

export default {
  readArticles,
  writeArticles,
  getNextArticleId,
  validateArticleStructure,
  createBackup,
  cleanOldBackups,
  restoreFromBackup,
  verifyIntegrity,
  appendArticle
};
