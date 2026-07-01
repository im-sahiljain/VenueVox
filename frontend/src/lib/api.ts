const API_BASE = 'http://localhost:3001/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
  login: async (email: string, role: 'organization' | 'performer') => {
    return request<ApiRes<{ token: string; user: any; performer: any }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'dummy-password', role }),
    });
  },

  // Venues
  getVenues: async () => {
    return request<ApiRes<any[]>>('/venues');
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
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.date) params.append('date', filters.date);
    if (filters.budget) params.append('budget', String(filters.budget));
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.venueType) params.append('venueType', filters.venueType);
    if (filters.equipment) params.append('equipment', filters.equipment);

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
  getPerformers: async () => {
    return request<ApiRes<any[]>>('/performers');
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
};
