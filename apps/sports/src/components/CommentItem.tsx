import React from 'react';

interface Comment {
  id: number;
  content: string;
  likes: number;
  createdAt: string;
  user: { id: number; username?: string; fullName?: string; avatar?: string };
  replies?: Comment[];
}

export default function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <div className={depth > 0 ? 'ml-8 mt-2' : 'mt-3'}>
      <div className="flex gap-2">
        {comment.user.avatar
          ? <img src={comment.user.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          : <div className="w-7 h-7 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-300">
              {(comment.user.fullName || comment.user.username || 'U')[0].toUpperCase()}
            </div>}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-300">
            {comment.user.fullName || comment.user.username}
          </p>
          <p className="text-sm text-gray-100 mt-0.5">{comment.content}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
            {comment.likes > 0 && <span className="ml-2">❤️ {comment.likes}</span>}
          </p>
        </div>
      </div>
      {comment.replies?.map(r => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
    </div>
  );
}
