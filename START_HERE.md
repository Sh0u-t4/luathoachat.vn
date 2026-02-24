# 🚀 START HERE: Deploy luathoachat.vn

## ⚡ TRẠNG THÁI Dự ÁN

**Build:** ✅ PASSING
**Framework:** Next.js 13
**Target:** https://luathoachat.vn
**Platform:** Bolt.new Hosting

---

## 🔴 BƯỚC 1: FIX CONFLICT (BẮT BUỘC - 30 GIÂY)

Project hiện có file `netlify.toml` gây conflict với Bolt.new.

**Chạy lệnh này:**
```bash
mv netlify.toml netlify.toml.disabled
```

Hoặc xóa hẳn:
```bash
rm netlify.toml
```

✅ **Verify:** Chạy script kiểm tra
```bash
bash verify-deployment-ready.sh
```

---

## 🚀 BƯỚC 2: DEPLOY TRÊN BOLT (2 PHÚT)

### A. Set Environment Variables

Trong Bolt.new UI:
- Click **Settings** (⚙️)
- Chọn **Environment Variables**
- Add 2 biến này:

```
NEXT_PUBLIC_SUPABASE_URL=https://kahzohzwrypqlakpvhxd.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthaHpvaHp3cnlwcWxha3B2aHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwNDYyMTYsImV4cCI6MjA1MzYyMjIxNn0.hQ1KIqAMoN_1oPG0C9YfJfEA-KFPpOOk_DcD_dW_Idc
```

### B. Deploy
- Click nút **🚀 Deploy**
- Đợi 1-2 phút
- Nhận URL: `https://xxx-xxx.bolt.new`
- **Test URL này trước khi làm tiếp**

---

## 🌐 BƯỚC 3: ADD CUSTOM DOMAIN (2 PHÚT)

### Trong Bolt.new:
1. **Settings** → **Domains**
2. Click **Add Domain**
3. Nhập: `luathoachat.vn`
4. Nhập thêm: `www.luathoachat.vn`
5. **Copy DNS records** (sẽ hiển thị dạng):
   ```
   A Record: @ → XXX.XXX.XXX.XXX
   CNAME: www → xxx.bolt.new
   ```

---

## 🔧 BƯỚC 4: CONFIG DNS (5 PHÚT)

### Tùy theo nhà cung cấp domain:

#### **GoDaddy:**
```
1. My Products → luathoachat.vn → Manage DNS
2. Add A Record:
   Name: @
   Value: [IP từ Bolt]
   TTL: 600

3. Add CNAME:
   Name: www
   Value: [xxx.bolt.new]
   TTL: 1 Hour
```

#### **Cloudflare:**
```
1. Dashboard → luathoachat.vn → DNS
2. Add A Record:
   Name: @
   IPv4: [IP từ Bolt]
   Proxied: ON (🟠)

3. Add CNAME:
   Name: www
   Target: [xxx.bolt.new]
   Proxied: ON (🟠)

BONUS:
- SSL/TLS → Full (Strict)
- Speed → Auto Minify: Enable
```

#### **Tên Miền Việt:**
```
1. Quản lý domain → DNS Settings
2. Thêm A: @ → [IP từ Bolt]
3. Thêm CNAME: www → [xxx.bolt.new]
```

---

## ⏱️ BƯỚC 5: ĐỢI & VERIFY (1-2 GIỜ)

### Kiểm tra DNS Propagation:
**Tool:** https://dnschecker.org
- Nhập: `luathoachat.vn`
- Type: A
- Chờ tất cả server màu xanh

**Command line:**
```bash
nslookup luathoachat.vn
# Hoặc
dig luathoachat.vn
```

### Khi DNS đã propagate:

✅ **Mở:** https://luathoachat.vn

✅ **Kiểm tra:**
- Khóa xanh 🔒 (SSL)
- Trang load đầy đủ
- Chat AI hoạt động
- F12 Console không có lỗi

---

## 📚 TÀI LIỆU THAM KHẢO

### Quick Guides:
1. **LUATHOACHAT_VN_DEPLOY_SUMMARY.md** - Tóm tắt toàn bộ
2. **DEPLOY_TO_LUATHOACHAT_VN.md** - Hướng dẫn nhanh
3. **BOLT_CUSTOM_DOMAIN_GUIDE.md** - Guide chi tiết custom domain

### Technical Docs:
4. **DEPLOYMENT_NOTE.md** - Giải thích về Netlify conflict
5. **DEPLOYMENT.md** - Options deployment khác

### Scripts:
6. **verify-deployment-ready.sh** - Check readiness

---

## 🔴 TROUBLESHOOTING

| Vấn đề | Giải pháp |
|--------|-----------|
| Lỗi Netlify khi deploy Bolt | `mv netlify.toml netlify.toml.disabled` |
| DNS không resolve | Đợi 1-2 giờ, clear cache: `ipconfig /flushdns` |
| SSL chưa có | Đợi 15 phút sau DNS propagate |
| Web trắng | Add env variables trong Bolt Settings |
| CSS không load | Hard refresh: Ctrl+Shift+R |

---

## ✅ CHECKLIST

### Pre-Deployment:
- [ ] Chạy `mv netlify.toml netlify.toml.disabled`
- [ ] Verify build: `npm run build`
- [ ] Chạy `bash verify-deployment-ready.sh`

### Deployment:
- [ ] Add env variables trong Bolt
- [ ] Click Deploy và test URL tạm
- [ ] Add custom domain trong Bolt
- [ ] Copy DNS records

### DNS Config:
- [ ] Config A record tại domain provider
- [ ] Config CNAME record
- [ ] Verify tại dnschecker.org
- [ ] Đợi DNS propagate (1-2 giờ)

### Post-Deploy:
- [ ] Test: https://luathoachat.vn
- [ ] Verify SSL (🔒)
- [ ] Test chat AI
- [ ] Check mobile responsive
- [ ] F12 Console: no critical errors

---

## 🎯 TIMELINE

| Step | Time | Status |
|------|------|--------|
| Fix conflict | 30s | ⏳ TODO |
| Deploy Bolt | 2m | ⏳ TODO |
| Add domain | 2m | ⏳ TODO |
| Config DNS | 5m | ⏳ TODO |
| DNS propagate | 1-2h | ⏳ AUTO |
| SSL issuance | 15m | ⏳ AUTO |
| **TOTAL** | **~2-3h** | 🎯 |

---

## 📞 HỖ TRỢ

**Tools:**
- DNS Check: https://dnschecker.org
- SSL Test: https://ssllabs.com/ssltest
- PageSpeed: https://pagespeed.web.dev

**Support:**
- Bolt: https://bolt.new/support
- Supabase: https://status.supabase.com

---

## 🚀 BẮT ĐẦU NGAY

**Chạy lệnh này:**
```bash
# 1. Fix conflict
mv netlify.toml netlify.toml.disabled

# 2. Verify
bash verify-deployment-ready.sh

# 3. Nếu OK, proceed với Bolt UI deployment
```

---

**Cập nhật:** 2026-02-24
**Estimated Time to Production:** 2-3 giờ
**Blocking Issue:** netlify.toml (30s để fix)

🎉 **Let's deploy!**
