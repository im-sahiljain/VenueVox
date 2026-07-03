import performerReducer, {
  updatePortfolioThunk,
  PerformerState,
} from '../lib/store/performerSlice';

describe('Performer slice: Portfolio CRUD transitions', () => {
  const getInitialState = (): PerformerState => ({
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
      state: 'Punjab',
      city: 'Chandigarh',
      type: 'All',
      budget: '',
    },
    errorMsg: '',
    successMsg: '',
    loading: false,
    isUploading: false,
  });

  it('sets isUploading to true on updatePortfolioThunk.pending', () => {
    const initialState = getInitialState();
    const action = {
      type: updatePortfolioThunk.pending.type,
    };

    const nextState = performerReducer(initialState, action);

    expect(nextState.isUploading).toBe(true);
    expect(nextState.errorMsg).toBe('');
  });

  it('updates the performer profile and sets isUploading to false on updatePortfolioThunk.fulfilled', () => {
    const initialState = {
      ...getInitialState(),
      isUploading: true,
      performer: { id: 'perf-1', name: 'Old Name', biography: 'Old Bio' },
    };

    const updatedPerformer = { id: 'perf-1', name: 'New Name', biography: 'New Bio' };
    const action = {
      type: updatePortfolioThunk.fulfilled.type,
      payload: updatedPerformer,
    };

    const nextState = performerReducer(initialState, action);

    expect(nextState.isUploading).toBe(false);
    expect(nextState.performer).toEqual(updatedPerformer);
    expect(nextState.successMsg).toBe('Portfolio updated successfully!');
  });

  it('sets isUploading to false and sets errorMsg on updatePortfolioThunk.rejected', () => {
    const initialState = {
      ...getInitialState(),
      isUploading: true,
    };

    const action = {
      type: updatePortfolioThunk.rejected.type,
      payload: 'Network error or upload failed',
    };

    const nextState = performerReducer(initialState, action);

    expect(nextState.isUploading).toBe(false);
    expect(nextState.errorMsg).toBe('Network error or upload failed');
  });
});
