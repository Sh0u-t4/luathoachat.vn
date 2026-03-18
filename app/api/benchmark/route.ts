import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Golden dataset: 50 benchmark questions ────────────────────────────────
const BENCHMARK_QUESTIONS = [
  // Group 1: Tra cứu đơn (10)
  { id: 'q01', type: 'tra_cuu_don', question: 'Giấy chứng nhận đủ điều kiện sản xuất hóa chất có thời hạn bao nhiêu năm?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q02', type: 'tra_cuu_don', question: 'Giấy phép xuất khẩu tiền chất do cơ quan nào cấp?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q03', type: 'tra_cuu_don', question: 'Luật Hóa chất số 69/2025 có hiệu lực từ ngày nào?', required_sources: ['Luật 69'], expected_format: 'text' },
  { id: 'q04', type: 'tra_cuu_don', question: 'Ngưỡng khai báo hóa chất nguy hiểm tối thiểu là bao nhiêu kg/năm?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q05', type: 'tra_cuu_don', question: 'Mức phạt tối đa cho hành vi sản xuất hóa chất không có GCN đủ điều kiện là bao nhiêu?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q06', type: 'tra_cuu_don', question: 'Hóa chất kiểm soát đặc biệt gồm những nhóm nào?', required_sources: ['Luật 69'], expected_format: 'text' },
  { id: 'q07', type: 'tra_cuu_don', question: 'Khoảng cách an toàn tối thiểu cho kho chứa hóa chất loại 1 là bao nhiêu mét?', required_sources: ['NĐ 25'], expected_format: 'text' },
  { id: 'q08', type: 'tra_cuu_don', question: 'Hóa chất có điều kiện theo NĐ 26 cần giấy phép gì khác ngoài GCN?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q09', type: 'tra_cuu_don', question: 'Phòng thí nghiệm hóa chất có cần GCN đủ điều kiện không?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q10', type: 'tra_cuu_don', question: 'Danh mục hóa chất cấm được quy định tại văn bản nào?', required_sources: ['Luật 69', 'NĐ 24'], expected_format: 'text' },

  // Group 2: Liệt kê (10)
  { id: 'q11', type: 'liet_ke', question: 'Liệt kê tất cả điều kiện để được cấp GCN đủ điều kiện sản xuất hóa chất có điều kiện.', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q12', type: 'liet_ke', question: 'Các trường hợp được miễn khai báo hóa chất là gì?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q13', type: 'liet_ke', question: 'Liệt kê hồ sơ cần nộp để xin cấp GCN đủ điều kiện kinh doanh hóa chất có điều kiện.', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q14', type: 'liet_ke', question: 'Yêu cầu đối với người phụ trách kỹ thuật tại cơ sở sản xuất hóa chất nguy hiểm gồm những gì?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q15', type: 'liet_ke', question: 'Danh sách các loại hình hoạt động hóa chất phải có GCN theo NĐ 26?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q16', type: 'liet_ke', question: 'Liệt kê các yêu cầu về kho chứa hóa chất nguy hiểm theo quy định.', required_sources: ['NĐ 25', 'NĐ 26'], expected_format: 'list' },
  { id: 'q17', type: 'liet_ke', question: 'Các trường hợp thu hồi GCN đủ điều kiện sản xuất hóa chất gồm những gì?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q18', type: 'liet_ke', question: 'Liệt kê các biện pháp ứng phó sự cố hóa chất bắt buộc theo quy định.', required_sources: ['NĐ 25'], expected_format: 'list' },
  { id: 'q19', type: 'liet_ke', question: 'Hóa chất thuộc Phụ lục I Danh mục hóa chất hạn chế sản xuất kinh doanh gồm những loại nào?', required_sources: ['NĐ 24'], expected_format: 'list' },
  { id: 'q20', type: 'liet_ke', question: 'Liệt kê quyền và nghĩa vụ của tổ chức sản xuất hóa chất theo Luật 69.', required_sources: ['Luật 69'], expected_format: 'list' },

  // Group 3: So sánh (8)
  { id: 'q21', type: 'so_sanh', question: 'So sánh điều kiện cấp GCN sản xuất hóa chất có điều kiện và kinh doanh hóa chất có điều kiện.', required_sources: ['NĐ 26'], expected_format: 'table' },
  { id: 'q22', type: 'so_sanh', question: 'So sánh hóa chất có điều kiện và hóa chất kiểm soát đặc biệt về các loại giấy phép cần có.', required_sources: ['Luật 69', 'NĐ 26'], expected_format: 'table' },
  { id: 'q23', type: 'so_sanh', question: 'So sánh mức phạt vi phạm về sản xuất hóa chất giữa NĐ 24 và NĐ 26.', required_sources: ['NĐ 24', 'NĐ 26'], expected_format: 'table' },
  { id: 'q24', type: 'so_sanh', question: 'So sánh thủ tục cấp phép lần đầu và gia hạn GCN đủ điều kiện.', required_sources: ['NĐ 26'], expected_format: 'table' },
  { id: 'q25', type: 'so_sanh', question: 'Phân biệt tiền chất thuốc nổ và tiền chất ma túy về yêu cầu quản lý.', required_sources: ['NĐ 26'], expected_format: 'table' },
  { id: 'q26', type: 'so_sanh', question: 'So sánh khoảng cách an toàn cho kho hóa chất loại 1 và loại 2 theo NĐ 25.', required_sources: ['NĐ 25'], expected_format: 'table' },
  { id: 'q27', type: 'so_sanh', question: 'So sánh nghĩa vụ khai báo hóa chất trước và sau khi Luật 69/2025 có hiệu lực.', required_sources: ['Luật 69', 'NĐ 26'], expected_format: 'table' },
  { id: 'q28', type: 'so_sanh', question: 'So sánh yêu cầu nhân sự kỹ thuật giữa cơ sở sản xuất và kinh doanh hóa chất nguy hiểm.', required_sources: ['NĐ 26'], expected_format: 'table' },

  // Group 4: Phức hợp (7)
  { id: 'q29', type: 'phuc_hop', question: 'DN vừa sản xuất vừa kinh doanh hóa chất có điều kiện VÀ hóa chất kiểm soát đặc biệt cần những giấy phép gì?', required_sources: ['NĐ 26'], expected_format: 'structured' },
  { id: 'q30', type: 'phuc_hop', question: 'Nếu kho chứa hóa chất vừa lưu trữ hóa chất loại 1 vừa loại 2, các yêu cầu nào áp dụng?', required_sources: ['NĐ 25'], expected_format: 'structured' },
  { id: 'q31', type: 'phuc_hop', question: 'DN nhập khẩu tiền chất về để sản xuất hóa chất có điều kiện, quy trình cấp phép như thế nào?', required_sources: ['NĐ 26'], expected_format: 'structured' },
  { id: 'q32', type: 'phuc_hop', question: 'Công ty nước ngoài muốn đầu tư sản xuất hóa chất tại Việt Nam cần đáp ứng những điều kiện gì?', required_sources: ['Luật 69', 'NĐ 26'], expected_format: 'structured' },
  { id: 'q33', type: 'phuc_hop', question: 'DN đang có GCN cũ theo NĐ 113 nay chuyển sang NĐ 26, cần làm thủ tục gì và trong thời hạn bao lâu?', required_sources: ['NĐ 26'], expected_format: 'structured' },
  { id: 'q34', type: 'phuc_hop', question: 'Khi xảy ra sự cố hóa chất, DN phải thực hiện những bước gì và thông báo cho những cơ quan nào?', required_sources: ['NĐ 25'], expected_format: 'structured' },
  { id: 'q35', type: 'phuc_hop', question: 'Cơ sở kinh doanh hóa chất nguy hiểm vi phạm 3 lần trong năm sẽ bị xử lý như thế nào theo mức độ tăng dần?', required_sources: ['NĐ 26'], expected_format: 'structured' },

  // Group 5: Quy trình (5)
  { id: 'q36', type: 'quy_trinh', question: 'Quy trình xin cấp Giấy chứng nhận đủ điều kiện sản xuất hóa chất có điều kiện từ A đến Z?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q37', type: 'quy_trinh', question: 'Thủ tục khai báo nhập khẩu hóa chất nguy hiểm lần đầu gồm những bước gì?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q38', type: 'quy_trinh', question: 'Quy trình đánh giá rủi ro và xây dựng biện pháp an toàn theo NĐ 25 gồm những bước nào?', required_sources: ['NĐ 25'], expected_format: 'list' },
  { id: 'q39', type: 'quy_trinh', question: 'Thủ tục gia hạn GCN đủ điều kiện kinh doanh hóa chất cần chuẩn bị gì và nộp trước bao nhiêu ngày?', required_sources: ['NĐ 26'], expected_format: 'list' },
  { id: 'q40', type: 'quy_trinh', question: 'Quy trình xây dựng Kế hoạch ứng phó sự cố hóa chất bắt buộc cho DN sản xuất?', required_sources: ['NĐ 25'], expected_format: 'list' },

  // Group 6: Edge cases (5)
  { id: 'q41', type: 'edge_case', question: 'Giá dầu thô hôm nay là bao nhiêu?', required_sources: [], expected_format: 'text' },
  { id: 'q42', type: 'edge_case', question: 'NĐ 25 quy định về điều kiện kinh doanh hóa chất có điều kiện như thế nào?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q43', type: 'edge_case', question: 'Hóa chất có điều kiện không cần GCN và cũng không cần khai báo, đúng không?', required_sources: ['NĐ 26'], expected_format: 'text' },
  { id: 'q44', type: 'edge_case', question: 'Thông tư 32/2017 về MSDS quy định gì về thành phần hóa chất?', required_sources: [], expected_format: 'text' },
  { id: 'q45', type: 'edge_case', question: 'Tôi muốn hỏi về điều khoản chuyển tiếp trong NĐ 26 cho GCN đã cấp theo NĐ 113.', required_sources: ['NĐ 26'], expected_format: 'text' },

  // Group 7: Cross-reference (5)
  { id: 'q46', type: 'cross_ref', question: 'Luật 69 và NĐ 26 phân chia thẩm quyền quản lý hóa chất như thế nào?', required_sources: ['Luật 69', 'NĐ 26'], expected_format: 'structured' },
  { id: 'q47', type: 'cross_ref', question: 'NĐ 25 quy định về đánh giá rủi ro có liên quan thế nào đến điều kiện cấp phép trong NĐ 26?', required_sources: ['NĐ 25', 'NĐ 26'], expected_format: 'text' },
  { id: 'q48', type: 'cross_ref', question: 'Điều kiện về khoảng cách an toàn trong NĐ 25 có phải điều kiện bắt buộc để được cấp GCN theo NĐ 26 không?', required_sources: ['NĐ 25', 'NĐ 26'], expected_format: 'text' },
  { id: 'q49', type: 'cross_ref', question: 'Luật 69 và NĐ 24 cùng quy định về Danh mục hóa chất, có mâu thuẫn gì không?', required_sources: ['Luật 69', 'NĐ 24'], expected_format: 'text' },
  { id: 'q50', type: 'cross_ref', question: 'Tổng hợp các văn bản pháp luật cần tham chiếu khi DN muốn nhập khẩu hóa chất kiểm soát đặc biệt.', required_sources: ['Luật 69', 'NĐ 24', 'NĐ 26'], expected_format: 'list' },
];

