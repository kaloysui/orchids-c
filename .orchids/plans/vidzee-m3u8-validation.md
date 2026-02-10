# Vidzee M3U8 URL Validation

## Requirements
Add HTTP 200 status validation to all m3u8 URLs returned from the Vidzee provider before including them in the final sources list. Only sources that return a successful HEAD request (200 OK) should be returned to the player.

## Current Behavior
The Vidzee provider (`src/lib/providers/vidzee.ts`) currently:
1. Fetches API key from `core.vidzee.wtf/api-key`
2. Queries 10 different servers (WILLOW, BAMBOO, CYPRESS, REDWOOD, SEQUOIA, MANGROVE, BONSAI, BANYAN, TEAK, DEODAR)
3. Decrypts the returned m3u8 URLs
4. Returns all decrypted URLs without validating if they actually work

The TV API route (`src/app/api/tv/[id]/[season]/[episode]/route.ts`) has a `checkUrlStatus` function that validates URLs with HEAD requests, but the movie API route skips this check (currently hardcodes `status: 200`).

## Proposed Solution
Add m3u8 URL validation directly in the Vidzee provider, so only working sources are returned. This is more efficient than validating later in the API routes since it happens at the source level during parallel fetches.

## Implementation Phases

### Phase 1: Add m3u8 validation helper function in vidzee.ts
- Add a `validateM3u8Url` helper function that performs a HEAD request to check if the m3u8 URL returns 200 OK
- Use a short timeout (3-5 seconds) to avoid slowing down the scraper
- Return `true` if status is 200, `false` otherwise

### Phase 2: Integrate validation into server fetch loop
- After decrypting each m3u8 URL, call `validateM3u8Url` before adding to sources
- Only add sources that pass validation (200 OK status)
- Log validation failures for debugging

### Phase 3: Update movie API route to match TV API validation pattern
- The movie API route currently skips status checks (hardcodes 200)
- Add the same `checkUrlStatus` validation that exists in the TV API route
- Sort sources by status (200 OK first) for better UX

## Technical Details

### validateM3u8Url function
```typescript
async function validateM3u8Url(url: string, timeout = 4000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok; // 200-299 status codes
  } catch {
    return false;
  }
}
```

### Integration in server fetch loop
The validation should happen right after URL decryption, before pushing to sources array. This keeps the parallel nature of the fetches while adding validation.

## Files to Modify
1. `src/lib/providers/vidzee.ts` - Add validation helper and integrate into fetch loop
2. `src/app/api/movie/[id]/route.ts` - Add status check validation (match TV API pattern)

## Testing
- Test with a movie that has Vidzee sources
- Test with a TV show that has Vidzee sources  
- Verify only working m3u8 URLs are returned
- Check console logs for validation results
- Confirm no significant performance degradation

## Risks & Mitigations
- **Risk**: HEAD requests may not be supported by all CDNs
  - **Mitigation**: Fall back to including the source if HEAD fails (some CDNs block HEAD but allow GET)
- **Risk**: Validation timeout slowing down scraper
  - **Mitigation**: Use short 4s timeout, validation runs in parallel with server fetches
- **Risk**: All sources fail validation for certain content
  - **Mitigation**: If all fail HEAD, try GET request on first segment as fallback
