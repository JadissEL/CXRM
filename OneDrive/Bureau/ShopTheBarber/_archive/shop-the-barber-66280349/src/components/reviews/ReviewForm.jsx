import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, Upload, X, CheckCircle, AlertCircle } from "lucide-react";

export default function ReviewForm({ targetType, targetId, onSuccess }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      const user = await base44.auth.me();
      return await base44.entities.Review.create({
        ...reviewData,
        client_id: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error) => {
      setError("Erreur lors de la publication de l'avis. Veuillez réessayer.");
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError("Maximum 5 images autorisées");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setImages([...images, ...uploadedUrls]);
    } catch (error) {
      setError("Erreur lors de l'upload des images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }

    if (!comment.trim()) {
      setError("Veuillez rédiger un commentaire");
      return;
    }

    const reviewData = {
      target_type: targetType,
      target_id: targetId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
      images: images.length > 0 ? images : undefined,
      status: "pending"
    };

    createReviewMutation.mutate(reviewData);
  };

  if (success) {
    return (
      <Card className="rounded-[12px] border-2 border-[#1E7A4B] bg-[#1E7A4B]/10">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-[#1E7A4B] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#0B2545] mb-2">
            Merci pour votre avis !
          </h3>
          <p className="text-[#4B5563]">
            Votre avis sera publié après modération
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[12px] border-2 border-slate-200">
      <CardHeader>
        <CardTitle className="text-[#0B2545]">Rédiger un Avis</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert className="bg-[#D6454A]/10 border-[#D6454A] rounded-[10px]">
              <AlertCircle className="h-4 w-4 text-[#D6454A]" />
              <AlertDescription className="text-[#D6454A]">{error}</AlertDescription>
            </Alert>
          )}

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="text-[#0B2545] font-semibold">Note *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all hover:scale-110 min-h-[44px] min-w-[44px]"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? "text-[#D08B3D] fill-current"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-lg font-semibold text-[#0B2545]">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-900">
              Titre de l'avis (optionnel)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Résumez votre expérience..."
              className="border-slate-300"
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-slate-900 font-semibold">
              Votre avis *
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience en détail..."
              className="border-slate-300 min-h-[150px]"
              maxLength={1000}
            />
            <p className="text-sm text-slate-500 text-right">
              {comment.length}/1000 caractères
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-[#0B2545]">Photos (optionnel)</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-[10px] p-6 text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading || images.length >= 5}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${uploading || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
                <p className="text-[#0B2545] font-medium mb-1">
                  {uploading ? "Upload en cours..." : "Cliquez pour ajouter des photos"}
                </p>
                <p className="text-sm text-[#4B5563]">
                  Maximum 5 images (JPG, PNG)
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-3 mt-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createReviewMutation.isPending || uploading}
            className="w-full bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white h-12 rounded-[10px]"
          >
            {createReviewMutation.isPending ? "Publication..." : "Publier l'Avis"}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Votre avis sera vérifié avant publication
          </p>
        </form>
      </CardContent>
    </Card>
  );
}