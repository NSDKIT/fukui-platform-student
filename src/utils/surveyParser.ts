export interface ParsedSurvey {
  title: string;
  description: string;
  sections: ParsedSection[];
}

export interface ParsedSection {
  title: string;
  description?: string;
  questions: ParsedQuestion[];
}

export interface ParsedQuestion {
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'rating' | 'yes_no' | 'checkbox' | 'ranking';
  options?: string[];
  required: boolean;
  is_long_text?: boolean;
  max_selections?: number;
}

export const parseSurveyMarkdown = (markdown: string): ParsedSurvey => {
  const lines = markdown.split('\n').map(line => line.trim()).filter(line => line);
  
  let title = '';
  let description = '';
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentQuestion: ParsedQuestion | null = null;
  let collectingOptions = false;
  
  console.log('=== PARSING DEBUG ===');
  console.log('Total lines:', lines.length);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Line ${i + 1}: "${line}"`);
    
    // タイトル（最初の# または明示的なタイトル）
    if (!title && line.startsWith('# ')) {
      title = line.substring(2).trim();
      console.log('Found title:', title);
      continue;
    }
    
    // セクション（ページ分け）
    if (line.startsWith('# ')) {
      console.log('Found section:', line);
      // 前の質問を保存
      if (currentQuestion && currentSection) {
        console.log('Saving previous question:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
        currentQuestion = null;
      }
      
      // 前のセクションを保存
      if (currentSection) {
        sections.push(currentSection);
      }
      
      currentSection = {
        title: line.substring(2).trim(),
        questions: []
      };
      collectingOptions = false;
      continue;
    }
    
    // セクション説明
    if (line.startsWith('## ') && currentSection) {
      console.log('Found section description:', line);
      // 前の質問を保存
      if (currentQuestion) {
        console.log('Saving previous question before section desc:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
        currentQuestion = null;
      }
      currentSection.description = line.substring(3).trim();
      collectingOptions = false;
      continue;
    }
    
    // 上位3位ランキング質問（$$$1-3で始まる）
    if (line.match(/^\$\$\$1-3\s+/)) {
      console.log('Found ranking question:', line);
      // 前の質問を保存
      if (currentQuestion && currentSection) {
        console.log('Saving previous question before ranking:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
      }
      
      // セクションがない場合は作成
      if (!currentSection) {
        currentSection = {
          title: 'メインセクション',
          questions: []
        };
      }
      
      const questionText = line.replace(/^\$\$\$1-3\s+/, '').trim();
      currentQuestion = {
        question_text: questionText,
        question_type: 'ranking',
        required: true,
        max_selections: 3
      };
      collectingOptions = true;
      console.log('Created ranking question:', currentQuestion);
      continue;
    }
    
    // 記述式質問（#####で始まる）
    if (line.startsWith('##### ')) {
      console.log('Found text question:', line);
      // 前の質問を保存
      if (currentQuestion && currentSection) {
        console.log('Saving previous question before text:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
      }
      
      // セクションがない場合は作成
      if (!currentSection) {
        currentSection = {
          title: 'メインセクション',
          questions: []
        };
      }
      
      const questionText = line.substring(6).trim();
      currentQuestion = {
        question_text: questionText,
        question_type: 'text',
        required: true
      };
      collectingOptions = false;
      console.log('Created text question:', currentQuestion);
      continue;
    }
    
    // 複数選択質問（####で始まる）
    if (line.startsWith('#### ')) {
      console.log('Found checkbox question:', line);
      // 前の質問を保存
      if (currentQuestion && currentSection) {
        console.log('Saving previous question before checkbox:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
      }
      
      // セクションがない場合は作成
      if (!currentSection) {
        currentSection = {
          title: 'メインセクション',
          questions: []
        };
      }
      
      const questionText = line.substring(5).trim();
      currentQuestion = {
        question_text: questionText,
        question_type: 'checkbox',
        required: true
      };
      collectingOptions = true;
      console.log('Created checkbox question:', currentQuestion);
      continue;
    }
    
    // 単数選択質問（###で始まる、ただし###1-3ではない）
    if (line.startsWith('### ') && !line.match(/^\$\$\$1-3\s+/)) {
      console.log('Found multiple choice question:', line);
      // 前の質問を保存
      if (currentQuestion && currentSection) {
        console.log('Saving previous question before multiple choice:', currentQuestion.question_text);
        currentSection.questions.push(currentQuestion);
      }
      
      // セクションがない場合は作成
      if (!currentSection) {
        currentSection = {
          title: 'メインセクション',
          questions: []
        };
      }
      
      const questionText = line.substring(4).trim();
      currentQuestion = {
        question_text: questionText,
        question_type: 'multiple_choice',
        required: true
      };
      collectingOptions = true;
      console.log('Created multiple choice question:', currentQuestion);
      continue;
    }
    
    // 選択肢
    if (line.startsWith('□ ') && currentQuestion && collectingOptions) {
      console.log('Found option:', line);
      const option = line.substring(2).trim();
      if (!currentQuestion.options) {
        currentQuestion.options = [];
      }
      currentQuestion.options.push(option);
      console.log('Added option to question:', option);
      continue;
    }
    
    // その他オプション
    if (line.includes('その他') && currentQuestion && collectingOptions) {
      console.log('Found "その他" option:', line);
      if (!currentQuestion.options) {
        currentQuestion.options = [];
      }
      currentQuestion.options.push('その他');
      continue;
    }
    
    // 説明文（質問でもセクションでもない場合）
    if (!description && !currentSection && !line.startsWith('#') && !line.startsWith('□')) {
      description = line;
      console.log('Found description:', description);
    }
  }
  
  // 最後の質問とセクションを保存
  if (currentQuestion && currentSection) {
    console.log('Saving final question:', currentQuestion.question_text);
    currentSection.questions.push(currentQuestion);
  }
  if (currentSection) {
    console.log('Saving final section:', currentSection.title);
    sections.push(currentSection);
  }
  
  // セクションがない場合は、デフォルトセクションを作成
  if (sections.length === 0 && currentQuestion) {
    sections.push({
      title: 'メインセクション',
      questions: [currentQuestion]
    });
  }
  
  console.log('=== PARSING RESULT ===');
  console.log('Title:', title);
  console.log('Sections:', sections.length);
  sections.forEach((section, index) => {
    console.log(`Section ${index + 1}: ${section.title} (${section.questions.length} questions)`);
    section.questions.forEach((q, qIndex) => {
      console.log(`  Q${qIndex + 1}: ${q.question_text} (${q.question_type})`);
    });
  });
  
  return {
    title: title || 'インポートされたアンケート',
    description: description || 'ファイルからインポートされたアンケートです',
    sections
  };
};

export const convertParsedSurveyToQuestions = (parsedSurvey: ParsedSurvey): any[] => {
  const questions: any[] = [];
  let orderIndex = 0;
  
  parsedSurvey.sections.forEach((section, sectionIndex) => {
    // セクションヘッダーは質問として追加しない
    // セクション情報は各質問のメタデータとして保持
    
    section.questions.forEach(question => {
      questions.push({
        question_text: question.question_text,
        question_type: question.question_type === 'checkbox' ? 'multiple_choice' : 
                      question.question_type === 'ranking' ? 'multiple_choice' : question.question_type,
        options: question.options || [],
        required: question.required,
        order_index: orderIndex++,
        is_long_text: question.is_long_text,
        is_multiple_select: question.question_type === 'checkbox' || question.question_type === 'ranking',
        max_selections: question.max_selections || (question.question_type === 'ranking' ? 3 : undefined),
        section_title: section.title,
        section_description: section.description
      });
    });
  });
  
  console.log('=== CONVERTED QUESTIONS ===');
  questions.forEach((q, index) => {
    console.log(`Question ${index + 1}: ${q.question_text} (${q.question_type})`);
    if (q.max_selections === 3 && q.is_multiple_select) {
      console.log(`  ✓ RANKING QUESTION: max_selections=${q.max_selections}, is_multiple_select=${q.is_multiple_select}`);
    }
  });
  
  return questions;
};