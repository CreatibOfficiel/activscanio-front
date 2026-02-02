'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Share2, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareAchievementButtonProps {
  achievementId: string;
  achievementName: string;
}

export default function ShareAchievementButton({
  achievementId,
  achievementName,
}: ShareAchievementButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { getToken } = useAuth();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const generateShareImage = async () => {
    setIsGenerating(true);
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiUrl}/share/achievement/${achievementId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate share image');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      return imageUrl;
    } catch (error) {
      toast.error('Failed to generate share image');
      console.error(error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const imageUrl = await generateShareImage();
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `achievement-${achievementName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();

    toast.success('Image downloaded!');
    URL.revokeObjectURL(imageUrl);
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const imageUrl = await generateShareImage();
    if (!imageUrl) return;

    // In a real implementation, you'd upload the image to a public URL
    // For now, we'll use a generic share message
    const shareText = `I just unlocked the "${achievementName}" achievement on ActivScanIO! 🎉`;
    const shareUrl = window.location.origin;

    let shareLink = '';
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
    URL.revokeObjectURL(imageUrl);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors"
        title="Share achievement"
      >
        <Share2 className="w-4 h-4 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-xl p-6 max-w-md w-full border border-neutral-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Share Achievement
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <p className="text-neutral-400 mb-6">
              Share your &ldquo;{achievementName}&rdquo; achievement with the world!
            </p>

            <div className="space-y-3">
              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                {isGenerating ? 'Generating...' : 'Download Image'}
              </button>

              {/* Social media buttons */}
              <button
                onClick={() => handleShare('twitter')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1DA1F2] hover:bg-[#1a8cd8] disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Share on Twitter
              </button>

              <button
                onClick={() => handleShare('facebook')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Share on Facebook
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0A66C2] hover:bg-[#095196] disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
