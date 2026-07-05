import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, uploadImageToCloudinary } from '@/lib/api';
import { toast } from 'sonner';

export interface PerformerState {
  user: any | null;
  performer: any | null;
  slotsList: any[];
  bookingsList: any[];
  notificationsList: any[];
  reviewsList: any[];
  venuesList: any[];
  chatMessages: any[];
  activeVenueId: string | null;
  searchFilters: {
    state: string;
    city: string;
    type: string;
    budget: string;
  };
  errorMsg: string;
  successMsg: string;
  loading: boolean;
  isUploading: boolean;
}

const initialState: PerformerState = {
  user: null,
  performer: null,
  slotsList: [],
  bookingsList: [],
  notificationsList: [],
  reviewsList: [],
  venuesList: [],
  chatMessages: [],
  activeVenueId: null,
  searchFilters: {
    state: 'All',
    city: 'All',
    type: 'All',
    budget: '',
  },
  errorMsg: '',
  successMsg: '',
  loading: false,
  isUploading: false,
};

// -----------------------------------------------------------------
// ASYNC THUNKS
// -----------------------------------------------------------------

export const loadPerformerDataThunk = createAsyncThunk(
  'performer/loadData',
  async (
    payload: { userId: string; performerId: string; performerState?: string; performerCity?: string },
    { rejectWithValue }
  ) => {
    try {
      const { userId, performerId, performerState, performerCity } = payload;

      // 1. Slots discover
      const resSlots = await api.discoverSlots({
        state: performerState && performerState !== 'All' ? performerState : undefined,
        city: performerCity && performerCity !== 'All' ? performerCity : undefined,
      });

      // 2. Bookings
      const resBookings = await api.getBookings({ performerId });

      // 3. Notifications
      const resNotif = await api.getNotifications(userId);

      // 4. Venues (scoped to performer's location)
      const resVenues = await api.getVenues({
        state: performerState && performerState !== 'All' ? performerState : undefined,
        city: performerCity && performerCity !== 'All' ? performerCity : undefined,
      });

      // 5. Reviews
      const resReviews = await api.getReviews(performerId);

      return {
        slotsList: resSlots.data || [],
        bookingsList: resBookings.data || [],
        notificationsList: resNotif.data || [],
        venuesList: resVenues.data || [],
        reviewsList: resReviews.data || [],
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load performer dashboard data');
    }
  }
);

export const refreshPerformerNotificationsAndMessagesThunk = createAsyncThunk(
  'performer/refreshNotificationsAndMessages',
  async (
    payload: { userId: string; activeVenueId: string | null; venuesList: any[] },
    { rejectWithValue }
  ) => {
    try {
      const { userId, activeVenueId, venuesList } = payload;
      const resNotif = await api.getNotifications(userId);

      let chatMsgs: any[] = [];
      if (activeVenueId) {
        const venue = venuesList.find((v) => v.id === activeVenueId);
        if (venue) {
          const otherId = (venue.managerIds && venue.managerIds.length > 0) ? venue.managerIds[0] : venue.organizationId;
          const resMsgs = await api.getMessages(userId, otherId);
          chatMsgs = resMsgs.data || [];
        }
      }

      return {
        notificationsList: resNotif.data || [],
        chatMessages: chatMsgs,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to refresh performer data');
    }
  }
);

export const updatePortfolioThunk = createAsyncThunk(
  'performer/updatePortfolio',
  async (
    payload: {
      performerId: string;
      name: string;
      biography: string;
      genres: string[];
      pricing: number;
      languages: string[];
      experience: string;
      travelRadius: number;
      equipmentNeeded: string[];
      imageUrl: string;
      photos: string[];
      state: string;
      city: string;
      pendingProfileFile: File | null;
      pendingGalleryFiles: File[];
    },
    { rejectWithValue }
  ) => {
    try {
      const {
        performerId,
        name,
        biography,
        genres,
        pricing,
        languages,
        experience,
        travelRadius,
        equipmentNeeded,
        imageUrl,
        photos,
        state,
        city,
        pendingProfileFile,
        pendingGalleryFiles,
      } = payload;

      let finalImageUrl = imageUrl;
      const performerFolder = `VenueVoxAI/Performer/${performerId}/images`;

      // 1. Upload pending profile photo
      if (pendingProfileFile) {
        finalImageUrl = await uploadImageToCloudinary(pendingProfileFile, performerFolder);
      }

      // 2. Upload pending gallery photos
      let finalPhotos = [...(photos || [])];
      if (pendingGalleryFiles.length > 0) {
        const uploadPromises = pendingGalleryFiles.map((file) =>
          uploadImageToCloudinary(file, performerFolder)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        finalPhotos = [...finalPhotos, ...uploadedUrls];
      }

      const formattedData = {
        name,
        biography,
        genres,
        pricing,
        languages,
        experience,
        travelRadius,
        equipmentNeeded,
        imageUrl: finalImageUrl,
        photos: finalPhotos,
        state,
        city,
      };

      const res = await api.updatePerformer(performerId, formattedData);
      if (!res.success) throw new Error(res.message || 'Failed to update portfolio');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update portfolio');
    }
  }
);

export const deletePerformerPhotoThunk = createAsyncThunk(
  'performer/deletePhoto',
  async (
    payload: {
      performerId: string;
      photoUrl: string;
      currentPhotos: string[];
      currentImageUrl: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { performerId, photoUrl, currentPhotos, currentImageUrl } = payload;
      
      // 1. Delete from Cloudinary
      await api.deleteMedia(photoUrl);

      // 2. Update DB
      const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);
      let newImageUrl = currentImageUrl;
      if (currentImageUrl === photoUrl) {
        newImageUrl = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
      }

      const res = await api.updatePerformer(performerId, {
        photos: updatedPhotos,
        imageUrl: newImageUrl,
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete photo');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete photo');
    }
  }
);

export const setPrimaryPerformerPhotoThunk = createAsyncThunk(
  'performer/setPrimaryPhoto',
  async (payload: { performerId: string; photoUrl: string }, { rejectWithValue }) => {
    try {
      const { performerId, photoUrl } = payload;
      const res = await api.updatePerformer(performerId, { imageUrl: photoUrl });
      if (!res.success) throw new Error(res.message || 'Failed to set primary photo');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to set primary photo');
    }
  }
);

export const requestBookingThunk = createAsyncThunk(
  'performer/requestBooking',
  async (
    payload: {
      slotId: string;
      performerId: string;
      venueId: string;
      date: string;
      startTime: string;
      endTime: string;
      budget: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.requestBooking(payload.slotId, payload.performerId);
      if (!res.success) throw new Error(res.message || 'Failed to request booking');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to request booking');
    }
  }
);

export const createReviewThunk = createAsyncThunk(
  'performer/createReview',
  async (
    payload: {
      rating: number;
      comment: string;
      reviewerId: string; // The performer's userId
      bookingId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.createReview(payload);
      if (!res.success) throw new Error(res.message || 'Failed to submit review');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to submit review');
    }
  }
);

export const sendPerformerMessageThunk = createAsyncThunk(
  'performer/sendMessage',
  async (payload: { senderId: string; receiverId: string; text: string }, { rejectWithValue }) => {
    try {
      const res = await api.sendMessage(payload.senderId, payload.receiverId, payload.text);
      if (!res.success) throw new Error(res.message || 'Failed to send message');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to send message');
    }
  }
);

export const markPerformerNotificationReadThunk = createAsyncThunk(
  'performer/markNotificationRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const res = await api.markNotificationRead(notificationId);
      if (!res.success) throw new Error(res.message || 'Failed to mark notification read');
      return notificationId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to mark notification read');
    }
  }
);

// -----------------------------------------------------------------
// SLICE
// -----------------------------------------------------------------

const performerSlice = createSlice({
  name: 'performer',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<any>) {
      state.user = action.payload;
    },
    setPerformerProfile(state, action: PayloadAction<any>) {
      state.performer = action.payload;
      if (action.payload) {
        state.searchFilters.state = action.payload.state || 'All';
        state.searchFilters.city = action.payload.city || 'All';
      }
    },
    setActiveVenueId(state, action: PayloadAction<string | null>) {
      state.activeVenueId = action.payload;
    },
    setSearchFilters(
      state,
      action: PayloadAction<Partial<PerformerState['searchFilters']>>
    ) {
      state.searchFilters = {
        ...state.searchFilters,
        ...action.payload,
      };
    },
    clearMessages(state) {
      state.errorMsg = '';
      state.successMsg = '';
    },
    setErrorMsg(state, action: PayloadAction<string>) {
      state.errorMsg = action.payload;
    },
    setSuccessMsg(state, action: PayloadAction<string>) {
      state.successMsg = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load All Data
      .addCase(loadPerformerDataThunk.pending, (state) => {
        state.loading = true;
        state.errorMsg = '';
      })
      .addCase(loadPerformerDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.slotsList = action.payload.slotsList;
        state.bookingsList = action.payload.bookingsList;
        state.notificationsList = action.payload.notificationsList;
        state.venuesList = action.payload.venuesList;
        state.reviewsList = action.payload.reviewsList;
      })
      .addCase(loadPerformerDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMsg = action.payload as string;
      })

      // Refresh Notifications and Messages
      .addCase(refreshPerformerNotificationsAndMessagesThunk.fulfilled, (state, action) => {
        // Find new unread notifications
        const oldIds = new Set(state.notificationsList.map((n: any) => n.id));
        const newUnread = action.payload.notificationsList.filter(
          (n: any) => !n.isRead && !oldIds.has(n.id)
        );
        newUnread.forEach((n: any) => {
          toast(n.title || 'Notification', {
            description: n.message,
            icon: '🔔',
          });
        });

        // Find new chat messages
        const oldMsgIds = new Set(state.chatMessages.map((m: any) => m.id));
        const newMsgs = action.payload.chatMessages.filter(
          (m: any) => !oldMsgIds.has(m.id) && m.senderId !== state.user?.id
        );
        newMsgs.forEach((m: any) => {
          toast('New Message', {
            description: m.content,
            icon: '💬',
          });
        });

        state.notificationsList = action.payload.notificationsList;
        if (action.payload.chatMessages.length > 0) {
          state.chatMessages = action.payload.chatMessages;
        }
      })

      // Update Portfolio
      .addCase(updatePortfolioThunk.pending, (state) => {
        state.isUploading = true;
        state.errorMsg = '';
      })
      .addCase(updatePortfolioThunk.fulfilled, (state, action) => {
        state.isUploading = false;
        state.performer = action.payload;
        state.successMsg = 'Portfolio updated successfully!';
        localStorage.setItem('performer', JSON.stringify(action.payload));
      })
      .addCase(updatePortfolioThunk.rejected, (state, action) => {
        state.isUploading = false;
        state.errorMsg = action.payload as string;
      })

      // Delete Photo
      .addCase(deletePerformerPhotoThunk.pending, (state) => {
        state.isUploading = true;
      })
      .addCase(deletePerformerPhotoThunk.fulfilled, (state, action) => {
        state.isUploading = false;
        state.performer = action.payload;
        state.successMsg = 'Photo deleted successfully!';
        localStorage.setItem('performer', JSON.stringify(action.payload));
      })
      .addCase(deletePerformerPhotoThunk.rejected, (state, action) => {
        state.isUploading = false;
        state.errorMsg = action.payload as string;
      })

      // Set Primary Photo
      .addCase(setPrimaryPerformerPhotoThunk.fulfilled, (state, action) => {
        state.performer = action.payload;
        state.successMsg = 'Primary photo updated successfully!';
        localStorage.setItem('performer', JSON.stringify(action.payload));
      })

      // Request Booking
      .addCase(requestBookingThunk.fulfilled, (state, action) => {
        state.bookingsList.push(action.payload.booking);
        // Mark slot as booked or pending locally
        if (action.payload.slot) {
          state.slotsList = state.slotsList.map((s) =>
            s.id === action.payload.slot.id ? action.payload.slot : s
          );
        }
        state.successMsg = 'Gig request submitted successfully!';
      })
      .addCase(requestBookingThunk.rejected, (state, action) => {
        state.errorMsg = action.payload as string;
      })

      // Submit Review
      .addCase(createReviewThunk.fulfilled, (state, action) => {
        state.reviewsList.push(action.payload);
        state.successMsg = 'Review submitted successfully!';
      })
      .addCase(createReviewThunk.rejected, (state, action) => {
        state.errorMsg = action.payload as string;
      })

      // Send Message
      .addCase(sendPerformerMessageThunk.fulfilled, (state, action) => {
        state.chatMessages.push(action.payload);
      })

      // Mark Notification Read
      .addCase(markPerformerNotificationReadThunk.fulfilled, (state, action) => {
        state.notificationsList = state.notificationsList.map((n) =>
          n.id === action.payload ? { ...n, isRead: true } : n
        );
      });
  },
});

export const {
  setAuthUser,
  setPerformerProfile,
  setActiveVenueId,
  setSearchFilters,
  clearMessages,
  setErrorMsg,
  setSuccessMsg,
} = performerSlice.actions;

export default performerSlice.reducer;
