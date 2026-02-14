# ✅ Đã Fix: Quick Ratings Hiển Thị Trong Admin Panel

## Vấn đề

Trước đây, khi người dùng click vào nút **"Hữu ích"** (👍) hoặc **"Chưa hữu ích"** (👎), các đánh giá này được lưu vào table `message_ratings` nhưng **KHÔNG** hiển thị trong trang Admin.

Chỉ có **phản hồi chi tiết** (khi user click "Phản hồi chi tiết" và nhập comment) mới được lưu vào `message_feedback` và hiển thị trong Admin.

## Giải pháp

Đã cập nhật **FeedbackViewer** component để:

### 1. Query từ cả 2 tables
- ✅ `message_feedback` - Phản hồi chi tiết (có comment)
- ✅ `message_ratings` - Đánh giá nhanh (like/dislike)

### 2. Transform và merge data
```typescript
// Transform message_ratings sang format của feedback
rating_type: 'like' → rating: 'positive'
rating_type: 'dislike' → rating: 'negative'
comment: null // Quick ratings không có comment
is_quick_rating: true // Flag để phân biệt
```

### 3. Hiển thị phân biệt rõ ràng

**Trong bảng:**
- Phản hồi chi tiết: Hiển thị nội dung comment
- Đánh giá nhanh: Hiển thị badge "Đánh giá nhanh"

**Trong file Excel:**
- Cột "Loại": "Đánh giá nhanh" hoặc "Phản hồi chi tiết"
- Cột "Nội dung": Hiển thị comment hoặc "(Đánh giá nhanh - không có nội dung)"

## File đã chỉnh sửa

```
✅ components/admin/feedback-viewer.tsx
   - Added is_quick_rating flag to Feedback interface
   - Updated fetchFeedbacks() to query both tables
   - Updated UI to show badge for quick ratings
   - Updated Excel export to include rating type
```

## Kết quả

### Trước:
```
Tổng phản hồi: 5
├─ 3 phản hồi chi tiết (từ message_feedback)
└─ 2 đánh giá nhanh (từ message_ratings) ❌ BỊ BỎ SÓT
```

### Sau:
```
Tổng phản hồi: 5
├─ 3 phản hồi chi tiết ✅
└─ 2 đánh giá nhanh ✅ ĐÃ HIỂN THỊ
```

## Cách hoạt động

```
User click "Hữu ích" / "Chưa hữu ích"
    ↓
Lưu vào message_ratings table
    ↓
Admin Panel query message_ratings
    ↓
Transform: rating_type → rating (positive/negative)
    ↓
Merge với message_feedback
    ↓
Sort theo created_at
    ↓
Hiển thị với badge "Đánh giá nhanh" ✅
```

## Statistics

Admin dashboard giờ sẽ hiển thị **chính xác** tổng số đánh giá:

- **Tổng phản hồi**: message_ratings + message_feedback
- **Phản hồi tích cực**: rating='positive' OR rating_type='like'
- **Phản hồi tiêu cực**: rating='negative' OR rating_type='dislike'

Build thành công! Admin panel giờ sẽ hiển thị đầy đủ cả quick ratings và detailed feedback! 🎉
