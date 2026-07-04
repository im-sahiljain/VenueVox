import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api, uploadImageToCloudinary } from '@/lib/api';
import { toast } from 'sonner';

export interface OrganizationState {
  user: any | null;
  organization: any | null;
  venuesList: any[];
  slotsList: any[];
  bookingsList: any[];
  notificationsList: any[];
  reviewsList: any[];
  performersList: any[];
  managersList: any[];
  chatMessages: any[];
  activePerformerId: string | null;
  selectedCalendarVenue: string | null;
  isBulkCreateMode: boolean;
  errorMsg: string;
  successMsg: string;
  loading: boolean;
  isUploadingVenuePhoto: boolean;
}

const initialState: OrganizationState = {
  user: null,
  organization: null,
  venuesList: [],
  slotsList: [],
  bookingsList: [],
  notificationsList: [],
  reviewsList: [],
  performersList: [],
  managersList: [],
  chatMessages: [],
  activePerformerId: null,
  selectedCalendarVenue: null,
  isBulkCreateMode: false,
  errorMsg: '',
  successMsg: '',
  loading: false,
  isUploadingVenuePhoto: false,
};

// -----------------------------------------------------------------
// ASYNC THUNKS
// -----------------------------------------------------------------

export const loadAllDataThunk = createAsyncThunk(
  'organization/loadAllData',
  async (
    payload: { loggedUser: any; queryOrgId: string; orgState?: string; orgCity?: string },
    { rejectWithValue }
  ) => {
    try {
      const { loggedUser, queryOrgId, orgState, orgCity } = payload;
      
      // Fetch Venues
      const resVenues = await api.getVenues({ organizationId: queryOrgId });
      let orgVenues = resVenues.data || [];
      if (loggedUser.isManager) {
        orgVenues = orgVenues.filter(
          (v: any) => v.managerIds && v.managerIds.includes(loggedUser.id)
        );
      }

      // Fetch Slots
      const resSlots = await api.getSlots();
      let orgSlots = resSlots.data || [];
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v: any) => v.id);
        orgSlots = orgSlots.filter((s: any) => managedVenueIds.includes(s.venueId));
      }

      // Fetch Bookings
      const resBookings = await api.getBookings({ organizationId: queryOrgId });
      let orgBookings = resBookings.data || [];
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v: any) => v.id);
        orgBookings = orgBookings.filter((b: any) => managedVenueIds.includes(b.venueId));
      }

      // Fetch Notifications
      const resNotif = await api.getNotifications(queryOrgId);
      let orgNotif = resNotif.data || [];
      if (loggedUser.isManager) {
        const managedVenueNames = orgVenues.map((v: any) => v.name.toLowerCase());
        orgNotif = orgNotif.filter((n: any) =>
          managedVenueNames.some((name) => n.message.toLowerCase().includes(name))
        );
      }

      // Fetch Performers scoped to location
      const resPerf = await api.getPerformers({
        state: orgState && orgState !== 'All' ? orgState : undefined,
        city: orgCity && orgCity !== 'All' ? orgCity : undefined,
      });

      // Fetch Reviews
      const resReviews = await api.getReviews(queryOrgId);
      let orgReviews = resReviews.data || [];
      if (loggedUser.isManager) {
        const managedVenueIds = orgVenues.map((v: any) => v.id);
        orgReviews = orgReviews.filter((r: any) => {
          const booking = resBookings.data?.find((b: any) => b.id === r.bookingId);
          return booking && managedVenueIds.includes(booking.venueId);
        });
      }

      // Fetch Managers if Owner
      let managers: any[] = [];
      if (!loggedUser.isManager) {
        const resMgr = await api.getManagers(queryOrgId);
        managers = resMgr.data || [];
      }

      return {
        venuesList: orgVenues,
        slotsList: orgSlots,
        bookingsList: orgBookings,
        notificationsList: orgNotif,
        performersList: resPerf.data || [],
        reviewsList: orgReviews,
        managersList: managers,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load dashboard data');
    }
  }
);

