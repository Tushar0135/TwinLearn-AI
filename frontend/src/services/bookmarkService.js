// Bookmark service
const BOOKMARKS_KEY = 'twinalai_bookmarks';

export const bookmarkService = {
  getBookmarks: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        resolve({ success: true, data: bookmarks });
      }, 300);
    });
  },

  addBookmark: async (lectureId, type, content) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        
        const bookmark = {
          id: `bookmark-${Date.now()}`,
          lectureId,
          type, // 'explanation', 'question', 'section'
          content,
          createdAt: new Date().toISOString(),
        };

        bookmarks.push(bookmark);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        
        resolve({ success: true, data: bookmark });
      }, 300);
    });
  },

  removeBookmark: async (bookmarkId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        bookmarks = bookmarks.filter(b => b.id !== bookmarkId);
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
        
        resolve({ success: true, message: 'Bookmark removed' });
      }, 300);
    });
  },

  getBookmarksByLecture: async (lectureId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]');
        const filtered = bookmarks.filter(b => b.lectureId === lectureId);
        resolve({ success: true, data: filtered });
      }, 300);
    });
  },
};
