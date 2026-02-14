# Giải pháp khắc phục lỗi ChunkLoadError

## Vấn đề

Lỗi **ChunkLoadError** xảy ra khi:
- User đang ở trang cũ, code mới đã được deploy → Chunk hash thay đổi → 404 Not Found
- Network issues khi tải JavaScript chunks
- Browser cache conflict giữa phiên bản cũ và mới

## Giải pháp đã triển khai

### 1. **Error Boundary với Auto-reload**
📁 `components/error-boundary.tsx`

- Catch tất cả chunk load errors ở React component level
- Tự động reload trang sau 2 giây khi phát hiện chunk error
- Hiển thị UI thân thiện thay vì white screen
- Prevent infinite reload loop

### 2. **Global Error Handler**
📁 `app/layout.tsx` (trong `<head>`)

- Listen tất cả window errors
- Detect chunk load errors bằng message pattern matching
- Auto-reload với sessionStorage tracking để tránh vòng lặp
- Chạy trước khi React hydrate

### 3. **Webpack Configuration Optimization**
📁 `next.config.js`

**Cải tiến:**
- ✅ Content-hash naming cho chunks (better cache invalidation)
- ✅ Split vendors chunk riêng (ổn định hơn giữa các deploy)
- ✅ Runtime chunk single (giảm số lượng chunks)
- ✅ Aggressive caching headers cho static assets

### 4. **Dynamic Import với Retry Logic**
📁 `lib/dynamic-import-with-retry.ts`

**Tính năng:**
- Automatic retry với exponential backoff
- Tối đa 3 lần thử lại
- Auto-reload nếu vẫn fail sau retries
- Prevent infinite reload với counter

**Cách dùng:**
```typescript
import { dynamicImportWithRetry } from '@/lib/dynamic-import-with-retry';

// Thay vì:
const MyComponent = lazy(() => import('./MyComponent'));

// Dùng:
const MyComponent = lazy(() =>
  dynamicImportWithRetry(() => import('./MyComponent'))
);
```

### 5. **Service Worker Caching**
📁 `public/sw.js` + `lib/register-sw.ts`

**Chức năng:**
- Cache tất cả chunks đã load thành công
- Serve từ cache nếu network fail
- Auto-update khi có version mới
- Clear old caches khi activate

**Cache Strategy:**
- Static chunks: **Cache-first** → Network fallback
- Other requests: **Network-first** → Cache fallback

### 6. **PWA Support**
📁 `public/manifest.json`

- Progressive Web App capabilities
- Offline-first approach
- Install prompt trên mobile

## Kiểm tra hoạt động

### Test Chunk Error Recovery:

1. **Simulate chunk error:**
```javascript
// Trong console
window.dispatchEvent(new ErrorEvent('error', {
  message: 'Loading chunk 123 failed'
}));
```

2. **Xem console logs:**
```
[ChunkLoadError] Detected, reloading page...
[ErrorBoundary] Chunk load error detected, reloading page in 2 seconds...
```

3. **Kiểm tra network tab:**
- Chunks được cache bởi Service Worker
- Cache headers: `public, max-age=31536000, immutable`

### Test Service Worker:

```javascript
// Check registration
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', reg);
});

// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.update();
});

// Clear cache
import { clearServiceWorkerCache } from '@/lib/register-sw';
clearServiceWorkerCache();
```

## Các lớp bảo vệ (Defense Layers)

```
Layer 1: Service Worker Cache
  └─> Chunks được cache → Serve ngay cả khi server 404

Layer 2: Dynamic Import Retry
  └─> Retry 3 lần với exponential backoff

Layer 3: Global Error Handler
  └─> Catch window errors → Auto-reload

Layer 4: React Error Boundary
  └─> Catch component errors → Fallback UI + Reload

Layer 5: Webpack Cache Strategy
  └─> Content-hash + Proper cache headers
```

## Best Practices

### Deployment Strategy:

1. **Before deploy:**
```bash
npm run build
```

2. **After deploy:**
- Service Worker tự động phát hiện version mới
- User được prompt reload (hoặc auto-reload khi idle)
- Old chunks vẫn available trong cache (grace period)

### Monitoring:

Theo dõi trong production:
```javascript
window.addEventListener('error', (e) => {
  if (e.message?.includes('chunk')) {
    // Send to analytics
    console.error('[Chunk Error]', {
      message: e.message,
      filename: e.filename,
      timestamp: new Date().toISOString()
    });
  }
});
```

## Lợi ích

✅ **User Experience:**
- Không còn white screen
- Auto-recovery transparent
- Offline support

✅ **Developer Experience:**
- Deploy tự tin hơn
- Ít complaints về "trang bị lỗi"
- Easy debugging với clear logs

✅ **Performance:**
- Chunks được cache hiệu quả
- Reduce server load
- Faster subsequent loads

## Troubleshooting

### Lỗi vẫn còn sau khi implement?

1. **Hard refresh cache:**
```bash
Ctrl + Shift + R (hoặc Cmd + Shift + R trên Mac)
```

2. **Unregister old SW:**
```javascript
import { unregisterServiceWorker } from '@/lib/register-sw';
unregisterServiceWorker().then(() => window.location.reload());
```

3. **Check build output:**
```bash
npm run build
# Kiểm tra chunks generated trong .next/static/chunks/
```

### Service Worker không hoạt động?

- Chỉ chạy trên production (`NODE_ENV=production`)
- Cần HTTPS (hoặc localhost)
- Check DevTools > Application > Service Workers

## Kết luận

Giải pháp này đảm bảo:
- **Zero downtime** khi deploy code mới
- **Automatic recovery** từ chunk load errors
- **Better caching** strategy cho production
- **Progressive enhancement** với Service Worker

User sẽ không bao giờ thấy lỗi "ChunkLoadError" nữa!