export const refreshNotificationsAndMessagesThunk = createAsyncThunk(
  'organization/refreshNotificationsAndMessages',
  async (
    payload: { loggedUser: any; queryOrgId: string; activePerformerId: string | null; performersList: any[]; venuesList: any[] },
    { rejectWithValue }
  ) => {
    try {
      const { loggedUser, queryOrgId, activePerformerId, performersList, venuesList } = payload;
      const resNotif = await api.getNotifications(queryOrgId);
      let orgNotif = resNotif.data || [];
      if (loggedUser.isManager) {
        const managedVenueNames = venuesList.map((v: any) => v.name.toLowerCase());
        orgNotif = orgNotif.filter((n: any) =>
          managedVenueNames.some((name) => n.message.toLowerCase().includes(name))
        );
      }

      let chatMsgs: any[] = [];
      if (activePerformerId) {
        const perf = performersList.find((p) => p.id === activePerformerId);
        if (perf) {
          const resMsgs = await api.getMessages(queryOrgId, perf.userId);
          chatMsgs = resMsgs.data || [];
        }
      }

      return {
        notificationsList: orgNotif,
        chatMessages: chatMsgs,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to refresh polling data');
    }
  }
);

export const createVenueThunk = createAsyncThunk(
  'organization/createVenue',
  async (
    payload: {
      organizationId: string;
      name: string;
      address: string;
      description: string;
      capacity: number;
      type: string;
      equipment: string[];
      policies: string[];
      imageUrl: string;
      state: string;
      city: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.createVenue(payload);
      if (!res.success) throw new Error(res.message || 'Failed to create venue');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create venue');
    }
  }
);

export const updateVenueThunk = createAsyncThunk(
  'organization/updateVenue',
  async (
    payload: {
      id: string;
      name: string;
      address: string;
      description: string;
      capacity: number;
      type: string;
      equipment: string[];
      policies: string[];
      imageUrl: string;
      photos: string[];
      pendingVenueProfileFile: File | null;
      pendingVenueGalleryFiles: File[];
      orgId: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const {
        id,
        name,
        address,
        description,
        capacity,
        type,
        equipment,
        policies,
        imageUrl,
        photos,
        pendingVenueProfileFile,
        pendingVenueGalleryFiles,
        orgId,
      } = payload;

      let finalImageUrl = imageUrl;
      const venueFolder = `VenueVox/Organization/${orgId}/Venue/${id}/images`;

      // 1. Upload pending cover photo
      if (pendingVenueProfileFile) {
        finalImageUrl = await uploadImageToCloudinary(pendingVenueProfileFile, venueFolder);
      }

      // 2. Upload pending gallery photos
      let finalPhotos = [...(photos || [])];
      if (pendingVenueGalleryFiles.length > 0) {
        const uploadPromises = pendingVenueGalleryFiles.map((file) =>
          uploadImageToCloudinary(file, venueFolder)
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        finalPhotos = [...finalPhotos, ...uploadedUrls];
      }

      const formattedData = {
        name,
        address,
        description,
        capacity,
        type,
        equipment,
        policies,
        imageUrl: finalImageUrl,
        photos: finalPhotos,
      };

      const res = await api.updateVenue(id, formattedData);
      if (!res.success) throw new Error(res.message || 'Failed to update venue');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update venue');
    }
  }
);

export const deleteVenuePhotoThunk = createAsyncThunk(
  'organization/deleteVenuePhoto',
  async (
    payload: {
      venueId: string;
      photoUrl: string;
      currentPhotos: string[];
      currentImageUrl: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const { venueId, photoUrl, currentPhotos, currentImageUrl } = payload;
      
      // 1. Delete from Cloudinary via backend
      await api.deleteMedia(photoUrl);

      // 2. Update DB
      const updatedPhotos = currentPhotos.filter((p) => p !== photoUrl);
      let newImageUrl = currentImageUrl;
      if (currentImageUrl === photoUrl) {
        newImageUrl = updatedPhotos.length > 0 ? updatedPhotos[0] : '';
      }

      const res = await api.updateVenue(venueId, {
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

export const deleteVenueThunk = createAsyncThunk(
  'organization/deleteVenue',
  async (venueId: string, { rejectWithValue }) => {
    try {
      const res = await api.deleteVenue(venueId);
      if (!res.success) throw new Error(res.message || 'Failed to delete venue');
      return venueId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete venue');
    }
  }
);

export const setPrimaryVenuePhotoThunk = createAsyncThunk(
  'organization/setPrimaryVenuePhoto',
  async (payload: { venueId: string; photoUrl: string }, { rejectWithValue }) => {
    try {
      const { venueId, photoUrl } = payload;
      const res = await api.updateVenue(venueId, { imageUrl: photoUrl });
      if (!res.success) throw new Error(res.message || 'Failed to set primary photo');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to set primary photo');
    }
  }
);

export const approveBookingThunk = createAsyncThunk(
  'organization/approveBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await api.approveBooking(bookingId);
      if (!res.success) throw new Error(res.message || 'Failed to approve booking');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to approve booking');
    }
  }
);

export const rejectBookingThunk = createAsyncThunk(
  'organization/rejectBooking',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await api.rejectBooking(bookingId);
      if (!res.success) throw new Error(res.message || 'Failed to reject booking');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to reject booking');
    }
  }
);

export const createSlotThunk = createAsyncThunk(
  'organization/createSlot',
  async (
    payload: {
      venueId: string;
      date: string;
      startTime: string;
      endTime: string;
      budget: number;
      status: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.createSlot(payload);
      if (!res.success) throw new Error(res.message || 'Failed to create slot');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create slot');
    }
  }
);

export const updateSlotThunk = createAsyncThunk(
  'organization/updateSlot',
  async (payload: { slotId: string; data: any }, { rejectWithValue }) => {
    try {
      const { slotId, data } = payload;
      const res = await api.updateSlot(slotId, data);
      if (!res.success) throw new Error(res.message || 'Failed to update slot');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update slot');
    }
  }
);

export const deleteSlotThunk = createAsyncThunk(
  'organization/deleteSlot',
  async (slotId: string, { rejectWithValue }) => {
    try {
      const res = await api.deleteSlot(slotId);
      if (!res.success) throw new Error(res.message || 'Failed to delete slot');
      return slotId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete slot');
    }
  }
);

export const sendMessageThunk = createAsyncThunk(
  'organization/sendMessage',
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

export const markNotificationReadThunk = createAsyncThunk(
  'organization/markNotificationRead',
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

export const createManagerThunk = createAsyncThunk(
  'organization/createManager',
  async (
    payload: { organizationId: string; name: string; email: string; phone?: string; venueId?: string },
    { rejectWithValue }
  ) => {
    try {
      const { organizationId, ...managerData } = payload;
      const res = await api.createManager(organizationId, managerData);
      if (!res.success) throw new Error(res.message || 'Failed to create manager');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create manager');
    }
  }
);

// -----------------------------------------------------------------
// SLICE
// -----------------------------------------------------------------

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<any>) {
      state.user = action.payload;
    },
    setOrganizationDetails(state, action: PayloadAction<any>) {
      state.organization = action.payload;
    },
    setActivePerformerId(state, action: PayloadAction<string | null>) {
      state.activePerformerId = action.payload;
    },
    setSelectedCalendarVenue(state, action: PayloadAction<string | null>) {
      state.selectedCalendarVenue = action.payload;
    },
    setIsBulkCreateMode(state, action: PayloadAction<boolean>) {
      state.isBulkCreateMode = action.payload;
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
      .addCase(loadAllDataThunk.pending, (state) => {
        state.loading = true;
        state.errorMsg = '';
      })
      .addCase(loadAllDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.venuesList = action.payload.venuesList;
        state.slotsList = action.payload.slotsList;
        state.bookingsList = action.payload.bookingsList;
        state.notificationsList = action.payload.notificationsList;
        state.performersList = action.payload.performersList;
        state.reviewsList = action.payload.reviewsList;
        state.managersList = action.payload.managersList;
        if (state.venuesList.length > 0 && !state.selectedCalendarVenue) {
          state.selectedCalendarVenue = state.venuesList[0].id;
        }
      })
      .addCase(loadAllDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.errorMsg = action.payload as string;
      })

      // Refresh Notifications and Messages
      .addCase(refreshNotificationsAndMessagesThunk.fulfilled, (state, action) => {
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

      // Create Venue
      .addCase(createVenueThunk.fulfilled, (state, action) => {
        state.venuesList.push(action.payload);
        if (!state.selectedCalendarVenue) {
          state.selectedCalendarVenue = action.payload.id;
        }
        state.successMsg = 'Venue created successfully!';
      })
      .addCase(createVenueThunk.rejected, (state, action) => {
        state.errorMsg = action.payload as string;
      })

      // Update Venue
      .addCase(updateVenueThunk.pending, (state) => {
        state.isUploadingVenuePhoto = true;
        state.errorMsg = '';
      })
      .addCase(updateVenueThunk.fulfilled, (state, action) => {
        state.isUploadingVenuePhoto = false;
        state.venuesList = state.venuesList.map((v) =>
          v.id === action.payload.id ? action.payload : v
        );
        state.successMsg = 'Venue updated successfully!';
      })
      .addCase(updateVenueThunk.rejected, (state, action) => {
        state.isUploadingVenuePhoto = false;
        state.errorMsg = action.payload as string;
      })

      // Delete Venue Photo
      .addCase(deleteVenuePhotoThunk.pending, (state) => {
        state.isUploadingVenuePhoto = true;
      })
      .addCase(deleteVenuePhotoThunk.fulfilled, (state, action) => {
        state.isUploadingVenuePhoto = false;
        state.venuesList = state.venuesList.map((v) =>
          v.id === action.payload.id ? action.payload : v
        );
        state.successMsg = 'Photo deleted successfully!';
      })
      .addCase(deleteVenuePhotoThunk.rejected, (state, action) => {
        state.isUploadingVenuePhoto = false;
        state.errorMsg = action.payload as string;
      })

      // Delete Venue
      .addCase(deleteVenueThunk.fulfilled, (state, action) => {
        state.venuesList = state.venuesList.filter((v) => v.id !== action.payload);
        state.successMsg = 'Venue deleted successfully!';
      })
      .addCase(deleteVenueThunk.rejected, (state, action) => {
        state.errorMsg = action.payload as string;
      })

      // Set Primary Venue Photo
      .addCase(setPrimaryVenuePhotoThunk.fulfilled, (state, action) => {
        state.venuesList = state.venuesList.map((v) =>
          v.id === action.payload.id ? action.payload : v
        );
        state.successMsg = 'Primary venue photo updated successfully!';
      })

      // Approve Booking
      .addCase(approveBookingThunk.fulfilled, (state, action) => {
        state.bookingsList = state.bookingsList.map((b) =>
          b.id === action.payload.id ? action.payload : b
        );
        state.successMsg = 'Booking approved successfully!';
      })

      // Reject Booking
      .addCase(rejectBookingThunk.fulfilled, (state, action) => {
        state.bookingsList = state.bookingsList.map((b) =>
          b.id === action.payload.id ? action.payload : b
        );
        state.successMsg = 'Booking rejected successfully!';
      })

      // Create Slot
      .addCase(createSlotThunk.fulfilled, (state, action) => {
        state.slotsList.push(action.payload);
        state.successMsg = 'Calendar slot created successfully!';
      })

      // Update Slot
      .addCase(updateSlotThunk.fulfilled, (state, action) => {
        state.slotsList = state.slotsList.map((s) =>
          s.id === action.payload.id ? action.payload : s
        );
        state.successMsg = 'Slot updated successfully!';
      })

      // Delete Slot
      .addCase(deleteSlotThunk.fulfilled, (state, action) => {
        state.slotsList = state.slotsList.filter((s) => s.id !== action.payload);
        state.successMsg = 'Slot deleted successfully!';
      })

      // Send Message
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.chatMessages.push(action.payload);
      })

      // Mark Notification Read
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        state.notificationsList = state.notificationsList.map((n) =>
          n.id === action.payload ? { ...n, isRead: true } : n
        );
      })

      // Create Manager
      .addCase(createManagerThunk.fulfilled, (state, action) => {
        state.managersList.push(action.payload);
        state.successMsg = 'Manager added successfully!';
      });
  },
});

export const {
  setAuthUser,
  setOrganizationDetails,
  setActivePerformerId,
  setSelectedCalendarVenue,
  setIsBulkCreateMode,
  clearMessages,
  setErrorMsg,
  setSuccessMsg,
} = organizationSlice.actions;

export default organizationSlice.reducer;
