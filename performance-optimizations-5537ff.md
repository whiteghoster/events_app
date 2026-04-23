# Performance Optimizations: Infinite Scroll, Atomic Queries & N+1 Prevention

Implement infinite scrolling on the events page, add atomic React Query patterns, reduce over-fetching through server-side filtering, and fix N+1 query patterns throughout the application.

## Goals
1. **Infinite Scrolling**: Replace pagination with infinite scroll on events page using `useInfiniteQuery`
2. **Reduce Over-fetching**: Move status filtering (live/hold/finished) to server-side to fetch only needed data
3. **Atomic Queries**: Implement proper atomic query patterns with React Query for better caching and performance
4. **Fix N+1 Problems**: Identify and resolve any N+1 query patterns in login flow and database queries

## Implementation Steps

### Phase 1: Backend API Enhancements

**1. Update `events.controller.ts`**
- Add `status` query parameter to the `findAll` endpoint
- Pass status filter to `findEvents` service method

**2. Update `events.service.ts`**
- Modify `findEvents` method to accept `status` parameter
- Add status filter to Supabase query when provided
- Keep occasion_type filter as existing

**3. Update DTO `event-query.dto.ts`**
- Add optional `status` enum field (live, hold, finished)

### Phase 2: Frontend - Infinite Scroll & Atomic Queries

**4. Update `use-events.ts` hook**
- Replace `useQuery` with `useInfiniteQuery` from React Query
- Add `getNextPageParam` for pagination logic
- Remove client-side status filtering (move to server)
- Use `flatMap` to combine pages for display
- Keep search filtering client-side (as it's UX-responsive)

**5. Update `events/page.tsx`**
- Add Intersection Observer hook for infinite scroll trigger
- Use `useInView` from `react-intersection-observer` (install if needed)
- Add loading indicator at bottom when fetching next page
- Replace static grid with infinite scroll pattern
- Keep tab switching logic but pass status to API

**6. Update `api.ts`**
- Modify `getEvents` to accept status parameter
- Ensure proper URL param encoding

### Phase 3: N+1 Query Prevention

**7. Review Login Flow**
- Current login flow in `auth-context.tsx` is already efficient (single API call)
- No N+1 issue detected - login returns user data in one request

**8. Review Backend Queries**
- `dashboard.service.ts` already uses `Promise.all` for parallel queries (good)
- `event-products.service.ts` already uses joins for related data (good)
- `events.service.ts` `getUniqueClients` - review for potential optimization

**9. Optimize `getUniqueClients` (if needed)**
- Currently fetches all events then deduplicates in memory
- Consider using Supabase `distinct` or groupby if available
- Or add limit/offset if client list grows large

### Phase 4: Testing & Validation

**10. Verification Steps**
- Test infinite scroll triggers at bottom of page
- Verify status tabs fetch correct filtered data
- Check React Query devtools for proper cache keys
- Monitor network tab for reduced data transfer
- Verify no duplicate requests on tab switch

## Files to Modify

| File | Changes |
|------|---------|
| `backend/src/events/events.controller.ts` | Add status query param |
| `backend/src/events/events.service.ts` | Add status filter to findEvents |
| `backend/src/events/dto/event-query.dto.ts` | Add status enum field |
| `frontend/hooks/use-events.ts` | useInfiniteQuery, remove client filter |
| `frontend/app/events/page.tsx` | Infinite scroll UI, Intersection Observer |
| `frontend/lib/api.ts` | Add status parameter |

## Dependencies

- `react-intersection-observer` (for infinite scroll trigger) - may need installation
- Existing `@tanstack/react-query` already provides `useInfiniteQuery`

## Expected Outcomes

1. **Reduced Data Transfer**: Only fetch events matching selected status tab
2. **Better UX**: Smooth infinite scroll instead of page numbers
3. **Improved Cache Performance**: Atomic queries with proper cache keys
4. **No N+1 Issues**: All related data fetched efficiently via joins/parallel queries
