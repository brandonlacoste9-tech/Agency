/**
 * Manual Test for Cache Implementation
 * 
 * Simple script to test the new cache components manually
 */

import { 
  LocalCacheAdapter,
  cacheKeyForVideo,
  cacheKeyForImage,
  cacheKeyForText,
  isValidCacheKey,
  getCacheKeyMetadata
} from './index';

async function testCacheImplementation() {
  console.log('🧪 Testing Cache Implementation\n');

  // Test cache key generation
  console.log('1. Testing Cache Key Generation:');
  
  const videoKey = cacheKeyForVideo('A cat jumping', { duration: 10, model: 'longcat' });
  console.log(`   Video key: ${videoKey}`);
  console.log(`   Valid: ${isValidCacheKey(videoKey)}`);
  
  const imageKey = cacheKeyForImage('A sunset', { width: 1024, height: 768 });
  console.log(`   Image key: ${imageKey}`);
  console.log(`   Valid: ${isValidCacheKey(imageKey)}`);
  
  const textKey = cacheKeyForText('Write a story', { maxTokens: 1000 });
  console.log(`   Text key: ${textKey}`);
  console.log(`   Valid: ${isValidCacheKey(textKey)}\n`);

  // Test key metadata extraction
  console.log('2. Testing Key Metadata:');
  const videoMeta = getCacheKeyMetadata(videoKey);
  console.log(`   Video metadata:`, videoMeta);
  
  const imageMeta = getCacheKeyMetadata(imageKey);
  console.log(`   Image metadata:`, imageMeta, '\n');

  // Test local cache adapter
  console.log('3. Testing Local Cache Adapter:');
  
  const cache = new LocalCacheAdapter('.test-cache');
  
  // Test basic operations
  const testData = {
    url: 'https://example.com/video.mp4',
    duration: 10,
    created: new Date().toISOString()
  };
  
  console.log('   Setting cache entry...');
  await cache.set(videoKey, testData, {
    contentType: 'video',
    provider: 'longcat',
    ttl: 3600
  });
  
  console.log('   Getting cache entry...');
  const cached = await cache.get(videoKey);
  console.log(`   Retrieved: ${cached ? 'SUCCESS' : 'FAILED'}`);
  
  if (cached) {
    console.log(`   Data matches: ${JSON.stringify(cached.value) === JSON.stringify(testData)}`);
    console.log(`   Content type: ${cached.contentType}`);
    console.log(`   Provider: ${cached.provider}`);
    console.log(`   Size: ${cached.sizeBytes} bytes`);
  }
  
  // Test health check
  console.log('\n4. Testing Health Check:');
  const health = await cache.healthCheck();
  console.log(`   Healthy: ${health.healthy}`);
  console.log(`   Latency: ${health.latency}ms`);
  
  // Test stats
  console.log('\n5. Testing Statistics:');
  const stats = await cache.getStats();
  console.log(`   Total entries: ${stats.totalEntries}`);
  console.log(`   Total size: ${stats.totalSizeBytes} bytes`);
  console.log(`   By type:`, stats.entriesByType);
  
  // Cleanup
  console.log('\n6. Cleaning up...');
  await cache.clear();
  
  console.log('\n✅ All tests completed successfully!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCacheImplementation().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

export { testCacheImplementation };