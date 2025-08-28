import React, { useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { parseSurveyMarkdown, convertParsedSurveyToQuestions } from '../utils/surveyParser';

interface ImportSurveyModalProps {
  onClose: () => void;
  onImport: (data: Record<string, unknown>) => void;
}

export const ImportSurveyModal: React.FC<ImportSurveyModalProps> = ({ onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError('Markdownファイル（.md）またはテキストファイル（.txt）を選択してください。');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      setError(null);
      
      try {
        const parsed = parseSurveyMarkdown(content);
        const questions = convertParsedSurveyToQuestions(parsed);
        setPreview({
          title: parsed.title,
          description: parsed.description,
          questions: questions,
          sectionsCount: parsed.sections.length,
          questionsCount: questions.filter(q => q.question_type !== 'section_header').length
        });
      } catch {
        setError('ファイルの解析に失敗しました。形式を確認してください。');
        setPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleTextInput = (content: string) => {
    setFileContent(content);
    setFileName('手動入力');
    setError(null);
    
    try {
      const parsed = parseSurveyMarkdown(content);
      const questions = convertParsedSurveyToQuestions(parsed);
      setPreview({
        title: parsed.title,
        description: parsed.description,
        questions: questions,
        sectionsCount: parsed.sections.length,
        questionsCount: questions.filter(q => q.question_type !== 'section_header').length
      });
    } catch {
      setError('テキストの解析に失敗しました。形式を確認してください。');
      setPreview(null);
    }
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">アンケートをインポート</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Import */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">ファイルをインポート</h3>
              
              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Markdownファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-gray-500 mb-4">または</p>
                <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                  ファイルを選択
                  <input
                    type="file"
                    accept=".md,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>

              {fileName && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800">{fileName}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">または直接入力</h3>
              <textarea
                value={fileContent}
                onChange={(e) => handleTextInput(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Markdown形式でアンケート内容を入力してください..."
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Preview */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">プレビュー</h3>
              
              {preview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{preview.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{preview.description}</p>
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>セクション: {preview.sectionsCount}</span>
                      <span>質問数: {preview.questionsCount}</span>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {preview.questions.map((question: any, index: number) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg">
                        {question.question_type === 'section_header' ? (
                          <div className="text-center">
                            <h5 className="font-medium text-blue-600">{question.section_title}</h5>
                            {question.section_description && (
                              <p className="text-sm text-gray-600 mt-1">{question.section_description}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium text-gray-900">{question.question_text}</h5>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {question.question_type === 'text' ? (question.is_long_text ? '長文' : '短文') :
                                 question.question_type === 'multiple_choice' ? (question.is_multiple_select ? '複数選択' : '単数選択') :
                                 question.question_type === 'rating' ? '評価' :
                                 question.question_type === 'yes_no' ? 'はい/いいえ' : question.question_type}
                              </span>
                            </div>
                            {question.options && question.options.length > 0 && (
                              <div className="text-sm text-gray-600">
                                選択肢: {question.options.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>ファイルを選択またはテキストを入力すると、プレビューが表示されます</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Format Guide */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📝 記法ガイド</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><code># セクション名</code> → ページ分け（セクション）</p>
            <p><code>## セクション説明</code> → セクションの説明文</p>
            <p><code>### 質問文</code> → 単数選択（ラジオボタン）</p>
            <p><code>#### 質問文</code> → 複数選択（チェックボックス）</p>
            <p><code>$$$1-3 質問文</code> → 上位3位ランキング</p>
            <p><code>##### 質問文</code> → 記述式</p>
            <p><code>□ 選択肢</code> → 各選択肢</p>
            <p><code>その他( )</code> → 「その他」オプション付き</p>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleImport}
            disabled={!preview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            インポート
          </button>
        </div>
      </div>
    </div>
  );
};