import { Competitor } from '../models/Competitor';
import { BaseCharacter, CharacterVariant } from '../models/Character';

export interface EditCompetitorState {
  // Loading states
  loading: boolean;
  loadingBC: boolean;
  loadingVariants: boolean;
  unlinking: boolean;

  // Data
  competitor: Competitor | null;

  // Form fields
  firstName: string;
  lastName: string;
  profileUrl: string;

  // Character selection
  availableBC: BaseCharacter[];
  selectedBC: BaseCharacter | null;
  variantsOfSelected: CharacterVariant[];
  selectedVariant: CharacterVariant | null;
}

export type EditCompetitorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_BC'; payload: boolean }
  | { type: 'SET_LOADING_VARIANTS'; payload: boolean }
  | { type: 'SET_UNLINKING'; payload: boolean }
  | { type: 'SET_COMPETITOR'; payload: Competitor }
  | { type: 'SET_FORM_FIELD'; field: 'firstName' | 'lastName' | 'profileUrl'; value: string }
  | { type: 'SET_AVAILABLE_BC'; payload: BaseCharacter[] }
  | { type: 'SET_SELECTED_BC'; payload: BaseCharacter | null }
  | { type: 'SET_VARIANTS'; payload: CharacterVariant[] }
  | { type: 'SET_SELECTED_VARIANT'; payload: CharacterVariant | null }
  | { type: 'RESET_CHARACTER_SELECTION' };

export const initialState: EditCompetitorState = {
  loading: true,
  loadingBC: false,
  loadingVariants: false,
  unlinking: false,
  competitor: null,
  firstName: '',
  lastName: '',
  profileUrl: '',
  availableBC: [],
  selectedBC: null,
  variantsOfSelected: [],
  selectedVariant: null,
};

export function editCompetitorReducer(
  state: EditCompetitorState,
  action: EditCompetitorAction
): EditCompetitorState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_LOADING_BC':
      return { ...state, loadingBC: action.payload };

    case 'SET_LOADING_VARIANTS':
      return { ...state, loadingVariants: action.payload };

    case 'SET_UNLINKING':
      return { ...state, unlinking: action.payload };

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

    case 'SET_AVAILABLE_BC':
      return { ...state, availableBC: action.payload };

    case 'SET_SELECTED_BC':
      return { ...state, selectedBC: action.payload };

    case 'SET_VARIANTS':
      return { ...state, variantsOfSelected: action.payload };

    case 'SET_SELECTED_VARIANT':
      return { ...state, selectedVariant: action.payload };

    case 'RESET_CHARACTER_SELECTION':
      return {
        ...state,
        selectedBC: null,
        variantsOfSelected: [],
        selectedVariant: null,
      };

    default:
      return state;
  }
}
