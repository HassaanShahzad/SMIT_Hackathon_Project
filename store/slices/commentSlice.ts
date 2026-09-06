import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Comment } from '@/types/comment';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { getData, setData, INITIAL_COMMENTS } from '@/lib/storage';

interface CommentState {
  comments: Comment[];
}

const initialState: CommentState = {
  comments: INITIAL_COMMENTS,
};

export const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    hydrateComments: (state) => {
      state.comments = getData<Comment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
    },
    addComment: (
      state,
      action: PayloadAction<{
        taskId: string;
        authorId: string;
        content: string;
        mentions: string[];
        parentId?: string;
      }>
    ) => {
      const newComment: Comment = {
        id: `comm_${Date.now()}`,
        taskId: action.payload.taskId,
        authorId: action.payload.authorId,
        content: action.payload.content,
        mentions: action.payload.mentions || [],
        parentId: action.payload.parentId,
        createdAt: new Date().toISOString(),
      };
      state.comments.push(newComment);
      setData(STORAGE_KEYS.COMMENTS, state.comments);
    },
    editComment: (
      state,
      action: PayloadAction<{ id: string; content: string; mentions: string[] }>
    ) => {
      const comment = state.comments.find((c) => c.id === action.payload.id);
      if (comment) {
        comment.content = action.payload.content;
        comment.mentions = action.payload.mentions;
        comment.updatedAt = new Date().toISOString();
        setData(STORAGE_KEYS.COMMENTS, state.comments);
      }
    },
    deleteComment: (state, action: PayloadAction<string>) => {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
      setData(STORAGE_KEYS.COMMENTS, state.comments);
    },
  },
});

export const { hydrateComments, addComment, editComment, deleteComment } = commentSlice.actions;

export default commentSlice.reducer;
