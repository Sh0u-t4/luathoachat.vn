# Hướng Dẫn Hiệu Ứng Typing Effect

## 🎯 Mục Đích

Tính năng **Typing Effect** (hiệu ứng hiển thị từng chữ) được thiết kế để:
- ✨ Tạo trải nghiệm tương tác tự nhiên, giống như AI đang "suy nghĩ" và trả lời
- 🎭 Kích thích sự tò mò và mong muốn đọc tiếp của người dùng
- 💫 Tạo cảm giác "sống động" cho chatbot
- 🎨 Nâng cao UX/UI chuyên nghiệp như ChatGPT, Claude

## 📐 Kiến Trúc Kỹ Thuật

### 1. Custom Hook: `useTypingEffect`

**File:** `/hooks/use-typing-effect.ts`

Hook này quản lý logic hiển thị từng ký tự:

```typescript
export function useTypingEffect(
  fullText: string,        // Toàn bộ text cần hiển thị
  isActive: boolean,       // Có kích hoạt typing effect không?
  options: {
    speed?: number;        // Tốc độ (ms/ký tự) - default: 15ms
    onComplete?: () => void; // Callback khi hoàn thành
  }
)
```

**Cách hoạt động:**
- Sử dụng `setTimeout` để từ từ tăng index của text hiển thị
- Mỗi 15ms (mặc định), thêm 1 ký tự vào `displayedText`
- Khi đạt độ dài đầy đủ, gọi `onComplete` callback
- Tự động cleanup timer khi component unmount

### 2. Component: `AssistantMessage`

**File:** `/components/chat/assistant-message.tsx`

Component chuyên xử lý hiển thị message từ AI:

**Tính năng:**
- Tách nội dung thành 2 phần: Public (25%) và Locked (75%)
- Apply typing effect **CHỈ** cho message mới nhất (`isLatest=true`)
- Hiển thị cursor nhấp nháy (▌) khi đang typing
- Các message cũ hiển thị toàn bộ ngay lập tức (không typing)

**Props:**
```typescript
interface AssistantMessageProps {
  message: ChatMessage;
  isLatest: boolean;        // Có phải message mới nhất không?
  isAuthenticated: boolean; // User đã đăng nhập chưa?
  onUnlockClick: () => void; // Callback khi click nút "Unlock"
}
```

### 3. Chat Interface Integration

**File:** `/components/chat/chat-interface.tsx`

**Cách hoạt động:**
1. Track ID của message assistant mới nhất qua state `latestAssistantId`
2. Khi có message mới, update `latestAssistantId` để trigger typing effect
3. Chỉ message có ID khớp với `latestAssistantId` mới được apply typing effect

```tsx
const [latestAssistantId, setLatestAssistantId] = useState<string | null>(null);

useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'assistant') {
    setLatestAssistantId(lastMessage.id);
  }
}, [messages]);
```

## ⚙️ Tham Số Cấu Hình

### Tốc Độ Typing

**Default:** `15ms` / ký tự

Điều chỉnh trong `/components/chat/assistant-message.tsx`:

```tsx
const { displayedText } = useTypingEffect(publicPart, isLatest, {
  speed: 15, // ← Thay đổi giá trị này
});
```

**Gợi ý:**
- `10-15ms`: Nhanh, tự nhiên (✅ Recommended)
- `20-30ms`: Chậm hơn, nhấn mạnh từng từ
- `5-10ms`: Rất nhanh, gần như tức thì

### Cursor Animation

Cursor được tạo bằng Tailwind CSS:

```tsx
<span className="inline-block w-1 h-4 bg-cyan-600 ml-0.5 animate-pulse" />
```

**Thuộc tính:**
- `w-1`: Độ rộng 1px
- `h-4`: Chiều cao 4px (theo font)
- `bg-cyan-600`: Màu cyan
- `animate-pulse`: Animation nhấp nháy của Tailwind

