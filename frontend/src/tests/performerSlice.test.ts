import performerReducer, {
  setSearchFilters,
  setActiveVenueId,
  setErrorMsg,
  setSuccessMsg,
  PerformerState,
} from '../lib/store/performerSlice';

describe('performerSlice reducer', () => {
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

  it('should return the initial state on first load', () => {
    expect(performerReducer(undefined, { type: 'unknown' })).toEqual(getInitialState());
  });

  it('should handle setSearchFilters action', () => {
    const prevState = getInitialState();
    const action = setSearchFilters({ city: 'Bengaluru', type: 'Club' });
    const nextState = performerReducer(prevState, action);

    expect(nextState.searchFilters.city).toBe('Bengaluru');
    expect(nextState.searchFilters.type).toBe('Club');
    expect(nextState.searchFilters.state).toBe('Punjab'); // Unchanged
  });

  it('should handle setActiveVenueId action', () => {
    const prevState = getInitialState();
    const action = setActiveVenueId('venue-987');
    const nextState = performerReducer(prevState, action);

    expect(nextState.activeVenueId).toBe('venue-987');
  });

  it('should handle setErrorMsg and setSuccessMsg actions', () => {
    const prevState = getInitialState();
    
    let state = performerReducer(prevState, setErrorMsg('Test error message'));
    expect(state.errorMsg).toBe('Test error message');
    expect(state.successMsg).toBe('');

    state = performerReducer(state, setSuccessMsg('Test success message'));
    expect(state.successMsg).toBe('Test success message');
  });
});
