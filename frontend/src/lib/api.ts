const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include', // Enforce cookie transmission
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'API request failed');
  }

  return json;
}

export interface ApiRes<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: string[];
}

export const api = {
  // Auth
  login: async (email: string, role: 'organization' | 'performer', state?: string, city?: string) => {
    return request<ApiRes<{ token: string; user: any; performer?: any; organization?: any }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'dummy-password', role, state, city }),
    });
  },

  // Venues
  getVenues: async (filters: { state?: string; city?: string; organizationId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    if (filters.organizationId) params.append('organizationId', filters.organizationId);
    return request<ApiRes<any[]>>(`/venues?${params.toString()}`);
  },
  createVenue: async (venue: any) => {
    return request<ApiRes<any>>('/venues', {
      method: 'POST',
      body: JSON.stringify(venue),
    });
  },
  updateVenue: async (id: string, venue: any) => {
    return request<ApiRes<any>>(`/venues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(venue),
    });
  },
  deleteVenue: async (id: string) => {
    return request<ApiRes<null>>(`/venues/${id}`, {
      method: 'DELETE',
    });
  },

  // Slots
  getSlots: async (venueId?: string) => {
    const path = venueId ? `/slots?venueId=${venueId}` : '/slots';
    return request<ApiRes<any[]>>(path);
  },
  createSlot: async (slot: any) => {
    return request<ApiRes<any>>('/slots', {
      method: 'POST',
      body: JSON.stringify(slot),
    });
  },
  updateSlot: async (id: string, slot: any) => {
    return request<ApiRes<any>>(`/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(slot),
    });
  },
  deleteSlot: async (id: string) => {
    return request<ApiRes<null>>(`/slots/${id}`, {
      method: 'DELETE',
    });
  },
  discoverSlots: async (filters: {
    location?: string;
    date?: string;
    budget?: number;
    genre?: string;
    venueType?: string;
    equipment?: string;
    state?: string;
    city?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.date) params.append('date', filters.date);
    if (filters.budget) params.append('budget', String(filters.budget));
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.venueType) params.append('venueType', filters.venueType);
    if (filters.equipment) params.append('equipment', filters.equipment);
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);

    return request<ApiRes<any[]>>(`/slots/discover?${params.toString()}`);
  },

  // Bookings
  getBookings: async (filters: { performerId?: string; organizationId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.performerId) params.append('performerId', filters.performerId);
    if (filters.organizationId) params.append('organizationId', filters.organizationId);
    return request<ApiRes<any[]>>(`/bookings?${params.toString()}`);
  },
  requestBooking: async (slotId: string, performerId: string) => {
    return request<ApiRes<any>>('/bookings/request', {
      method: 'POST',
      body: JSON.stringify({ slotId, performerId }),
    });
  },
  approveBooking: async (bookingId: string) => {
    return request<ApiRes<any>>(`/bookings/${bookingId}/approve`, {
      method: 'POST',
    });
  },
  rejectBooking: async (bookingId: string) => {
    return request<ApiRes<any>>(`/bookings/${bookingId}/reject`, {
      method: 'POST',
    });
  },

  // Performers
  getPerformers: async (filters: { state?: string; city?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    return request<ApiRes<any[]>>(`/performers?${params.toString()}`);
  },
  getPerformer: async (id: string) => {
    return request<ApiRes<any>>(`/performers/${id}`);
  },
  updatePerformer: async (id: string, data: any) => {
    return request<ApiRes<any>>(`/performers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Messages
  getMessages: async (userId: string, otherUserId?: string) => {
    const params = new URLSearchParams();
    params.append('userId', userId);
    if (otherUserId) params.append('otherUserId', otherUserId);
    return request<ApiRes<any[]>>(`/messages?${params.toString()}`);
  },
  sendMessage: async (senderId: string, receiverId: string, content: string) => {
    return request<ApiRes<any>>('/messages', {
      method: 'POST',
      body: JSON.stringify({ senderId, receiverId, content }),
    });
  },

  // Notifications
  getNotifications: async (userId: string) => {
    return request<ApiRes<any[]>>(`/notifications?userId=${userId}`);
  },
  markNotificationRead: async (id: string) => {
    return request<ApiRes<any>>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  // Reviews
  getReviews: async (revieweeId?: string) => {
    const path = revieweeId ? `/reviews?revieweeId=${revieweeId}` : '/reviews';
    return request<ApiRes<any[]>>(path);
  },
  createReview: async (review: any) => {
    return request<ApiRes<any>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },

  // Managers
  getManagers: async (orgId: string) => {
    return request<ApiRes<any[]>>(`/organizations/${orgId}/managers`);
  },
  createManager: async (orgId: string, manager: any) => {
    return request<ApiRes<any>>(`/organizations/${orgId}/managers`, {
      method: 'POST',
      body: JSON.stringify(manager),
    });
  },

  // ==========================================
  // VOICE AI API
  // ==========================================
  voice: {
    // Provision or sync the Voice Assistant
    provisionAssistant: async (orgId: string, industry: string): Promise<ApiRes<any>> => {
      return request<ApiRes<any>>('/voice/provision', {
        method: "POST",
        body: JSON.stringify({ orgId, industry }),
      });
    },

    // Get Assistant details
    getAssistant: async (orgId: string): Promise<ApiRes<any>> => {
      return request<ApiRes<any>>(`/voice/assistant?orgId=${orgId}`);
    },

    // Get Call History
    getCalls: async (orgId: string): Promise<ApiRes<any[]>> => {
      return request<ApiRes<any[]>>(`/voice/calls?orgId=${orgId}`);
    },

    // Get available industry templates
    getIndustries: async (): Promise<ApiRes<any[]>> => {
      return request<ApiRes<any[]>>('/voice/industries');
    },
  },

  // Delete media from Cloudinary via backend
  deleteMedia: async (url: string): Promise<ApiRes<any>> => {
    return request<ApiRes<any>>('/media/delete', {
      method: 'POST',
      body: JSON.stringify({ url }),
      headers: { 'Content-Type': 'application/json' }
    });
  },
};

export const uploadImageToCloudinary = async (file: File, folderPath: string): Promise<string> => {
  if (file.size > 1024 * 1024) {
    throw new Error("File size exceeds the 1MB limit. Please compress or select another photo.");
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folderPath);
  
  const res = await fetch(`${API_BASE}/media/upload`, {
    method: "POST",
    body: formData,
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.message || "Failed to upload image to Cloudinary via backend");
  }
  
  const data = await res.json();
  return data.data;
};
