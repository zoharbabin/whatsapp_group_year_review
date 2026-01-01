import React from 'react';

interface WordCloudProps {
  words?: { text: string; value: number }[];
}

const WordCloud: React.FC<WordCloudProps> = ({ words = [] }) => {
  if (!words || words.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No words found</div>;
  }

  // Normalize sizes
  const maxVal = Math.max(...words.map(w => w.value));
  const minVal = Math.min(...words.map(w => w.value));
  
  const getSize = (val: number) => {
    if (maxVal === minVal) return 1.5;
    const minSize = 0.8;
    const maxSize = 2.5;
    return minSize + ((val - minVal) / (maxVal - minVal)) * (maxSize - minSize);
  };

  const colors = [
    'text-festive-primary',
    'text-festive-secondary',
    'text-festive-accent',
    'text-blue-400',
    'text-purple-400',
    'text-pink-400'
  ];

  return (
    <div className="flex flex-wrap justify-center content-center gap-x-4 gap-y-2 h-64 overflow-hidden">
      {words.map((word, idx) => (
        <span
          key={idx}
          className={`${colors[idx % colors.length]} font-bold transition-all hover:scale-110 cursor-default`}
          style={{ fontSize: `${getSize(word.value)}rem`, opacity: 0.8 + (word.value/maxVal)*0.2 }}
          title={`${word.text}: ${word.value}`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
};

export default WordCloud;