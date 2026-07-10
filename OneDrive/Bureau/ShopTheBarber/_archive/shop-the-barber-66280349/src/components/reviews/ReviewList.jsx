import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

export default function ReviewList({ targetType, targetId }) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', targetType, targetId, sortBy],
    queryFn: async () => {
      const sortField = sortBy === 'recent' ? '-created_date' : 
                       sortBy === 'helpful' ? '-helpful_count' : 
                       '-rating';
      return await base44.entities.Review.filter({ 
        target_type: targetType, 
        target_id: targetId,
        status: 'approved'
      }, sortField);
    }
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['review-votes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ReviewVote.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const voteReviewMutation = useMutation({
    mutationFn: async ({ reviewId, voteType }) => {
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Check if already voted
      const existingVote = votes.find(v => v.review_id === reviewId);
      
      if (existingVote) {
        // If same vote, remove it
        if (existingVote.vote_type === voteType) {
          await base44.entities.ReviewVote.delete(existingVote.id);
          
          // Update review count
          const review = reviews.find(r => r.id === reviewId);
          if (review) {
            const field = voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count';
            await base44.entities.Review.update(reviewId, {
              [field]: Math.max(0, review[field] - 1)
            });
          }
        } else {
          // Change vote
          await base44.entities.ReviewVote.update(existingVote.id, { vote_type: voteType });
          
          // Update both counts
          const review = reviews.find(r => r.id === reviewId);
          if (review) {
            if (voteType === 'helpful') {
              await base44.entities.Review.update(reviewId, {
                helpful_count: review.helpful_count + 1,
                not_helpful_count: Math.max(0, review.not_helpful_count - 1)
              });
            } else {
              await base44.entities.Review.update(reviewId, {
                helpful_count: Math.max(0, review.helpful_count - 1),
                not_helpful_count: review.not_helpful_count + 1
              });
            }
          }
        }
      } else {
        // Create new vote
        await base44.entities.ReviewVote.create({
          user_id: user.id,
          review_id: reviewId,
          vote_type: voteType
        });
        
        // Update review count
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          const field = voteType === 'helpful' ? 'helpful_count' : 'not_helpful_count';
          await base44.entities.Review.update(reviewId, {
            [field]: review[field] + 1
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-votes'] });
    }
  });

  const filteredReviews = reviews.filter(review => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  });

  const getUserVote = (reviewId) => {
    return votes.find(v => v.review_id === reviewId);
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? ((reviews.filter(r => r.rating === rating).length / reviews.length) * 100).toFixed(0)
      : 0
  }));

  if (isLoading) {
    return <div className="text-center py-8 text-slate-600">Chargement des avis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="rounded-[12px] border-2 border-slate-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-6xl font-bold text-[#0B2545] mb-2">{averageRating}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(averageRating)
                        ? "text-yellow-400 fill-current"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-slate-600">
                Basé sur {reviews.length} {reviews.length > 1 ? 'avis' : 'avis'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#0B2545] w-8">{rating} ⭐</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D08B3D] transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-[#4B5563] w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 border-slate-300">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus Récents</SelectItem>
            <SelectItem value="helpful">Plus Utiles</SelectItem>
            <SelectItem value="rating">Mieux Notés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-48 border-slate-300">
            <SelectValue placeholder="Filtrer par note" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les notes</SelectItem>
            <SelectItem value="5">5 étoiles</SelectItem>
            <SelectItem value="4">4 étoiles</SelectItem>
            <SelectItem value="3">3 étoiles</SelectItem>
            <SelectItem value="2">2 étoiles</SelectItem>
            <SelectItem value="1">1 étoile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="rounded-[12px] border-2 border-slate-200 p-8 text-center">
            <p className="text-[#4B5563]">Aucun avis pour le moment</p>
          </Card>
        ) : (
          filteredReviews.map((review, index) => {
            const userVote = getUserVote(review.id);
            
            return (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="rounded-[12px] border-2 border-slate-200 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 ring-2 ring-slate-200 rounded-[12px]">
                          <AvatarFallback className="bg-[#0B2545] text-white font-bold rounded-[12px]">
                            {review.client_id[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-[#0B2545]">Client Vérifié</p>
                          <p className="text-sm text-[#4B5563]">
                            {format(new Date(review.created_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {review.verified_purchase && (
                        <Badge className="bg-[#1E7A4B]/20 text-[#1E7A4B] border-0">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Achat Vérifié
                        </Badge>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? "text-[#D08B3D] fill-current"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <span className="font-semibold text-[#0B2545]">{review.title}</span>
                      )}
                    </div>

                    {/* Comment */}
                    <p className="text-[#4B5563] mb-4 leading-relaxed">{review.comment}</p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                        {review.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Review image ${i + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:scale-105 transition-transform"
                          />
                        ))}
                      </div>
                    )}

                    {/* Vendor Response */}
                    {review.vendor_response && (
                      <div className="mt-4 p-4 bg-[#0B2545]/5 border-l-4 border-[#0B2545] rounded-[8px]">
                        <p className="text-sm font-semibold text-[#0B2545] mb-2">
                          Réponse du Vendeur
                        </p>
                        <p className="text-sm text-[#4B5563]">{review.vendor_response}</p>
                        {review.vendor_response_date && (
                          <p className="text-xs text-[#4B5563] mt-2">
                            {format(new Date(review.vendor_response_date), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Helpful Buttons */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                      <span className="text-sm text-[#4B5563]">Cet avis vous a-t-il été utile ?</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => voteReviewMutation.mutate({ reviewId: review.id, voteType: 'helpful' })}
                          className={`rounded-[8px] min-h-[44px] ${userVote?.vote_type === 'helpful' ? 'bg-[#1E7A4B]/10 text-[#1E7A4B] border-[#1E7A4B]' : 'border-slate-300 text-[#4B5563]'}`}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Oui ({review.helpful_count || 0})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => voteReviewMutation.mutate({ reviewId: review.id, voteType: 'not_helpful' })}
                          className={`rounded-[8px] min-h-[44px] ${userVote?.vote_type === 'not_helpful' ? 'bg-[#D6454A]/10 text-[#D6454A] border-[#D6454A]' : 'border-slate-300 text-[#4B5563]'}`}
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Non ({review.not_helpful_count || 0})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}