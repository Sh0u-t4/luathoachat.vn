# ⚠️ LƯU Ý VỀ DEPLOYMENT

## 🎯 HIỆN TRẠNG

Project hiện có **2 deployment configs** song song:

1. ✅ **Bolt.new Native Hosting** (RECOMMENDED)
   - File: `next.config.js`
   - Ưu điểm: Đơn giản, nhanh, không phí phức tạp
   - Phù hợp: Deploy custom domain `luathoachat.vn`

2. ⚠️ **Netlify Adapter** (LEGACY - Không sử dụng)
   - File: `netlify.toml`
   - Package: `@netlify/plugin-nextjs` (line 18 trong package.json)
   - Status: KHÔNG được sử dụng trong Bolt.new

---

## 🔴 VẤN ĐỀ

### Khi deploy trên Bolt.new:

Nếu Bolt detect file `netlify.toml`, nó sẽ **tự động** cố gắng sử dụng Netlify adapter, dẫn đến lỗi:

```
"Something went wrong while creating your site on Netlify"
Error ID: d3ccd2ce633c4d6ba4c6143cc67bdfddnJ2Nq
```

**Nguyên nhân:** Bolt không hỗ trợ Netlify plugin, nhưng vẫn cố chạy nó vì detect được config.

---

## ✅ GIẢI PHÁP

### Option 1: DISABLE Netlify (RECOMMENDED cho Bolt)

Nếu bạn **chỉ deploy trên Bolt.new**:

#### 1. Rename/Delete netlify.toml
```bash
# Rename (giữ backup)
mv netlify.toml netlify.toml.disabled

# Hoặc delete hoàn toàn
rm netlify.toml
```

#### 2. Remove Netlify package (Optional)
```bash
npm uninstall @netlify/plugin-nextjs
```

#### 3. Deploy trên Bolt
- Project sẽ tự động dùng Next.js native build
- Không còn conflict

---

### Option 2: DUAL DEPLOYMENT (Nếu cần deploy cả Netlify + Bolt)

Nếu bạn muốn **linh hoạt deploy ở nhiều nơi**:

#### Giữ nguyên files hiện tại, NHƯNG:

**Khi deploy trên Bolt:**
1. Tạm thời rename `netlify.toml` → `netlify.toml.disabled`
2. Deploy
3. Sau khi deploy xong, rename lại nếu cần

**Khi deploy trên Netlify:**
1. Đảm bảo `netlify.toml` active
2. Connect repository với Netlify
3. Netlify tự động detect và sử dụng plugin

---

## 📋 DEPLOYMENT MATRIX

| Platform | Config File | Build Command | Output Dir | Notes |
|----------|------------|---------------|------------|-------|
| **Bolt.new** | `next.config.js` | `npm run build` | `.next` | ✅ Native Next.js |
| **Netlify** | `netlify.toml` | `npx next build` | `.next` | Cần `@netlify/plugin-nextjs` |
| **Vercel** | `vercel.json` (optional) | Auto-detect | Auto | ✅ Best for Next.js |
| **Self-hosted** | `next.config.js` | `npm run build` + `npm start` | `.next` | Cần Node.js server |

---

## 🚀 KHUYẾN NGHỊ CHO `luathoachat.vn`

### Phương án tối ưu:

**Sử dụng Bolt.new Native Hosting:**

**Lý do:**
1. ✅ Đơn giản, không cần config phức tạp
2. ✅ Global CDN built-in
3. ✅ SSL tự động
4. ✅ Free tier generous
5. ✅ Perfect cho Next.js static export

**Bỏ qua Netlify vì:**
- ❌ Thêm layer phức tạp (plugin)
- ❌ Bolt không support Netlify adapter
- ❌ Không cần thiết cho use case này

---

## 🔧 ACTION ITEMS

### Nếu chỉ deploy Bolt:

```bash
# 1. Disable Netlify config
mv netlify.toml netlify.toml.backup

# 2. (Optional) Remove package
npm uninstall @netlify/plugin-nextjs
npm install

# 3. Rebuild
npm run build

# 4. Deploy lên Bolt
# -> Click Deploy button trong Bolt UI
```

### Nếu muốn giữ flexibility:

- Giữ nguyên files
- Khi deploy Bolt: Tạm disable `netlify.toml`
- Sau đó enable lại nếu cần deploy Netlify

---

## 📊 HIỆN TRẠNG FILES

```
✅ next.config.js       - Next.js native config (USED)
✅ package.json         - Dependencies (USED)
⚠️ netlify.toml         - Netlify config (CAUSING CONFLICT)
❌ vercel.json          - Not present
✅ .bolt/config.json    - Bolt-specific config (MISSING - cần tạo)
```

---

## 🎯 FINAL RECOMMENDATION

**Cho project `luathoachat.vn`:**

1. **Deploy với Bolt.new** (Native Next.js)
2. **Disable `netlify.toml`** (rename hoặc xóa)
3. **Giữ `next.config.js`** (đã tối ưu)
4. **Add custom domain** trong Bolt UI
5. **Config DNS** tại domain provider

**Không cần:**
- ❌ Netlify adapter
- ❌ Vercel config
- ❌ Server deployment
- ❌ Docker/containerization

**Timeline:**
- Setup: 5 phút
- DNS propagate: 1-2 giờ
- SSL: Tự động sau DNS propagate
- **Total: ~2 giờ** từ lúc bắt đầu đến production ready

---

**Cập nhật:** 2026-02-24
**Status:** ✅ Ready to deploy (sau khi disable netlify.toml)
**Target:** https://luathoachat.vn
