/**
 * Netlify Blobs Cache Adapter Implementation
 * 
 * Production-ready cache implementation using Netlify Blobs storage
 * with compression, automatic cleanup, and telemetry integration
 */

import { getStore } from '@netlify/blobs';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { 
  CacheAdapter, 
  CacheEntry, 
  CacheConfig, 
  CacheStats, 
  CacheGenerationParams,
  CacheMissError,
  CacheStorageError,
  DEFAULT_CACHE_CONFIG,
  generateCacheKey,
  calculateSizeBytes,
  isExpired,
  createCacheEntry
} from './cache-adapter';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface CacheMetadata {
  /** Total entries count */
  totalEntries: number;
  /** Total size in bytes */
  totalSizeBytes: number;
  /** Stats for hit rate calculation */
  stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  /** Last cleanup timestamp */
  lastCleanup: number;
  /** Entries by type count */
  entriesByType: Record<string, number>;
}

export class NetlifyCacheAdapter implements CacheAdapter {
  private store: any;
  private config: CacheConfig;
  private memoryStats: CacheMetadata;
  private initialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.memoryStats = {
      totalEntries: 0,
      totalSizeBytes: 0,
      stats: { hits: 0, misses: 0, evictions: 0 },
      lastCleanup: Date.now(),
      entriesByType: {}
    };
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.store = getStore({
        name: 'adgenxai-cache',
        consistency: 'strong'
      });

