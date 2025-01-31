import React, { useState } from 'react';
import { X, Plus, Copy, Check, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BookmarkPanel = ({ isOpen, onToggle }) => {
  const queryClient = useQueryClient();
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '' });
  const [copyStatus, setCopyStatus] = useState({});

  // Fetch bookmarks
  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/bookmarks`);
      return data;
    }
  });

  // Add bookmark mutation
  const addBookmarkMutation = useMutation({
    mutationFn: (newBookmark) => axios.post(`${API_URL}/bookmarks`, newBookmark),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookmarks']);
      setNewBookmark({ title: '', url: '' });
    }
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId) => axios.delete(`${API_URL}/bookmarks/${bookmarkId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookmarks']);
    }
  });

  const handleAddBookmark = (e) => {
    e.preventDefault();
    if (!newBookmark.title.trim() || !newBookmark.url.trim()) return;

    // Add http:// if no protocol is specified
    let url = newBookmark.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    addBookmarkMutation.mutate({
      title: newBookmark.title.trim(),
      url: url
    });
  };

  const deleteBookmark = (bookmarkId) => {
    deleteBookmarkMutation.mutate(bookmarkId);
  };

  const copyToClipboard = async (bookmarkId, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus({ [bookmarkId]: true });
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [bookmarkId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`side-panel side-panel-left ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="text-lg font-semibold">Bookmarks</h2>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="panel-content">
        <form onSubmit={handleAddBookmark} className="add-bookmark-form">
          <input
            type="text"
            placeholder="Title"
            value={newBookmark.title}
            onChange={(e) => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
            className="add-bookmark-input"
          />
          <input
            type="text"
            placeholder="URL"
            value={newBookmark.url}
            onChange={(e) => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
            className="add-bookmark-input"
          />
          <button
            type="submit"
            className="btn-primary flex items-center w-full justify-center"
            disabled={!newBookmark.title.trim() || !newBookmark.url.trim() || addBookmarkMutation.isLoading}
          >
            <Plus size={20} className="mr-1" />
            Add Bookmark
          </button>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="panel-empty-state">
              <p className="text-gray-500">No bookmarks yet</p>
            </div>
          ) : (
            bookmarks.map(bookmark => (
              <div key={bookmark._id} className="bookmark-item">
                <div className="bookmark-content">
                  <p className="bookmark-title">{bookmark.title}</p>
                  <p className="bookmark-url">{bookmark.url}</p>
                </div>
                <div className="bookmark-actions">
                  <button
                    onClick={() => copyToClipboard(bookmark._id, bookmark.url)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Copy URL"
                  >
                    {copyStatus[bookmark._id] ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-gray-500" />
                    )}
                  </button>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Open URL"
                  >
                    <ExternalLink size={16} className="text-gray-500" />
                  </a>
                  <button
                    onClick={() => deleteBookmark(bookmark._id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                    title="Delete"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarkPanel;