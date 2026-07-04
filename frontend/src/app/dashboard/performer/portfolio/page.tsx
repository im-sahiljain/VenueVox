'use client';

import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store/store';
import {
  updatePortfolioThunk,
  deletePerformerPhotoThunk,
  setPrimaryPerformerPhotoThunk,
  setErrorMsg,
} from '@/lib/store/performerSlice';
import { Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PerformerPortfolio() {
  const dispatch = useAppDispatch();
  const { performer, isUploading } = useAppSelector((state) => state.performer);

  const [pendingProfileFile, setPendingProfileFile] = useState<File | null>(null);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);

  // Form State
  const [portfolioData, setPortfolioData] = useState({
    name: '',
    biography: '',
    genres: '',
    pricing: 100,
    languages: 'English',
    experience: '',
    travelRadius: 25,
    equipmentNeeded: '',
    imageUrl: '',
    state: 'Punjab',
    city: 'Chandigarh',
    photos: [] as string[],
  });

  // Sync form inputs with Redux profile data
  useEffect(() => {
    if (performer) {
      setPortfolioData({
        name: performer.name || '',
        biography: performer.biography || '',
        genres: Array.isArray(performer.genres) ? performer.genres.join(', ') : performer.genres || '',
        pricing: performer.pricing || 100,
        languages: Array.isArray(performer.languages)
          ? performer.languages.join(', ')
          : performer.languages || 'English',
        experience: performer.experience || '',
        travelRadius: performer.travelRadius || 25,
        equipmentNeeded: Array.isArray(performer.equipmentNeeded)
          ? performer.equipmentNeeded.join(', ')
          : performer.equipmentNeeded || '',
        imageUrl: performer.imageUrl || '',
        state: performer.state || 'Punjab',
        city: performer.city || 'Chandigarh',
        photos: performer.photos || [],
      });
    }
  }, [performer]);

  const handleUpdatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!performer) return;

    const data = {
      performerId: performer.id,
      name: portfolioData.name,
      biography: portfolioData.biography,
      genres: portfolioData.genres.split(',').map((x) => x.trim()).filter(Boolean),
      pricing: Number(portfolioData.pricing),
      languages: portfolioData.languages.split(',').map((x) => x.trim()).filter(Boolean),
      experience: portfolioData.experience,
      travelRadius: Number(portfolioData.travelRadius),
      equipmentNeeded: portfolioData.equipmentNeeded.split(',').map((x) => x.trim()).filter(Boolean),
      imageUrl: portfolioData.imageUrl,
      photos: portfolioData.photos,
      state: portfolioData.state,
      city: portfolioData.city,
      pendingProfileFile,
      pendingGalleryFiles,
    };

    dispatch(updatePortfolioThunk(data)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setPendingProfileFile(null);
        setPendingGalleryFiles([]);
      }
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Max size is 1MB.`);
        continue;
      }
      newFiles.push(file);
    }
    setPendingGalleryFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleDeletePhoto = (photoUrl: string) => {
    if (!performer) return;
    if (
      !confirm(
        'Are you sure you want to delete this photo permanently? This will also remove it from Cloudinary.'
      )
    )
      return;

    dispatch(
      deletePerformerPhotoThunk({
        performerId: performer.id,
        photoUrl,
        currentPhotos: portfolioData.photos,
        currentImageUrl: portfolioData.imageUrl,
      })
    );
  };

  const handleSetPrimaryPhoto = (photoUrl: string) => {
    if (!performer) return;
    dispatch(
      setPrimaryPerformerPhotoThunk({
        performerId: performer.id,
        photoUrl,
      })
    );
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Edit Portfolio</h1>
        <p className="text-slate-500 mt-1 dark:text-slate-400">
          Make your professional profile stand out to premium venue coordinators.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <form onSubmit={handleUpdatePortfolio} className="space-y-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Artist Name *</label>
              <input
                type="text"
                required
                value={portfolioData.name}
                onChange={(e) => setPortfolioData({ ...portfolioData, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-850 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Standard Gig rate (₹) *</label>
              <input
                type="number"
                required
                value={portfolioData.pricing}
                onChange={(e) => setPortfolioData({ ...portfolioData, pricing: Number(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1 flex items-center justify-between">
                <span>Profile Photo</span>
                {pendingProfileFile && (
                  <span className="text-[10px] text-rose-500 font-bold animate-pulse">
                    Pending Upload
                  </span>
                )}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-750">
                    <img
                      src={
                        pendingProfileFile
                          ? URL.createObjectURL(pendingProfileFile)
                          : portfolioData.imageUrl || '/avatar-placeholder.png'
                      }
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 transition">
                      <span>{pendingProfileFile ? 'Change Image' : 'Upload Image'}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                           if (file) {
                             if (file.size > 1024 * 1024) {
                               toast.error('Profile image size exceeds the 1MB limit.');
                               return;
                             }
                             setPendingProfileFile(file);
                           }
                        }}
                      />
                    </label>
                  </div>
                  {pendingProfileFile && (
                    <button
                      type="button"
                      onClick={() => setPendingProfileFile(null)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={
                    pendingProfileFile
                      ? `[Queued for upload: ${pendingProfileFile.name}]`
                      : portfolioData.imageUrl
                  }
                  disabled={!!pendingProfileFile}
                  onChange={(e) => setPortfolioData({ ...portfolioData, imageUrl: e.target.value })}
                  placeholder="Or paste an image URL here..."
                  className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-800 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Travel Radius (miles) *</label>
              <input
                type="number"
                required
                value={portfolioData.travelRadius}
                onChange={(e) =>
                  setPortfolioData({ ...portfolioData, travelRadius: Number(e.target.value) })
                }
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Biography / About</label>
            <textarea
              rows={4}
              value={portfolioData.biography}
              onChange={(e) => setPortfolioData({ ...portfolioData, biography: e.target.value })}
              placeholder="Tell venues about your style, gig history, and what makes your performance unique..."
              className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Genres (comma-separated)</label>
              <input
                type="text"
                value={portfolioData.genres}
                onChange={(e) => setPortfolioData({ ...portfolioData, genres: e.target.value })}
                placeholder="Folk, Pop, Acoustic"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Languages (comma-separated)</label>
              <input
                type="text"
                value={portfolioData.languages}
                onChange={(e) => setPortfolioData({ ...portfolioData, languages: e.target.value })}
                placeholder="English, Spanish"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">State</label>
              <select
                value={portfolioData.state}
                onChange={(e) => {
                  const s = e.target.value;
                  let c = 'Chandigarh';
                  if (s === 'Karnataka') c = 'Bengaluru';
                  else if (s === 'Maharashtra') c = 'Mumbai';
                  setPortfolioData({
                    ...portfolioData,
                    state: s,
                    city: c,
                  });
                }}
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              >
                <option value="Punjab">Punjab</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">City</label>
              <select
                value={portfolioData.city}
                onChange={(e) => setPortfolioData({ ...portfolioData, city: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              >
                {portfolioData.state === 'Punjab' && <option value="Chandigarh">Chandigarh</option>}
                {portfolioData.state === 'Karnataka' && <option value="Bengaluru">Bengaluru</option>}
                {portfolioData.state === 'Maharashtra' && <option value="Mumbai">Mumbai</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">Experience Level</label>
              <input
                type="text"
                value={portfolioData.experience}
                onChange={(e) => setPortfolioData({ ...portfolioData, experience: e.target.value })}
                placeholder="e.g. 5+ years doing lounges"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Technical Gear Requested (comma-separated)
              </label>
              <input
                type="text"
                value={portfolioData.equipmentNeeded}
                onChange={(e) =>
                  setPortfolioData({ ...portfolioData, equipmentNeeded: e.target.value })
                }
                placeholder="2x Vocal Mics, DI box"
                className="w-full p-3 rounded-xl border border-slate-350 bg-white text-slate-855 dark:bg-slate-900 dark:border-slate-750 dark:text-white"
              />
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 dark:bg-slate-900/50 dark:border-slate-800">
            <h3 className="text-lg font-bold tracking-tight mb-1">Media & Gallery</h3>
            <p className="text-slate-500 mb-4 text-xs">
              Add photos from your live performances. Upload will occur when you save the form.
            </p>

            {/* Upload Dropzone */}
            <div className="mb-6">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 transition dark:border-slate-700">
                <div className="flex flex-col items-center justify-center space-y-1">
                  {isUploading ? (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-500"></div>
                      <span className="text-xs font-medium text-slate-500">
                        Processing images...
                      </span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                      <span className="text-xs font-semibold text-rose-500">
                        Choose gallery photos
                      </span>
                      <span className="text-[10px] text-slate-400">
                        PNG, JPG or WEBP up to 1MB (Multiple allowed)
                      </span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>

            {/* Image Grid */}
            {portfolioData.photos.length > 0 || pendingGalleryFiles.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Saved Photos */}
                {portfolioData.photos.map((photo: string, index: number) => {
                  const isPrimary = portfolioData.imageUrl === photo;
                  return (
                    <div
                      key={`saved-${index}`}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <img
                        src={photo}
                        alt={`Portfolio photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {isPrimary && (
                        <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          Primary
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-2 space-y-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPhoto(photo)}
                            className="w-full text-center text-[10px] font-semibold py-1 bg-white hover:bg-slate-100 text-slate-800 rounded shadow-sm transition cursor-pointer"
                          >
                            Make Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo)}
                          className="w-full text-center text-[10px] font-semibold py-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pending Photos */}
                {pendingGalleryFiles.map((file: File, index: number) => {
                  const localUrl = URL.createObjectURL(file);
                  return (
                    <div
                      key={`pending-${index}`}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-rose-400 shadow-sm"
                    >
                      <img
                        src={localUrl}
                        alt={`Pending photo ${index + 1}`}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        Pending Upload
                      </div>
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col justify-end p-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPendingGalleryFiles((prev) => prev.filter((_, idx) => idx !== index))
                          }
                          className="w-full text-center text-[10px] font-semibold py-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow-sm transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
                <ImageIcon className="h-8 w-8 text-slate-350 mx-auto mb-1" />
                <p className="text-slate-400 text-xs">No photos queued or uploaded yet.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isUploading}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-6 rounded-xl transition shadow cursor-pointer disabled:bg-slate-400"
          >
            {isUploading ? 'Saving and Uploading...' : 'Save Portfolio Details'}
          </Button>
        </form>
      </div>
    </div>
  );
}