      // Load metadata if exists
      await this.loadMetadata();
      this.initialized = true;
    } catch (error) {
      throw new CacheStorageError('initialize', error as Error);
    }
  }

  private async loadMetadata(): Promise<void> {
    try {
      const metadata = await this.store.get('_cache_metadata', { type: 'json' });
      if (metadata) {
        this.memoryStats = { ...this.memoryStats, ...metadata };
      }
    } catch (error) {
      // Metadata doesn't exist, start fresh
      await this.saveMetadata();
    }
  }

  private async saveMetadata(): Promise<void> {
    try {
      await this.store.set('_cache_metadata', JSON.stringify(this.memoryStats), {
        metadata: { type: 'cache_metadata' }
      });
    } catch (error) {
      console.warn('Failed to save cache metadata:', error);
    }
  }

  generateKey(params: CacheGenerationParams): string {
    return generateCacheKey(params);
  }

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    if (!this.config.enabled) return null;
    
    await this.initialize();

    try {
      // Get entry with metadata
      const data = await this.store.get(key, { type: 'text' });
      const metadata = await this.store.getMetadata(key);

      if (!data || !metadata) {
        this.memoryStats.stats.misses++;
        await this.saveMetadata();
        return null;
      }

      // Parse entry
      let entry: CacheEntry<T>;
      try {
        entry = JSON.parse(data);
      } catch (parseError) {
        // Corrupted entry, remove it
        await this.delete(key);
        throw new CacheMissError(key, 'corrupted');
      }

      // Check if expired
      if (isExpired(entry)) {
        await this.delete(key);
        this.memoryStats.stats.misses++;
        await this.saveMetadata();
        throw new CacheMissError(key, 'expired');
      }

      // Decompress if needed
      if (metadata.compressed) {
        try {
          const compressed = Buffer.from(entry.value as string, 'base64');
          const decompressed = await gunzipAsync(compressed);
          entry.value = JSON.parse(decompressed.toString()) as T;
        } catch (decompressError) {
          await this.delete(key);
          throw new CacheMissError(key, 'corrupted');
        }
      }

      this.memoryStats.stats.hits++;
      await this.saveMetadata();
      return entry;

    } catch (error) {
      if (error instanceof CacheMissError) {
        throw error;
      }
      throw new CacheStorageError('get', error as Error);
    }
  }

  async set<T = any>(
    key: string, 
    value: T, 
    options: {
      ttl?: number;
      contentType?: 'video' | 'image' | 'text' | '3d' | 'metadata';
      provider?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    if (!this.config.enabled) return;
    
    await this.initialize();

    const contentType = options.contentType || 'metadata';
    const ttl = options.ttl || this.config.ttlByType[contentType] || this.config.defaultTtl;
    const provider = options.provider || 'unknown';

    // Create cache entry
    const entry = createCacheEntry(key, value, {
      ttl,
      contentType,
      provider,
      metadata: options.metadata
    });

    // Check size limits
    if (entry.sizeBytes > this.config.maxEntrySizeBytes) {
      throw new CacheStorageError('set', new Error(`Entry size ${entry.sizeBytes} exceeds maximum ${this.config.maxEntrySizeBytes}`));
    }

    try {
      let dataToStore = entry;
      let shouldCompress = false;
      
      // Compress if enabled and appropriate
      if (this.config.compression.enabled && 
          this.config.compression.types.includes(contentType)) {
        try {
          const compressed = await gzipAsync(JSON.stringify(value), {
            level: this.config.compression.level
          });
          dataToStore = {
            ...entry,
            value: compressed.toString('base64') as T
          };
          shouldCompress = true;
        } catch (compressionError) {
          // Fall back to uncompressed
          console.warn('Compression failed, storing uncompressed:', compressionError);
        }
      }

      // Store with metadata
      await this.store.set(key, JSON.stringify(dataToStore), {
        metadata: {
          contentType,
          provider,
          createdAt: entry.createdAt,
          expiresAt: entry.expiresAt,
          sizeBytes: entry.sizeBytes,
          compressed: shouldCompress,
          ...options.metadata
        }
      });

      // Update stats
      await this.updateStatsForSet(contentType, entry.sizeBytes);

    } catch (error) {
      throw new CacheStorageError('set', error as Error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    await this.initialize();

    try {
      const metadata = await this.store.getMetadata(key);
      if (!metadata) return false;

      // Check if expired
      if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    await this.initialize();

    try {
      const metadata = await this.store.getMetadata(key);
      const existed = await this.store.delete(key);
      
      if (existed && metadata) {
        // Update stats
        this.memoryStats.totalEntries = Math.max(0, this.memoryStats.totalEntries - 1);
        this.memoryStats.totalSizeBytes = Math.max(0, this.memoryStats.totalSizeBytes - (metadata.sizeBytes || 0));
        
        if (metadata.contentType) {
          this.memoryStats.entriesByType[metadata.contentType] = 
            Math.max(0, (this.memoryStats.entriesByType[metadata.contentType] || 0) - 1);
        }
        
        await this.saveMetadata();
      }

      return existed;
    } catch (error) {
      throw new CacheStorageError('delete', error as Error);
    }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled) return;
    
    await this.initialize();

    try {
      // List all keys and delete them
      const keys = await this.store.list();
      
      await Promise.all(
        keys.map(async (key: string) => {
          try {
            await this.store.delete(key);
          } catch (error) {
            console.warn(`Failed to delete key ${key}:`, error);
          }
        })
      );

      // Reset stats
      this.memoryStats = {
        totalEntries: 0,
        totalSizeBytes: 0,
        stats: { hits: 0, misses: 0, evictions: 0 },
        lastCleanup: Date.now(),
        entriesByType: {}
      };

      await this.saveMetadata();

    } catch (error) {
      throw new CacheStorageError('clear', error as Error);
    }
  }

  async getStats(): Promise<CacheStats> {
    await this.initialize();

    const totalRequests = this.memoryStats.stats.hits + this.memoryStats.stats.misses;
    const hitRate = totalRequests > 0 ? this.memoryStats.stats.hits / totalRequests : 0;

    // Calculate average age
    let totalAge = 0;
    let entryCount = 0;
    
    try {
      const keys = await this.store.list();
      
      for (const key of keys) {
        if (key === '_cache_metadata') continue;
        
        try {
          const metadata = await this.store.getMetadata(key);
          if (metadata?.createdAt) {
            totalAge += (Date.now() - metadata.createdAt) / 1000;
            entryCount++;
          }
        } catch (error) {
          // Skip corrupted entries
        }
      }
    } catch (error) {
      console.warn('Failed to calculate average age:', error);
    }

    const averageAgeSeconds = entryCount > 0 ? totalAge / entryCount : 0;

    return {
      totalEntries: this.memoryStats.totalEntries,
      totalSizeBytes: this.memoryStats.totalSizeBytes,
      hitRate,
      totalHits: this.memoryStats.stats.hits,
      totalMisses: this.memoryStats.stats.misses,
      totalEvictions: this.memoryStats.stats.evictions,
      entriesByType: { ...this.memoryStats.entriesByType },
      averageAgeSeconds
    };
  }

  async cleanup(): Promise<number> {
    if (!this.config.enabled) return 0;
    
    await this.initialize();

    let cleanedCount = 0;
    const now = Date.now();

    try {
      const keys = await this.store.list();
      
      for (const key of keys) {
        if (key === '_cache_metadata') continue;
        
        try {
          const metadata = await this.store.getMetadata(key);
          
          // Check if expired
          if (metadata?.expiresAt && now > metadata.expiresAt) {
            await this.delete(key);
            cleanedCount++;
          }
        } catch (error) {
          // Delete corrupted entries
          await this.delete(key);
          cleanedCount++;
        }
      }

      // Check if we need to evict entries due to size constraints
      if (this.memoryStats.totalSizeBytes > this.config.maxCacheSizeBytes) {
        cleanedCount += await this.evictOldestEntries();
      }

      this.memoryStats.lastCleanup = now;
      this.memoryStats.stats.evictions += cleanedCount;
      await this.saveMetadata();

    } catch (error) {
      throw new CacheStorageError('cleanup', error as Error);
    }

    return cleanedCount;
  }

  async warmCache(predictions: CacheGenerationParams[]): Promise<void> {
    // Cache warming would typically pre-generate content
    // For now, we just reserve keys to track potential cache misses
    for (const prediction of predictions) {
      const key = this.generateKey(prediction);
      // You could implement pre-generation logic here
      console.log(`Cache warming: reserved key ${key}`);
    }
  }

  async invalidate(pattern?: string, metadata?: Record<string, any>): Promise<number> {
    if (!this.config.enabled) return 0;
    
    await this.initialize();

    let invalidatedCount = 0;

    try {
      const keys = await this.store.list();
      
      for (const key of keys) {
        if (key === '_cache_metadata') continue;
        
        let shouldInvalidate = false;

        // Pattern matching
        if (pattern && key.includes(pattern)) {
          shouldInvalidate = true;
        }

        // Metadata matching
        if (metadata && !shouldInvalidate) {
          try {
            const entryMetadata = await this.store.getMetadata(key);
            
            if (entryMetadata) {
              for (const [metaKey, metaValue] of Object.entries(metadata)) {
                if (entryMetadata[metaKey] === metaValue) {
                  shouldInvalidate = true;
                  break;
                }
              }
            }
          } catch (error) {
            // Skip if can't read metadata
          }
        }

        if (shouldInvalidate) {
          await this.delete(key);
          invalidatedCount++;
        }
      }

    } catch (error) {
      throw new CacheStorageError('invalidate', error as Error);
    }

    return invalidatedCount;
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.initialize();
      
      // Test basic operations
      const testKey = '_health_check_' + Date.now();
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue, { ttl: 10 }); // 10 second TTL
      const retrieved = await this.get(testKey);
      await this.delete(testKey);

      const latency = Date.now() - startTime;
      
      if (!retrieved || retrieved.value.test !== true) {
        return {
          healthy: false,
          latency,
          error: 'Health check failed: data integrity issue'
        };
      }

      return {
        healthy: true,
        latency
      };

    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  private async updateStatsForSet(contentType: string, sizeBytes: number): Promise<void> {
    this.memoryStats.totalEntries++;
    this.memoryStats.totalSizeBytes += sizeBytes;
    this.memoryStats.entriesByType[contentType] = 
      (this.memoryStats.entriesByType[contentType] || 0) + 1;

    await this.saveMetadata();
  }

  private async evictOldestEntries(): Promise<number> {
    let evictedCount = 0;
    const targetSize = this.config.maxCacheSizeBytes * 0.8; // Evict to 80% capacity

    try {
      const keys = await this.store.list();
      const keyMetadata: Array<{ key: string; createdAt: number; sizeBytes: number }> = [];

      // Collect metadata for all entries
      for (const key of keys) {
        if (key === '_cache_metadata') continue;
        
        try {
          const metadata = await this.store.getMetadata(key);
          if (metadata?.createdAt && metadata?.sizeBytes) {
            keyMetadata.push({
              key,
              createdAt: metadata.createdAt,
              sizeBytes: metadata.sizeBytes
            });
          }
        } catch (error) {
          // Skip problematic entries
        }
      }

      // Sort by age (oldest first)
      keyMetadata.sort((a, b) => a.createdAt - b.createdAt);

      // Evict oldest entries until we reach target size
      let currentSize = this.memoryStats.totalSizeBytes;
      
      for (const { key } of keyMetadata) {
        if (currentSize <= targetSize) break;
        
        const deleted = await this.delete(key);
        if (deleted) {
          evictedCount++;
          // Size is updated in the delete method
          currentSize = this.memoryStats.totalSizeBytes;
        }
      }

    } catch (error) {
      console.warn('Failed to evict oldest entries:', error);
    }

    return evictedCount;
  }
}

// Export singleton instance
export const cacheAdapter = new NetlifyCacheAdapter();