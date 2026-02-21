/**
 * Simply Nerdy - Claude API Integration
 * Handles AI transformation of transcripts into articles
 */

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger, sanitizeHtml, retryWithBackoff } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let anthropic = null;
let settings = null;
let promptTemplate = null;

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
 * Initialize Anthropic client
 * @returns {Anthropic} Anthropic client instance
 */
export function initializeClient() {
  if (anthropic) return anthropic;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  logger.info('Claude API client initialized');
  return anthropic;
}

/**
 * Load prompt template from file
 * @returns {Promise<string>} Prompt template
 */
export async function loadPromptTemplate() {
  if (promptTemplate) return promptTemplate;

  const templatePath = path.resolve(__dirname, '../templates/article-prompt.txt');
  promptTemplate = await fs.readFile(templatePath, 'utf8');

  logger.debug('Loaded prompt template');
  return promptTemplate;
}

/**
 * Transform transcript into article using Claude API
 * @param {string} transcriptText - Raw transcript text
 * @returns {Promise<Object>} Article data { title, category, excerpt, content, tags, imageSearchTerms }
 */
export async function transformTranscript(transcriptText) {
  try {
    const client = initializeClient();
    const config = await loadSettings();
    const template = await loadPromptTemplate();

    // Replace placeholder with actual transcript
    const prompt = template.replace('{{TRANSCRIPT}}', transcriptText);

    logger.info(`Sending transcript to Claude API (${transcriptText.length} characters)`);
    logger.info(`Using model: ${config.claudeModel}`);

    // Call Claude API with retry logic
    const result = await retryWithBackoff(async () => {
      const message = await client.messages.create({
        model: config.claudeModel,
        max_tokens: config.claudeMaxTokens,
        temperature: config.claudeTemperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message;
    }, {
      maxAttempts: config.retryAttempts,
      delayMs: config.retryDelayMs
    });

    // Extract text from response
    const responseText = result.content[0].text;

    logger.debug(`Received response from Claude (${responseText.length} characters)`);

    // Parse JSON response
    const articleData = parseApiResponse(responseText);

    // Validate and sanitize
    const validatedData = await validateApiResponse(articleData);

    logger.info(`Successfully transformed transcript into article: "${validatedData.title}"`);
    return validatedData;
  } catch (error) {
    logger.error(`Claude API transformation failed: ${error.message}`);
    throw new Error(`Failed to transform transcript: ${error.message}`);
  }
}

/**
 * Parse Claude API response (handles both JSON and markdown-wrapped JSON)
 * @param {string} responseText - Raw response text
 * @returns {Object} Parsed article data
 */
function parseApiResponse(responseText) {
  try {
    // Try to parse as-is first
    return JSON.parse(responseText);
  } catch (error) {
    // If it fails, try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (innerError) {
        throw new Error('Failed to parse JSON from markdown code block');
      }
    }

    // Try to find JSON object in response
    const objectMatch = responseText.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch (innerError) {
        throw new Error('Failed to parse extracted JSON object');
      }
    }

    throw new Error('Could not find valid JSON in response');
  }
}

/**
 * Validate Claude API response
 * @param {Object} articleData - Parsed article data
 * @returns {Promise<Object>} Validated article data
 */
export async function validateApiResponse(articleData) {
  const errors = [];

  // Check required fields
  const requiredFields = ['title', 'category', 'excerpt', 'content', 'tags', 'imageSearchTerms'];

  requiredFields.forEach(field => {
    if (!(field in articleData)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`API response validation failed:\n${errors.join('\n')}`);
  }

  // Validate category
  const config = await loadSettings();
  if (!config.categories.includes(articleData.category)) {
    logger.warn(`Invalid category "${articleData.category}", defaulting to "Games"`);
    articleData.category = 'Games';
  }

  // Validate tags
  if (!Array.isArray(articleData.tags) || articleData.tags.length < 3) {
    logger.warn('Invalid tags array, setting defaults');
    articleData.tags = ['podcast', 'simply-nerdy', articleData.category.toLowerCase()];
  }

  // Validate imageSearchTerms
  if (!Array.isArray(articleData.imageSearchTerms) || articleData.imageSearchTerms.length === 0) {
    logger.warn('No image search terms provided, using category');
    articleData.imageSearchTerms = [articleData.category.toLowerCase()];
  }

  // Sanitize HTML content
  articleData.content = sanitizeHtml(articleData.content);

  // Trim strings
  articleData.title = articleData.title.trim();
  articleData.excerpt = articleData.excerpt.trim();

  logger.debug('API response validated successfully');
  return articleData;
}

export default {
  initializeClient,
  loadPromptTemplate,
  transformTranscript,
  validateApiResponse
};
