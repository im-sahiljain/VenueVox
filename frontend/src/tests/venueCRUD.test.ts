import organizationReducer, {
  createVenueThunk,
  updateVenueThunk,
  deleteVenueThunk,
  OrganizationState,
} from '../lib/store/organizationSlice';
import { api } from '../lib/api';

// Mock the API client
jest.mock('../lib/api', () => ({
  api: {
    createVenue: jest.fn(),
    updateVenue: jest.fn(),
    deleteVenue: jest.fn(),
  },
  uploadImageToCloudinary: jest.fn(() => Promise.resolve('https://cloudinary.com/uploaded.jpg')),
}));

describe('Organization slice: Venue CRUD transitions', () => {
  const getInitialState = (): OrganizationState => ({
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adds a new venue to the list on createVenueThunk.fulfilled', () => {
    const initialState = getInitialState();
    const mockVenue = { id: 'venue-100', name: 'New Venue', address: '123 St' };

    const action = {
      type: createVenueThunk.fulfilled.type,
      payload: mockVenue,
    };

    const nextState = organizationReducer(initialState, action);

    expect(nextState.venuesList).toHaveLength(1);
    expect(nextState.venuesList[0]).toEqual(mockVenue);
    expect(nextState.selectedCalendarVenue).toBe('venue-100'); // Auto select calendar venue
    expect(nextState.successMsg).toBe('Venue created successfully!');
  });

  it('updates the venue in the list on updateVenueThunk.fulfilled', () => {
    const initialState = {
      ...getInitialState(),
      venuesList: [
        { id: 'venue-1', name: 'Old Venue Name', address: '123 St' },
        { id: 'venue-2', name: 'Other Venue', address: '456 Ave' },
      ],
    };

    const updatedVenue = { id: 'venue-1', name: 'New Venue Name', address: '123 St' };

    const action = {
      type: updateVenueThunk.fulfilled.type,
      payload: updatedVenue,
    };

    const nextState = organizationReducer(initialState, action);

    expect(nextState.venuesList).toHaveLength(2);
    expect(nextState.venuesList.find(v => v.id === 'venue-1')?.name).toBe('New Venue Name');
    expect(nextState.successMsg).toBe('Venue updated successfully!');
  });

  it('removes the venue from the list on deleteVenueThunk.fulfilled', () => {
    const initialState = {
      ...getInitialState(),
      venuesList: [
        { id: 'venue-1', name: 'Venue 1' },
        { id: 'venue-2', name: 'Venue 2' },
      ],
    };

    const action = {
      type: deleteVenueThunk.fulfilled.type,
      payload: 'venue-1', // returns deleted venueId
    };

    const nextState = organizationReducer(initialState, action);

    expect(nextState.venuesList).toHaveLength(1);
    expect(nextState.venuesList[0].id).toBe('venue-2');
    expect(nextState.successMsg).toBe('Venue deleted successfully!');
  });
});
