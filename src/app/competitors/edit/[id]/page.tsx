'use client';

import { NextPage } from 'next';
import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useEffect, useReducer } from 'react';
import Image from 'next/image';
import { MdLinkOff } from 'react-icons/md';

import { useApp } from '@/app/context/AppContext';
import { UpdateCompetitorPayload } from '@/app/models/Competitor';
import { BaseCharacter } from '@/app/models/Character';
import { validateImageUrl, validateCompetitorName } from '@/app/utils/validators';
import {
  editCompetitorReducer,
  initialState,
} from '@/app/reducers/editCompetitorReducer';

const EditCompetitorPage: NextPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const {
    getCompetitorById,
    updateCompetitor,
    linkCharacterToCompetitor,
    unlinkCharacterFromCompetitor,
    getAvailableBaseCharacters,
    getAvailableVariantsForBaseCharacter,
  } = useApp();

  const [state, dispatch] = useReducer(editCompetitorReducer, initialState);

  const currentVariant = state.competitor?.characterVariant ?? null;

  const isFormValid = () =>
    validateCompetitorName(state.firstName) &&
    validateCompetitorName(state.lastName) &&
    validateImageUrl(state.profileUrl) &&
    (currentVariant || state.selectedVariant);

  /* -------------- Initial load -------------- */

  useEffect(() => {
    if (!params.id) return;

    (async () => {
      try {
        const competitor = await getCompetitorById(params.id);
        if (!competitor) throw new Error('Not found');

        dispatch({ type: 'SET_COMPETITOR', payload: competitor });

        if (!competitor.characterVariant) {
          dispatch({ type: 'SET_LOADING_BC', payload: true });
          const availableChars = await getAvailableBaseCharacters();
          dispatch({ type: 'SET_AVAILABLE_BC', payload: availableChars });
          dispatch({ type: 'SET_LOADING_BC', payload: false });
        }
      } catch (err) {
        alert(
          'Erreur de chargement du compétiteur' +
            (err instanceof Error ? `: ${err.message}` : '')
        );
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [params.id, getCompetitorById, getAvailableBaseCharacters]);

  /* -------------- Character selection -------------- */

  const handleSelectBC = async (bc: BaseCharacter) => {
    if (state.selectedBC?.id === bc.id) {
      dispatch({ type: 'RESET_CHARACTER_SELECTION' });
      return;
    }

    dispatch({ type: 'SET_SELECTED_BC', payload: bc });
    dispatch({ type: 'SET_LOADING_VARIANTS', payload: true });

    try {
      const vars = await getAvailableVariantsForBaseCharacter(bc.id);
      dispatch({ type: 'SET_VARIANTS', payload: vars });
      dispatch({
        type: 'SET_SELECTED_VARIANT',
        payload: vars.length === 1 ? vars[0] : null,
      });
    } catch {
      alert('Impossible de récupérer les variantes');
    } finally {
      dispatch({ type: 'SET_LOADING_VARIANTS', payload: false });
    }
  };

  /* -------------- Unlink character -------------- */

  const handleUnlink = async () => {
    if (!state.competitor) return;

    dispatch({ type: 'SET_UNLINKING', payload: true });

    try {
      const updated = await unlinkCharacterFromCompetitor(state.competitor.id);
      dispatch({ type: 'SET_COMPETITOR', payload: updated });
      dispatch({ type: 'RESET_CHARACTER_SELECTION' });

      dispatch({ type: 'SET_LOADING_BC', payload: true });
      const availableChars = await getAvailableBaseCharacters();
      dispatch({ type: 'SET_AVAILABLE_BC', payload: availableChars });
      dispatch({ type: 'SET_LOADING_BC', payload: false });
    } catch {
      alert('Erreur lors du déliage');
    } finally {
      dispatch({ type: 'SET_UNLINKING', payload: false });
    }
  };

  /* -------------- Submit -------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.competitor || !isFormValid()) return;

    const payload: UpdateCompetitorPayload = {
      firstName: state.firstName,
      lastName: state.lastName,
      profilePictureUrl: state.profileUrl,
    };

    await updateCompetitor(state.competitor.id, payload);

    if (!currentVariant && state.selectedVariant) {
      await linkCharacterToCompetitor(
        state.competitor.id,
        state.selectedVariant.id
      );
    }

    alert('Mis à jour !');
    router.back();
  };

  /* -------------- Render -------------- */

  if (state.loading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Chargement…</p>
      </div>
    );
  }

  if (!state.competitor) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Compétiteur introuvable.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 p-3 bg-primary-500 text-neutral-900 rounded"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Modifier le compétiteur</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-neutral-300">Prénom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={state.firstName}
            onChange={(e) =>
              dispatch({
                type: 'SET_FORM_FIELD',
                field: 'firstName',
                value: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block mb-1 text-neutral-300">Nom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={state.lastName}
            onChange={(e) =>
              dispatch({
                type: 'SET_FORM_FIELD',
                field: 'lastName',
                value: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block mb-1 text-neutral-300">
            Image de profil (URL)
          </label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={state.profileUrl}
            onChange={(e) =>
              dispatch({
                type: 'SET_FORM_FIELD',
                field: 'profileUrl',
                value: e.target.value,
              })
            }
          />
          {state.profileUrl && (
            <div className="mt-2 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={
                    validateImageUrl(state.profileUrl)
                      ? state.profileUrl
                      : '/placeholder.png'
                  }
                  alt="Preview"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {currentVariant && (
          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-neutral-300 font-semibold">
                  Personnage lié
                </h3>
                <p className="text-neutral-200">
                  {currentVariant.baseCharacter.name}
                  {currentVariant.label &&
                    currentVariant.label !== 'Default' &&
                    ` – ${currentVariant.label}`}
                </p>
              </div>
              <button
                type="button"
                className="p-2 bg-red-700 hover:bg-red-600 rounded flex items-center gap-1"
                onClick={handleUnlink}
                disabled={state.unlinking}
              >
                <MdLinkOff className="text-lg" />
                <span>Délier</span>
              </button>
            </div>
          </div>
        )}

        {!currentVariant && (
          <>
            <div className="mt-4">
              <label className="block mb-2 text-neutral-300">Personnage</label>
              {state.loadingBC ? (
                <p className="text-neutral-500">Chargement…</p>
              ) : state.availableBC.length === 0 ? (
                <p className="text-neutral-500">Aucun disponible</p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {state.availableBC.map((bc) => (
                    <div
                      key={bc.id}
                      onClick={() => handleSelectBC(bc)}
                      className={`p-2 rounded cursor-pointer ${
                        state.selectedBC?.id === bc.id
                          ? 'bg-primary-500 text-neutral-900'
                          : 'bg-neutral-800 hover:bg-neutral-700'
                      }`}
                    >
                      {bc.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {state.selectedBC && state.variantsOfSelected.length > 1 && (
              <div>
                <label className="block mb-1 text-neutral-300">Variantes</label>
                {state.loadingVariants ? (
                  <p className="text-neutral-500">Chargement…</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {state.variantsOfSelected.map((v) => (
                      <div
                        key={v.id}
                        onClick={() =>
                          dispatch({ type: 'SET_SELECTED_VARIANT', payload: v })
                        }
                        className={`p-2 rounded cursor-pointer ${
                          state.selectedVariant?.id === v.id
                            ? 'bg-primary-500 text-neutral-900'
                            : 'bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      >
                        {v.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 p-3 bg-transparent border-2 border-primary-500 rounded text-primary-500"
            onClick={() => router.back()}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`flex-1 p-3 rounded font-bold ${
              isFormValid()
                ? 'bg-primary-500 text-neutral-900'
                : 'bg-neutral-500 text-neutral-600'
            }`}
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitorPage;
