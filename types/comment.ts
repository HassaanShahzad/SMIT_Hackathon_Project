export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  mentions: string[]; // user IDs mentioned
  parentId?: string; // for threaded replies
  createdAt: string;
  updatedAt?: string;
}

export interface CommentFormValues {
  content: string;
}
