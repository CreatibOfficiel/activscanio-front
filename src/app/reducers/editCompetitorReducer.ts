import { Competitor } from '../models/Competitor';

export interface EditCompetitorState {
  loading: boolean;
  competitor: Competitor | null;
  firstName: string;
  lastName: string;
  profileUrl: string;
}

export type EditCompetitorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_COMPETITOR'; payload: Competitor }
  | { type: 'SET_FORM_FIELD'; field: 'firstName' | 'lastName' | 'profileUrl'; value: string };

export const initialState: EditCompetitorState = {
  loading: true,
  competitor: null,
  firstName: '',
  lastName: '',
  profileUrl: '',
};

export function editCompetitorReducer(
  state: EditCompetitorState,
  action: EditCompetitorAction
): EditCompetitorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_COMPETITOR':
      return {
        ...state,
        competitor: action.payload,
        firstName: action.payload.firstName,
        lastName: action.payload.lastName,
        profileUrl: action.payload.profilePictureUrl,
      };

    case 'SET_FORM_FIELD':
      return {
        ...state,
        [action.field]: action.value,
      };

    default:
      return state;
  }
}
