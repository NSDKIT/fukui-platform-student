import { parseSurveyMarkdown, convertParsedSurveyToQuestions } from './surveyParser';

// テスト用のMarkdownコンテンツ
const testMarkdown = `# オンラインショッピング利用調査テスト

## ネット通販の利用状況についてお聞きします

### オンラインショッピングの利用頻度は？
□ 週に複数回
□ 週に1回程度
□ 月に2-3回
□ 月に1回程度
□ ほとんど利用しない

#### よく購入するカテゴリーは？（複数選択可）
□ 衣類・ファッション
□ 家電製品
□ 書籍・雑誌
□ 食品・飲料
□ 日用品
□ 趣味・娯楽用品
□ その他

$$$1-3 オンラインショップ選択時の重要な要素を3つまで順位をつけてお答えください
□ 価格の安さ
□ 商品の品質
□ 配送の速さ
□ 返品・交換の容易さ
□ レビューの評価
□ ブランドの信頼性

##### オンラインショッピングで改善してほしい点があれば教えてください

### テスト用の単純なランキング質問
$$$1-3 好きな色を3つ選んでください
□ 赤
□ 青
□ 緑
□ 黄色
□ 紫`;

// テスト実行
console.log('=== RANKING QUESTION TEST ===');
console.log('Original markdown:');
console.log(testMarkdown);

try {
  const parsed = parseSurveyMarkdown(testMarkdown);
  console.log('\n=== PARSING RESULT ===');
  console.log('Title:', parsed.title);
  console.log('Description:', parsed.description);
  console.log('Sections:', parsed.sections.length);
  
  parsed.sections.forEach((section, index) => {
    console.log(`\n--- Section ${index + 1}: ${section.title} ---`);
    if (section.description) {
      console.log(`Description: ${section.description}`);
    }
    console.log(`Questions: ${section.questions.length}`);
    
    section.questions.forEach((question, qIndex) => {
      console.log(`\n  Q${qIndex + 1}: "${question.question_text}"`);
      console.log(`    Type: ${question.question_type}`);
      console.log(`    Required: ${question.required}`);
      if (question.options && question.options.length > 0) {
        console.log(`    Options (${question.options.length}): [${question.options.join(', ')}]`);
      }
      if (question.max_selections) {
        console.log(`    Max selections: ${question.max_selections}`);
      }
    });
  });
  
  const questions = convertParsedSurveyToQuestions(parsed);
  console.log('\n=== CONVERTED TO DATABASE FORMAT ===');
  questions.forEach((q, index) => {
    console.log(`\nQuestion ${index + 1}:`);
    console.log(`  Text: "${q.question_text}"`);
    console.log(`  Type: ${q.question_type}`);
    console.log(`  Multiple Select: ${q.is_multiple_select}`);
    console.log(`  Required: ${q.required}`);
    if (q.options && q.options.length > 0) {
      console.log(`  Options (${q.options.length}): [${q.options.join(', ')}]`);
    }
    if (q.max_selections) {
      console.log(`  Max selections: ${q.max_selections}`);
    }
    
    // ランキング質問の特別チェック
    if (q.question_type === 'ranking') {
      console.log(`  ✓ RANKING QUESTION DETECTED`);
      console.log(`  ✓ Will allow selecting exactly 3 options`);
      console.log(`  ✓ Multiple select: ${q.is_multiple_select ? 'YES' : 'NO'}`);
    }
  });
  
} catch (error) {
  console.error('❌ Error parsing markdown:', error);
}

export { testMarkdown };