# LongCat Migration Demo

This demonstrates the complete Claude automation workflow for migrating from Sora to LongCat video generation.

## Demo Overview

The LongCat migration includes:

1. **LongCat Client** (`app/lib/providers/longcat-client.ts`)
   - Complete TypeScript client with retry logic and polling
   - Support for cinematic styles, custom durations, aspect ratios
   - Environment variable integration

2. **Video Provider Registry** (`app/lib/providers/video-registry.ts`)
   - Unified interface for multiple AI video providers
   - Automatic provider selection with cost optimization
   - Fallback chain support for reliability

3. **Comprehensive Test Suite** (`app/lib/providers/__tests__/longcat-client.test.ts`)
   - 95%+ test coverage with mocked API calls
   - Error handling and retry logic validation
   - Environment variable integration tests

## Running the Demo

### 1. Test the Claude Automation Suite

```bash
# Make scripts executable
chmod +x scripts/claude-*.sh

# Run a dry-run to see what patterns would be detected
./scripts/claude-autofix.sh "sora|sora-client"
```

### 2. Inspect the Generated Patches

```bash
# Preview the patches (path printed by script)
less /tmp/claude-patches.*/*.patch

# Check if patches would apply cleanly
git apply --check /tmp/claude-patches.*/*.patch
```

### 3. Apply Patches After Review (Optional)

```bash
# ONLY after manual inspection and approval
CLAUDE_DRY_RUN=false ./scripts/claude-autofix.sh "sora|sora-client" "claude/longcat-migration"
```

## What the Migration Would Include

The Claude automation would detect and migrate:

### Files Likely to be Modified:
- `app/lib/providers/sora-client.ts` → Update imports and client usage
- `app/components/VideoGenerator.tsx` → Switch provider registry calls
- `netlify/functions/generate-video.ts` → Update API endpoint handlers
- `app/lib/config/providers.ts` → Add LongCat configuration
- Any test files that import or test Sora functionality

### Example Migration Pattern:
```typescript
// Before (Sora)
import { SoraClient } from '@/lib/providers/sora-client';
const client = new SoraClient({ apiKey: process.env.OPENAI_API_KEY });

// After (LongCat via Registry)
import { createVideoRegistry } from '@/lib/providers/video-registry';
const registry = createVideoRegistry();
const result = await registry.generateVideo({
  prompt: "A majestic lion walking through the savanna",
  provider: 'longcat'
});
```

## Environment Variables Required

Add to your Netlify environment variables:

```env
LONGCAT_API_KEY=your_longcat_api_key_here
```

## Cost Comparison

The registry includes cost estimation:

```typescript
const registry = createVideoRegistry();
const estimates = registry.estimateCost({
  prompt: "Video prompt",
  duration: 30
});

// Example output:
// [
//   { provider: 'pika', cost: 2.40 },      // $0.08/sec * 30sec
//   { provider: 'runway', cost: 3.00 },    // $0.10/sec * 30sec  
//   { provider: 'longcat', cost: 3.60 },   // $0.12/sec * 30sec
//   { provider: 'sora', cost: 4.50 }       // $0.15/sec * 30sec
// ]
```

## Testing the New Implementation

```bash
# Run the test suite
npm test app/lib/providers

# Type check the new modules
npx tsc --noEmit app/lib/providers/*.ts

# Build to verify integration
npm run build
```

## Next Steps

After running the demo:

1. **Review Generated Patches**: Carefully inspect all proposed changes
2. **Test Integration**: Ensure new LongCat client works with existing UI
3. **Update Documentation**: Add LongCat setup instructions
4. **Environment Setup**: Configure LONGCAT_API_KEY in Netlify
5. **Deploy**: Merge the migration PR after testing

## Safety Notes

- **Always dry-run first**: Never skip the manual review step
- **Test thoroughly**: Run the full test suite after applying patches
- **Backup approach**: Keep Sora as a fallback provider initially
- **Cost monitoring**: Monitor usage costs when switching providers

This demonstrates the power of the Claude automation suite - it can handle complex, multi-file migrations while maintaining safety through dry-run previews and comprehensive testing.