/**
 * Simply Nerdy - Image Handler
 * Handles Unsplash image fetching with fallback to defaults
 */

import { logger } from './utils.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Get category default image
 * @param {string} category - Article category
 * @returns {Promise<string>} Image URL
 */
export async function getCategoryDefaultImage(category) {
  const config = await loadSettings();

  if (config.defaultImages && config.defaultImages[category]) {
    return config.defaultImages[category];
  }

  // Fallback to generic image if category not found
  logger.warn(`No default image for category: ${category}, using generic fallback`);
  return 'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?w=800&h=400&fit=crop';
}

/**
 * Search Unsplash for relevant image
 * @param {string[]} searchTerms - Keywords to search for
 * @param {string} category - Article category (for fallback)
 * @returns {Promise<string>} Image URL
 */
export async function searchUnsplash(searchTerms, category) {
  const config = await loadSettings();

  // If Unsplash is disabled or no API key, use default
  if (!config.unsplashEnabled || !process.env.UNSPLASH_ACCESS_KEY) {
    logger.info('Unsplash disabled or no API key, using category default image');
    return getCategoryDefaultImage(category);
  }

  try {
    logger.info(`Searching Unsplash for: ${searchTerms.join(', ')}`);

    const query = searchTerms.join(' ');
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      logger.warn('No Unsplash results found, using category default');
      return getCategoryDefaultImage(category);
    }

    // Get the first result and format URL
    const photo = data.results[0];
    const imageUrl = buildUnsplashUrl(photo);

    logger.info(`Found Unsplash image: ${photo.id} by ${photo.user.name}`);
    return imageUrl;
  } catch (error) {
    logger.error(`Unsplash search failed: ${error.message}`);
    logger.info('Falling back to category default image');
    return getCategoryDefaultImage(category);
  }
}

/**
 * Build properly formatted Unsplash URL with dimensions
 * @param {Object} photo - Unsplash photo object
 * @returns {string} Formatted image URL
 */
export function buildUnsplashUrl(photo) {
  // Use Unsplash's dynamic image resizing
  const baseUrl = photo.urls.raw || photo.urls.regular;

  // Add parameters for optimal size (800x400, cropped to fit)
  return `${baseUrl}&w=800&h=400&fit=crop`;
}

/**
 * Get image for article (with Unsplash or fallback)
 * @param {string[]} searchTerms - AI-suggested search terms
 * @param {string} category - Article category
 * @returns {Promise<string>} Image URL
 */
export async function getImageForArticle(searchTerms, category) {
  try {
    // If no search terms provided, use default
    if (!searchTerms || searchTerms.length === 0) {
      logger.info('No search terms provided, using category default');
      return getCategoryDefaultImage(category);
    }

    // Try Unsplash first
    const imageUrl = await searchUnsplash(searchTerms, category);
    return imageUrl;
  } catch (error) {
    logger.error(`Failed to get image: ${error.message}`);
    return getCategoryDefaultImage(category);
  }
}

export default {
  getCategoryDefaultImage,
  searchUnsplash,
  buildUnsplashUrl,
  getImageForArticle
};
