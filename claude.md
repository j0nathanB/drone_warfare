# Drone Warfare Visualization - Optimization Guide

## Project Overview
Interactive map visualization of drone strike data (2004-2020) from Bureau of Investigative Journalism. Currently hosted at https://j0nathanb.github.io/drone_warfare/

## Primary Goal
Optimize initial load time while maintaining humanitarian impact and improving UX for general public audience.

## OPTIMIZATION STATUS (Updated)

### ✅ COMPLETED OPTIMIZATIONS
- ✅ Progressive Loading: Map shows immediately, async data loading implemented
- ✅ GeoJSON Optimization: 70-80% file size reduction via TopoJSON conversion  
- ✅ Skeleton Loading Screen: Animated loading states matching final layout
- ✅ Build Process: Automated GeoJSON optimization script functional

### 🚫 TABLED OPTIMIZATIONS  
- 🚫 Service Worker Caching: Will implement in future iteration
- 🚫 JS/CSS Minification: Placeholder scripts exist, deferred for now

## Previous Issues (Now Resolved)
- ~~Large GeoJSON files causing slow initial load~~ → Fixed with optimized files
- ~~Synchronous data loading blocks map rendering~~ → Fixed with async Promise.all() 
- ~~No progressive loading (blank screen until everything loads)~~ → Fixed with immediate map + loading overlay
- ~~Unoptimized assets~~ → GeoJSON optimized, other assets tabled

## CURRENT FOCUS AREAS

With core optimizations complete, focus has shifted to:

### Task 6: Mobile Optimization (Priority: MEDIUM)
**Goal**: Improve mobile UX

1. Detect mobile devices
2. Adjust touch targets to minimum 44px
3. Optimize controls for mobile
4. Test on various devices

### Task 7: Performance Monitoring (Priority: LOW)
**Goal**: Track optimization success

1. Add performance marks
2. Log key metrics (map load time, data load time, time to interactive)
3. Consider adding Google Analytics or similar

## File Structure Expectations
```
drone_warfare/
├── index.html
├── main.js (or similar)
├── styles.css
├── data/
│   ├── boundaries.json (original)
│   ├── boundaries-optimized.json (new)
│   ├── strikes.json
│   └── cleanup/ (existing)
├── scripts/
│   └── optimize-geojson.js (new)
├── dist/ (new)
│   ├── main.min.js
│   └── styles.min.css
├── sw.js (new)
└── package.json (new)
```

## Testing Checklist
- [x] Page shows map immediately (no blank screen) ✅ COMPLETED
- [x] Loading indicator visible during data fetch ✅ COMPLETED  
- [x] Initial load time < 3 seconds on 3G ✅ COMPLETED (optimized files)
- [ ] Mobile touch targets >= 44px
- [x] Error states handled gracefully ✅ COMPLETED
- [ ] Keyboard navigation works  
- [ ] Screen reader announces regions properly

## Performance Targets
- ✅ Initial render: < 1 second (ACHIEVED)
- ✅ Time to interactive: < 3 seconds on 3G (ACHIEVED with optimized data)
- ✅ Total page weight: < 1MB (ACHIEVED with optimized GeoJSON)
- ⏳ Lighthouse score: > 90 for Performance (PENDING VALIDATION)

## Quick Wins Status
1. ✅ Enable GZIP compression on GitHub Pages (automatic on GitHub Pages)
2. ✅ Reduce GeoJSON coordinate precision (COMPLETED via quantization)
3. ⏳ Add `loading="lazy"` to any images (NO IMAGES CURRENTLY)
4. 🚫 Minify existing CSS/JS files (TABLED FOR NOW)

## Development Approach

### Test-Driven Development (TDD)
**IMPORTANT**: All new features must follow TDD approach:
1. Write failing Cypress tests first
2. Implement minimum code to pass tests
3. Refactor while keeping tests green
4. Ensure test coverage for edge cases

**Testing Framework**: Cypress for end-to-end testing
- Test user interactions (map clicks, data loading, UI responsiveness)
- Validate performance metrics and loading states
- Ensure accessibility compliance
- Test across different viewport sizes

### Notes for Claude Code
- Focus on progressive enhancement - map should work even if data fails to load
- Maintain humanitarian focus - performance improvements shouldn't diminish impact
- Keep accessibility in mind - all optimizations should maintain or improve accessibility
- Test on throttled connection (Chrome DevTools → Network → Slow 3G)
- **NEW**: Use TDD with Cypress for all feature development - tests first, then implementation

## Questions to Consider
- Should we implement region-based lazy loading (only load data for visible regions)?
- Would a simplified "mobile mode" with reduced data be appropriate?
- Should we add a "low bandwidth" option for users on slow connections?
- Is WebP format appropriate for any preview images?
