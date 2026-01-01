import React, { useRef, useState } from 'react';
import { Upload, FileText, Lock, RefreshCw } from 'lucide-react';
import { DEMO_CHAT_CONTENT } from '../constants';

interface FileUploadProps {
  onFileLoaded: (content: string, isAnonymized: boolean, forceRefresh: boolean) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onFileLoaded(text, isAnonymized, forceRefresh);
      };
      reader.readAsText(file);
    }
  };

  const loadDemo = () => {
    onFileLoaded(DEMO_CHAT_CONTENT, isAnonymized, forceRefresh);
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
      <div 
        className="w-full border-2 border-dashed border-gray-600 hover:border-festive-primary rounded-2xl p-12 transition-all cursor-pointer bg-slate-800/50 hover:bg-slate-800"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="bg-festive-primary/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Upload className="w-10 h-10 text-festive-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Drop your WhatsApp Chat</h2>
        <p className="text-gray-400 mb-6">Upload your exported .txt file to analyze</p>
        <input 
          type="file" 
          accept=".txt" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button className="bg-festive-primary text-slate-900 font-bold py-2 px-6 rounded-full hover:bg-amber-400 transition-colors">
          Select File
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 items-start sm:items-center">
        <div className="flex items-center space-x-2 text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => setIsAnonymized(!isAnonymized)}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAnonymized ? 'bg-festive-accent border-transparent' : 'border-gray-500'}`}>
            {isAnonymized && <div className="w-3 h-3 bg-white rounded-sm" />}
          </div>
          <span className="text-sm select-none">Anonymize Names (Privacy Mode)</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => setForceRefresh(!forceRefresh)}>
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${forceRefresh ? 'bg-festive-secondary border-transparent' : 'border-gray-500'}`}>
            {forceRefresh && <RefreshCw className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm select-none">Force Re-analysis (Ignore Cache)</span>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={loadDemo} className="text-sm text-gray-500 hover:text-white underline flex items-center justify-center gap-1">
          <FileText className="w-4 h-4" /> Try with Demo Data
        </button>
      </div>

      <div className="mt-12 text-xs text-gray-600 flex items-center gap-1">
        <Lock className="w-3 h-3" />
        <span>Your data is processed locally and via secure API. We don't store your chats.</span>
      </div>
    </div>
  );
};

export default FileUpload;