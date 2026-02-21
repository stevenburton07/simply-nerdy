/**
 * Simply Nerdy - Automation Utilities
 * Helper functions for transcript processing automation
 */

import winston from 'winston';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configure Winston logger
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ level, message, timestamp, stack }) => {
      if (stack) {
        return `[${timestamp}] [${level.toUpperCase()}] ${message}\n${stack}`;
      }
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `[${timestamp}] [${level}] ${message}`;
        })
      )
    }),
    new winston.transports.File({
      filename: path.resolve(__dirname, '../logs/automation.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.resolve(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * Generate URL-friendly slug from title
 * @param {string} title - Article title
 * @returns {string} URL-safe slug
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate next article ID with zero-padding
 * @param {string} currentMaxId - Current highest ID (e.g., "006")
 * @returns {string} Next ID with zero-padding (e.g., "007")
 */
export function generateId(currentMaxId) {
  const numericId = parseInt(currentMaxId, 10) || 0;
  const nextId = numericId + 1;
  return String(nextId).padStart(3, '0');
}

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validate transcript file content
 * @param {string} text - Transcript text
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateTranscript(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Transcript is empty or not a string' };
  }

  const trimmed = text.trim();
  if (trimmed.length < 100) {
    return { valid: false, error: 'Transcript too short (minimum 100 characters)' };
  }

  if (trimmed.length > 100000) {
    return { valid: false, error: 'Transcript too long (maximum 100,000 characters)' };
  }

  return { valid: true };
}

/**
 * Sanitize HTML content (basic security check)
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove dangerous tags
  const dangerous = ['script', 'iframe', 'object', 'embed', 'form'];
  let sanitized = html;

  dangerous.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    const selfClosing = new RegExp(`<${tag}[^>]*/>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  });

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  return sanitized;
}

/**
 * Move file to another location
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 */
export async function moveFile(source, destination) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    await fs.mkdir(destDir, { recursive: true });

    // Move the file
    await fs.rename(source, destination);
    logger.info(`Moved file: ${source} -> ${destination}`);
  } catch (error) {
    logger.error(`Failed to move file: ${error.message}`);
    throw error;
  }
}

/**
 * Copy file to another location
 * @param {string} source - Source file path
 * @param {string} destination - Destination file path
 */
export async function copyFile(source, destination) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    await fs.mkdir(destDir, { recursive: true });

    // Copy the file
    await fs.copyFile(source, destination);
    logger.info(`Copied file: ${source} -> ${destination}`);
  } catch (error) {
    logger.error(`Failed to copy file: ${error.message}`);
    throw error;
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} True if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate timestamp string for filenames
 * @returns {string} Timestamp in YYYYMMDD-HHMMSS format
 */
export function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of attempts
 * @param {number} options.delayMs - Initial delay in milliseconds
 * @param {number} options.multiplier - Backoff multiplier
 * @returns {Promise<any>} Result of function
 */
export async function retryWithBackoff(fn, options = {}) {
  const { maxAttempts = 3, delayMs = 2000, multiplier = 2 } = options;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(multiplier, attempt - 1);
        logger.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  logger.error(`All ${maxAttempts} attempts failed`);
  throw lastError;
}

export default {
  logger,
  generateSlug,
  generateId,
  getCurrentDate,
  validateTranscript,
  sanitizeHtml,
  moveFile,
  copyFile,
  fileExists,
  getTimestamp,
  sleep,
  retryWithBackoff
};