## 🎨 UX Flow

### Khi User Gửi Câu Hỏi:

1. **User message** hiển thị ngay lập tức (không typing)
2. **Loading indicator** (3 chấm nhấp nháy) xuất hiện
3. **AI response** được fetch từ backend
4. **Typing effect** bắt đầu:
   - Hiển thị từng ký tự của phần Public (25%)
   - Sau đó hiển thị phần Locked (75%) nếu user đã đăng nhập
   - Cursor nhấp nháy ở cuối text đang typing

### Khi Load Chat History:

- **Tất cả messages cũ** hiển thị toàn bộ ngay (không typing)
- Chỉ message mới nhất có typing effect

## 🔧 Tùy Chỉnh

### 1. Thay Đổi Kiểu Cursor

Thay vì cursor đứng, dùng underscore:

```tsx
<span className="inline-block w-3 h-0.5 bg-cyan-600 ml-0.5 animate-pulse" />
```

### 2. Typing Theo Từ (Thay Vì Theo Ký Tự)

Modify logic trong `useTypingEffect`:

```typescript
const words = fullText.split(' ');
let currentWordIndex = 0;

const typeNextWord = () => {
  if (currentWordIndex < words.length) {
    setDisplayedText(words.slice(0, currentWordIndex + 1).join(' '));
    currentWordIndex += 1;
    timerRef.current = setTimeout(typeNextWord, 50); // 50ms per word
  }
};
```

### 3. Bỏ Typing Effect Cho Một Message Cụ Thể

Trong `chat-interface.tsx`, set `isLatest={false}`:

```tsx
<AssistantMessage
  message={message}
  isLatest={false} // ← Force disable typing
  isAuthenticated={isAuthenticated}
  onUnlockClick={handleUnlockClick}
/>
```

## 📊 Performance

### Tối Ưu Hóa:

1. **Chỉ 1 message typing cùng lúc** - Ngăn typing đồng thời nhiều message
2. **Cleanup timers** - Tự động clear timeout khi component unmount
3. **React.memo** - Có thể wrap `AssistantMessage` để tránh re-render không cần thiết:

```tsx
export const AssistantMessage = React.memo(function AssistantMessage({ ... }) {
  // component logic
});
```

### Memory Footprint:

- **Light:** Chỉ 1 timer active
- **No memory leaks:** Cleanup trong useEffect
- **Minimal re-renders:** Chỉ update displayedText state

## 🐛 Troubleshooting

### Issue: Typing quá chậm

**Solution:** Giảm giá trị `speed` trong options:

```tsx
const { displayedText } = useTypingEffect(text, true, { speed: 10 });
```

### Issue: Nhiều messages typing cùng lúc

**Root cause:** Logic `isLatest` không chính xác

**Solution:** Kiểm tra logic trong `chat-interface.tsx`:

```tsx
useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'assistant') {
    setLatestAssistantId(lastMessage.id);
  }
}, [messages]);
```

### Issue: Cursor không nhấp nháy

**Solution:** Kiểm tra Tailwind animation có hoạt động:

```tsx
// Test với class này
<span className="animate-pulse">Test</span>
```

Nếu không hoạt động, check `tailwind.config.ts` có enable animation:

```js
module.exports = {
  theme: {
    extend: {
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

## 🚀 Tương Lai

### Tính Năng Có Thể Mở Rộng:

1. **Streaming Response:** Integrate với Server-Sent Events (SSE) để typing real-time từ backend
2. **Sound Effects:** Thêm âm thanh "tick" mỗi ký tự (tùy chọn bật/tắt)
3. **Multiple Speeds:** User tự điều chỉnh tốc độ typing trong Settings
4. **Skip Animation:** Nút "Skip" để hiển thị toàn bộ text ngay lập tức

---

**✅ Implementation Complete!**

Typing effect đã được tích hợp đầy đủ và hoạt động ổn định. Build project thành công với zero errors.
