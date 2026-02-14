# ✅ Đã Cải Thiện: Hiển Thị User trong Chat Logs Admin

## Vấn đề trước đây

Trong phần Chat Logs admin, user được hiển thị bằng UUID:
```
User: ba44c8fe-8842-4555-97e2-63f1a5286905
```

Điều này rất khó đọc và không tiện cho việc rà soát. Admin phải copy UUID và tra cứu trong database để biết đó là ai.

## Giải pháp

Đã cập nhật **ChatLogsViewer** component để hiển thị tên và email thay vì UUID.

### 1. Cập nhật Data Structure

**Interface ChatLog:**
```typescript
interface ChatLog {
  // ... existing fields
  user_email?: string;
  user_full_name?: string;  // ✅ Thêm field mới
}
```

**Users State:**
```typescript
const [users, setUsers] = useState<Array<{ 
  id: string; 
  email: string; 
  full_name?: string  // ✅ Thêm field mới
}>>([]);
```

### 2. Query đầy đủ thông tin user

**Load Users (Filter dropdown):**
```typescript
const { data: profiles, error } = await supabase
  .from('user_profiles')
  .select('id, email, full_name')  // ✅ Thêm full_name
  .order('email');
```

**Load Chat Logs với User Info:**
```typescript
const { data: profiles } = await supabase
  .from('user_profiles')
  .select('id, email, full_name')  // ✅ Thêm full_name
  .in('id', userIds);

// Map cả email và full_name
profiles.forEach(profile => {
  userProfileMap.set(profile.id, {
    email: profile.email,
    full_name: profile.full_name,
  });
});
```

### 3. UI hiển thị thân thiện

**Trước:**
```html
<span>User: ba44c8fe-8842-4555-97e2-63f1a5286905</span>
```

**Sau:**
```html
<div className="flex items-center gap-1.5">
  <User className="w-3 h-3" />
  <span className="font-medium text-slate-700">
    Nguyễn Văn A
  </span>
  <span className="text-slate-400">(nguyenvana@company.com)</span>
</div>
```

**Logic hiển thị:**
- Nếu có `full_name`: Hiển thị tên + email trong ngoặc
- Nếu chỉ có `email`: Hiển thị email
- Nếu không có gì: "Khách (chưa đăng nhập)"

### 4. Excel Export cải thiện

**Trước:**
```
User Email | User ID
nguyenvana@company.com | ba44c8fe-8842-4555-97e2-63f1a5286905
```

**Sau:**
```
Tên người dùng | Email | User ID
Nguyễn Văn A | nguyenvana@company.com | ba44c8fe-8842-4555-97e2-63f1a5286905
```

### 5. Filter Dropdown thông minh

**Trước:**
```
[Dropdown]
├─ Tất cả users
├─ nguyenvana@company.com
├─ tranthib@company.com
└─ levanc@company.com
```

**Sau:**
```
[Dropdown] (Rộng hơn: 280px)
├─ Tất cả users
├─ Nguyễn Văn A (nguyenvana@company.com)
├─ Trần Thị B (tranthib@company.com)
└─ Lê Văn C (levanc@company.com)
```

## File đã chỉnh sửa

```
✅ components/admin/chat-logs-viewer.tsx
   - Added user_full_name to ChatLog interface (line 24)
   - Updated users state type (line 48)
   - Query full_name in loadUsers() (line 61)
   - Query full_name in loadChatLogs() (line 119)
   - Map both email and full_name (line 115-133)
   - Updated UI to show name/email (line 346-355)
   - Updated Excel export with name column (line 199-228)
   - Updated filter dropdown to show name (line 274-278)
```

## Kết quả

### Trước:
```
┌─────────────────────────────────────────────────┐
│ User: ba44c8fe-8842-4555-97e2-63f1a5286905     │
│ Session: sess_177...  ⏱️ 1250ms                │
└─────────────────────────────────────────────────┘
❌ Khó đọc, phải tra UUID
```

### Sau:
```
┌─────────────────────────────────────────────────┐
│ 👤 Nguyễn Văn A (nguyenvana@company.com)       │
│ Session: sess_177...  ⏱️ 1250ms                │
└─────────────────────────────────────────────────┘
✅ Dễ đọc, rõ ràng, tiện rà soát
```

## Các trường hợp hiển thị

| Trường hợp | Hiển thị |
|------------|----------|
| Có full_name + email | "Nguyễn Văn A (nguyenvana@company.com)" |
| Chỉ có email | "nguyenvana@company.com" |
| Có user_id nhưng không có profile | "Khách (chưa đăng nhập)" |
| Không có user_id (anonymous) | "Khách (chưa đăng nhập)" |

## Lợi ích

✅ **Dễ rà soát:** Admin nhìn thấy ngay tên người dùng thực
✅ **Tiết kiệm thời gian:** Không cần tra cứu UUID
✅ **Thân thiện hơn:** Hiển thị tên người thay vì chuỗi kỹ thuật
✅ **Excel report tốt hơn:** File xuất ra có đầy đủ thông tin
✅ **Filter thông minh:** Dropdown hiển thị tên giúp tìm user nhanh hơn
✅ **Không breaking:** Vẫn fallback về "Khách" cho user chưa đăng nhập
✅ **Performance:** Chỉ query 1 lần, cache trong Map để reuse

## Testing

### Kiểm tra trong Admin:

1. **Vào trang Admin → Tab "Chat Logs"**
2. **Xem danh sách chat:**
   - User có profile → Hiển thị tên + email ✅
   - User chưa có tên → Hiển thị email ✅
   - Anonymous user → Hiển thị "Khách" ✅
3. **Thử filter dropdown:**
   - Dropdown hiển thị "Tên (Email)" ✅
   - Chọn user sẽ lọc đúng chat của user đó ✅
4. **Xuất Excel:**
   - File có cột "Tên người dùng" ✅
   - Cột "Email" riêng biệt ✅
   - Dữ liệu đầy đủ và dễ đọc ✅

### Test cases:

1. **User đã đăng ký, có tên đầy đủ:**
   - Input: user_id có trong user_profiles, full_name = "Nguyễn Văn A"
   - Output: "👤 Nguyễn Văn A (nguyenvana@company.com)"

2. **User đã đăng ký, chưa cập nhật tên:**
   - Input: user_id có trong user_profiles, full_name = null
   - Output: "👤 nguyenvana@company.com"

3. **User đã đăng nhập nhưng profile bị xóa:**
   - Input: user_id không có trong user_profiles
   - Output: "👤 Khách (chưa đăng nhập)"

4. **User chưa đăng nhập (anonymous):**
   - Input: user_id = null
   - Output: "👤 Khách (chưa đăng nhập)"

## Notes

- Icon User (👤) được thêm vào để dễ nhận diện
- Font weight "medium" cho tên để nổi bật hơn
- Email trong ngoặc với màu nhạt hơn (text-slate-400)
- Width của filter dropdown tăng từ 220px → 280px để hiển thị đủ tên dài
- Excel export giữ nguyên cột "User ID" để trace nếu cần

Build thành công! Chat Logs giờ hiển thị thông tin user rõ ràng và thân thiện hơn! 🎉
