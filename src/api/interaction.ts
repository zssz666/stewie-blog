/**
 * 互动模块 API（阶段 5：点赞 / 评论）
 * 对应后端 PublicInteractionController / AdminCommentController
 */
import { request } from './request'
import type { Comment, CommentRequest, LikeStatus } from '@/types/blog'

/** 当前访客对某文章的点赞状态 */
export function getLikeStatus(postId: number): Promise<LikeStatus> {
  return request<LikeStatus>(`/posts/${postId}/like`)
}

/** 点赞（幂等：同一指纹重复点赞不会重复 +1） */
export function likePost(postId: number): Promise<LikeStatus> {
  return request<LikeStatus>(`/posts/${postId}/like`, { method: 'POST' })
}

/** 某文章已通过评论（树形） */
export function getComments(postId: number): Promise<Comment[]> {
  return request<Comment[]>(`/posts/${postId}/comments`)
}

/** 提交评论（默认待审核） */
export function createComment(
  postId: number,
  payload: CommentRequest,
): Promise<{ id: number }> {
  return request<{ id: number }>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
