import organizationReducer, {
  setAuthUser,
  setOrganizationDetails,
  setSelectedCalendarVenue,
  setIsBulkCreateMode,
  clearMessages,
  OrganizationState,
} from '../lib/store/organizationSlice';

describe('organizationSlice reducer', () => {
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

  it('should return the initial state on first load', () => {
    expect(organizationReducer(undefined, { type: 'unknown' })).toEqual(getInitialState());
  });

  it('should handle setAuthUser action', () => {
    const prevState = getInitialState();
    const action = setAuthUser({ id: 'org-user-123', name: 'John Doe', role: 'organization' });
    const nextState = organizationReducer(prevState, action);

    expect(nextState.user).toEqual({ id: 'org-user-123', name: 'John Doe', role: 'organization' });
  });

  it('should handle setOrganizationDetails action', () => {
    const prevState = getInitialState();
    const action = setOrganizationDetails({ id: 'org-abc', name: 'ABC Group' });
    const nextState = organizationReducer(prevState, action);

    expect(nextState.organization).toEqual({ id: 'org-abc', name: 'ABC Group' });
  });

  it('should handle setSelectedCalendarVenue action', () => {
    const prevState = getInitialState();
    const action = setSelectedCalendarVenue('venue-xyz');
    const nextState = organizationReducer(prevState, action);

    expect(nextState.selectedCalendarVenue).toBe('venue-xyz');
  });

  it('should handle setIsBulkCreateMode action', () => {
    const prevState = getInitialState();
    const action = setIsBulkCreateMode(true);
    const nextState = organizationReducer(prevState, action);

    expect(nextState.isBulkCreateMode).toBe(true);
  });

  it('should handle clearMessages action', () => {
    const prevState = {
      ...getInitialState(),
      errorMsg: 'Some error message',
      successMsg: 'Some success message',
    };
    const action = clearMessages();
    const nextState = organizationReducer(prevState, action);

    expect(nextState.errorMsg).toBe('');
    expect(nextState.successMsg).toBe('');
  });
});
