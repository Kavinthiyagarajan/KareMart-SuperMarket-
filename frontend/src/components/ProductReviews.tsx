'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/authStore';
import Link from 'next/link';

export function ProductReviews({ productId }: { productId: number }) {
  const queryClient = useQueryClient();
  const { username, token } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => api.getReviews(productId),
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['reviews-summary', productId],
    queryFn: () => api.getReviewSummary(productId),
  });

  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery({
    queryKey: ['reviews-eligibility', productId, username],
    queryFn: () => api.checkReviewEligibility(productId),
    enabled: !!token, // only check if logged in
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      if (isEditing && editingReviewId) {
        return api.updateReview(productId, editingReviewId, rating, comment);
      } else {
        return api.submitReview(productId, rating, comment);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews-summary', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews-eligibility', productId, username] });
      setComment('');
      setRating(5);
      setIsEditing(false);
      setEditingReviewId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => api.deleteReview(productId, reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews-summary', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews-eligibility', productId, username] });
      setComment('');
      setRating(5);
      setIsEditing(false);
      setEditingReviewId(null);
    }
  });

  const handleEdit = (reviewId: number, currentRating: number, currentComment: string) => {
    setIsEditing(true);
    setEditingReviewId(reviewId);
    setRating(currentRating);
    setComment(currentComment);
    // scroll to form
    const formEl = document.getElementById('review-form');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingReviewId(null);
    setRating(5);
    setComment('');
  };

  if (isLoadingReviews || isLoadingSummary) return <div className="py-8 animate-pulse text-slate-500">Loading reviews...</div>;

  const avg = summary?.averageRating || 0;
  const count = summary?.totalReviews || 0;

  return (
    <div className="mt-16 border-t border-border pt-12">
      <h2 className="text-2xl font-bold text-foreground mb-8">Customer Reviews</h2>
      
      <div className="flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/3">
          <div className="bg-surface border border-border p-6 rounded-2xl sticky top-24">
            <div className="text-5xl font-black text-foreground mb-2">{Number(avg).toFixed(1)}</div>
            <div className="flex text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className={`w-6 h-6 ${star <= Math.round(Number(avg)) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-slate-500 mb-6">Based on {count} reviews</div>
            
            {!token ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-600 mb-3">Sign in to leave a review</p>
                <Link href="/login" className="inline-block bg-white border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Sign In
                </Link>
              </div>
            ) : isLoadingEligibility ? (
              <div className="text-sm text-slate-500">Checking eligibility...</div>
            ) : eligibility?.eligible ? (
              (!eligibility.hasReviewed || isEditing) ? (
                <form id="review-form" onSubmit={(e) => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Rating</label>
                    <select 
                      value={rating} 
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                    >
                      <option value={5}>5 Stars - Excellent</option>
                      <option value={4}>4 Stars - Good</option>
                      <option value={3}>3 Stars - Average</option>
                      <option value={2}>2 Stars - Poor</option>
                      <option value={1}>1 Star - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Review</label>
                    <textarea 
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white resize-none"
                      placeholder="What did you think?"
                    ></textarea>
                  </div>
                  {submitMutation.isError && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {submitMutation.error instanceof Error ? submitMutation.error.message : 'Error submitting review'}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      disabled={submitMutation.isPending}
                      className="flex-1 bg-primary text-primary-foreground font-medium py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      {submitMutation.isPending ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="flex-1 bg-slate-100 text-slate-700 font-medium py-2 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <p className="text-sm text-emerald-700 font-medium mb-1">You've reviewed this product!</p>
                  <p className="text-xs text-emerald-600">Scroll down to see your review.</p>
                </div>
              )
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-600 mb-1">Verified Purchase Required</p>
                <p className="text-xs text-slate-500">You must purchase this product before leaving a review.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          {reviews.length === 0 ? (
            <div className="text-slate-500 py-8 bg-slate-50 text-center rounded-2xl border border-slate-100">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            reviews.map((review) => {
              const isOwner = username === review.username;
              return (
                <div key={review.id} className="border border-border p-6 rounded-2xl bg-surface">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase">
                        {review.username.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          {review.username}
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Verified
                          </span>
                        </div>
                        <div className="text-xs text-slate-400" suppressHydrationWarning>
                          {new Date(review.createdAt).toLocaleDateString()}
                          {review.updatedAt && review.updatedAt !== review.createdAt && ' (Edited)'}
                        </div>
                      </div>
                    </div>
                    {isOwner && !isEditing && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(review.id, review.rating, review.comment)}
                          className="text-sm text-slate-500 hover:text-primary transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Are you sure you want to delete your review?')) {
                              deleteMutation.mutate(review.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-slate-500 hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex text-amber-400 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= review.rating ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
