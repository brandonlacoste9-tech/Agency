/**
 * Local File System Cache Adapter
 * 
 * Lightweight cache adapter for development and testing.
 * Uses local filesystem with gzip compression for fast iteration.
 */

import { promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import { CacheAdapter, CacheEntry, createCacheEntry } from './cache-adapter';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class LocalCacheAdapter implements CacheAdapter {
  private dir: string;

  constructor(dir = './.cache') {
    this.dir = dir;
  }

  private keyPath(key: string): string {
    // Sanitize key for filesystem
    const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.dir, `${sanitized}.gz`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  generateKey(params: any): string {
    // Delegate to main cache adapter utility
    const { generateCacheKey } = require('./cache-adapter');
    return generateCacheKey(params);
  }

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    const filePath = this.keyPath(key);
    
    try {
      const stat = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const raw = await gunzip(buffer);
      const data = JSON.parse(raw.toString('utf8'));

      // Check if expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }

      return {
        key,
        value: data.value as T,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        sizeBytes: stat.size,
        contentType: data.contentType || 'metadata',
        provider: data.provider || 'local',
        metadata: data.metadata
      };
    } catch (error) {
      return null;
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
    await this.ensureDir();
    
    const filePath = this.keyPath(key);
    const ttl = options.ttl || 3600; // 1 hour default
    
    const payload = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      contentType: options.contentType || 'metadata',
      provider: options.provider || 'local',
      metadata: options.metadata
    };

    const raw = Buffer.from(JSON.stringify(payload), 'utf8');
    const compressed = await gzip(raw, { level: zlib.constants.Z_BEST_SPEED });
    await fs.writeFile(filePath, compressed);
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.keyPath(key);
    try {
      await fs.access(filePath);
      // Check if expired
      const entry = await this.get(key);
      return entry !== null;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.keyPath(key);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.dir);
      await Promise.all(
        files
          .filter(file => file.endsWith('.gz'))
          .map(file => fs.unlink(path.join(this.dir, file)).catch(() => {}))
      );
    } catch {
      // Directory doesn't exist, nothing to clear
    }
  }

  async getStats(): Promise<any> {
    try {
      const files = await fs.readdir(this.dir);
      const gzFiles = files.filter(file => file.endsWith('.gz'));
      
      let totalSize = 0;
      let validEntries = 0;
      const entriesByType: Record<string, number> = {};

      for (const file of gzFiles) {
        try {
          const filePath = path.join(this.dir, file);
          const stat = await fs.stat(filePath);
          const entry = await this.get(file.replace('.gz', ''));
          
          if (entry) {
            validEntries++;
            totalSize += stat.size;
            entriesByType[entry.contentType] = (entriesByType[entry.contentType] || 0) + 1;
          }
        } catch {
          // Skip corrupted files
        }
      }

      return {
        totalEntries: validEntries,
        totalSizeBytes: totalSize,
        hitRate: 0.8, // Placeholder - would need to track hits/misses
        totalHits: 0,
        totalMisses: 0,
        totalEvictions: 0,
        entriesByType,
        averageAgeSeconds: 1800 // Placeholder
      };
    } catch {
      return {
        totalEntries: 0,
        totalSizeBytes: 0,
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        totalEvictions: 0,
        entriesByType: {},
        averageAgeSeconds: 0
      };
    }
  }

  async cleanup(): Promise<number> {
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(this.dir);
      
      for (const file of files.filter(f => f.endsWith('.gz'))) {
        const key = file.replace('.gz', '');
        const entry = await this.get(key);
        
        if (!entry) {
          // Entry is expired or corrupted, remove it
          await fs.unlink(path.join(this.dir, file)).catch(() => {});
          cleanedCount++;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return cleanedCount;
  }

  async warmCache(predictions: any[]): Promise<void> {
    // For local cache, we just log the warming request
    console.log(`Local cache warming requested for ${predictions.length} predictions`);
  }

  async invalidate(pattern?: string, metadata?: Record<string, any>): Promise<number> {
    let invalidatedCount = 0;
    
    try {
      const files = await fs.readdir(this.dir);
      
      for (const file of files.filter(f => f.endsWith('.gz'))) {
        let shouldInvalidate = false;
        
        if (pattern && file.includes(pattern)) {
          shouldInvalidate = true;
        }
        
        if (metadata && !shouldInvalidate) {
          const key = file.replace('.gz', '');
          const entry = await this.get(key);
          
          if (entry && entry.metadata) {
            for (const [metaKey, metaValue] of Object.entries(metadata)) {
              if (entry.metadata[metaKey] === metaValue) {
                shouldInvalidate = true;
                break;
              }
            }
          }
        }
        
        if (shouldInvalidate) {
          await fs.unlink(path.join(this.dir, file)).catch(() => {});
          invalidatedCount++;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    return invalidatedCount;
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await this.ensureDir();
      
      // Test write/read/delete
      const testKey = `health_check_${Date.now()}`;
      const testValue = { test: true, timestamp: Date.now() };
      
      await this.set(testKey, testValue, { ttl: 10 });
      const retrieved = await this.get(testKey);
      await this.delete(testKey);
      
      const latency = Date.now() - startTime;
      
      if (!retrieved || !retrieved.value.test) {
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
}

// Export configured instance for development
export const localCacheAdapter = new LocalCacheAdapter();