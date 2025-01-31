import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

const BookmarkButton = ({ isBookmarked, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded-full hover:bg-gray-100 ${
        isBookmarked ? 'text-blue-600' : 'text-gray-400'
      }`}
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-5 w-5" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </button>
  );
};

export default BookmarkButton;