// ── Scoring helpers ─────────────────────────────────────────────────────────
function scoreCompleteness(response: string, question: string): number {
  if (!response || response.length < 50) return 0;
  if (response.length > 500) return 40;
  if (response.length > 200) return 30;
  return 15;
}

function scoreCitations(response: string, requiredSources: string[]): number {
  if (requiredSources.length === 0) return 20; // Edge cases — no citations required
  const citCount = (response.match(/\[Nguồn:/g) || []).length;
  if (citCount === 0) return 0;

  let sourceScore = 0;
  for (const src of requiredSources) {
    if (response.toLowerCase().includes(src.toLowerCase())) sourceScore += 10;
  }
  return Math.min(30, citCount * 5 + sourceScore);
}

function scoreFormat(response: string, expectedFormat: string): number {
  switch (expectedFormat) {
    case 'table':
      return response.includes('|---|') ? 20 : 5;
    case 'list':
      return /^\d+\.\s/m.test(response) || /^[-•]\s/m.test(response) ? 20 : 10;
    case 'structured':
      return /\*\*Trường hợp|\*\*Bước|Kết luận/m.test(response) ? 20 : 10;
    default:
      return 15;
  }
}

function scoreCompletionQuality(response: string): number {
  const trimmed = response.trimEnd();
  const isComplete = /[.!?。）\]）。]$/.test(trimmed);
  const noPlaeholder = !/(Điều chưa xác định|Điều không rõ)/i.test(response);
  return (isComplete ? 5 : 0) + (noPlaeholder ? 5 : 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subset, question_ids } = body; // Optional: run subset of questions

    const baseUrl = new URL(request.url).origin;
    const questionsToRun = question_ids
      ? BENCHMARK_QUESTIONS.filter(q => question_ids.includes(q.id))
      : subset
        ? BENCHMARK_QUESTIONS.slice(0, Number(subset))
        : BENCHMARK_QUESTIONS;

    console.log(`[benchmark] Running ${questionsToRun.length} questions`);

    const results = [];
    let totalScore = 0;

    for (const bq of questionsToRun) {
      const start = Date.now();
      try {
        // Call the actual chat API
        const res = await fetch(`${baseUrl}/api/knowledge/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: bq.question, top_k: 8 }),
        });
        const searchData = res.ok ? await res.json() : { context: '', chunks: [] };

        const chatRes = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: bq.question,
            knowledge_context: searchData.context || '',
            chunks: searchData.chunks || [],
          }),
        });
        const chatData = chatRes.ok ? await chatRes.json() : { summary: '' };
        const response = chatData.summary || '';
        const latency = Date.now() - start;

        // Score the response (out of 100)
        const s_completeness = scoreCompleteness(response, bq.question);
        const s_citations = scoreCitations(response, bq.required_sources);
        const s_format = scoreFormat(response, bq.expected_format);
        const s_quality = scoreCompletionQuality(response);
        const total = s_completeness + s_citations + s_format + s_quality;
        totalScore += total;

        results.push({
          id: bq.id,
          type: bq.type,
          question: bq.question.slice(0, 80) + '...',
          score: total,
          breakdown: { completeness: s_completeness, citations: s_citations, format: s_format, quality: s_quality },
          latency_ms: latency,
          response_length: response.length,
          question_type_detected: chatData.question_type || 'unknown',
          passed: total >= 60,
        });
      } catch (e) {
        results.push({
          id: bq.id, type: bq.type,
          question: bq.question.slice(0, 80),
          score: 0, breakdown: {}, latency_ms: Date.now() - start,
          error: String(e), passed: false,
        });
      }
    }

    const avgScore = questionsToRun.length > 0 ? Math.round(totalScore / questionsToRun.length) : 0;
    const passRate = Math.round(results.filter(r => r.passed).length / results.length * 100);

    // Score by type
    const byType: Record<string, { count: number; total: number }> = {};
    for (const r of results) {
      if (!byType[r.type]) byType[r.type] = { count: 0, total: 0 };
      byType[r.type].count++;
      byType[r.type].total += r.score;
    }
    const scoreByType = Object.fromEntries(
      Object.entries(byType).map(([t, v]) => [t, Math.round(v.total / v.count)])
    );

    return NextResponse.json({
      total_questions: questionsToRun.length,
      avg_score: avgScore,
      pass_rate: passRate,
      score_by_type: scoreByType,
      results: results.sort((a, b) => a.score - b.score), // worst first
      verdict: avgScore >= 75 ? '✅ PASS — Chất lượng đạt yêu cầu' : avgScore >= 60 ? '⚠️ MARGINAL — Cần cải thiện' : '❌ FAIL — Cần review ngay',
    });
  } catch (error) {
    console.error('[benchmark] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    total_questions: BENCHMARK_QUESTIONS.length,
    question_types: Array.from(new Set(BENCHMARK_QUESTIONS.map(q => q.type))),
    questions: BENCHMARK_QUESTIONS.map(q => ({ id: q.id, type: q.type, question: q.question })),
  });
}
