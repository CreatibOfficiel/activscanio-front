'use client';

import { NextPage } from 'next';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useReducer } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { MdLinkOff } from 'react-icons/md';
import { toast } from 'sonner';

import { useApp } from '@/app/context/AppContext';
import { UpdateCompetitorPayload } from '@/app/models/Competitor';
import { BaseCharacter } from '@/app/models/Character';
import { editCompetitorSchema, EditCompetitorFormData } from '@/app/schemas';
import { Input, Button, PageHeader } from '@/app/components/ui';
import {
  editCompetitorReducer,
  initialState,
} from '@/app/reducers/editCompetitorReducer';
import { useCurrentUserData } from '@/app/hooks/useCurrentUserData';

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
  const { userData, loading: userLoading } = useCurrentUserData();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditCompetitorFormData>({
    resolver: zodResolver(editCompetitorSchema),
    mode: 'onChange',
  });

  const profilePictureUrl = watch('profilePictureUrl');
  const currentVariant = state.competitor?.characterVariant ?? null;

  const isFormComplete = isValid && (currentVariant || state.selectedVariant);

  /* -------------- Initial load -------------- */

  useEffect(() => {
    if (!params.id) return;

    (async () => {
      try {
        const competitor = await getCompetitorById(params.id);
        if (!competitor) throw new Error('Not found');

        dispatch({ type: 'SET_COMPETITOR', payload: competitor });

        // Initialize form values
        setValue('firstName', competitor.firstName);
        setValue('lastName', competitor.lastName);
        setValue('profilePictureUrl', competitor.profilePictureUrl);

        if (!competitor.characterVariant) {
          dispatch({ type: 'SET_LOADING_BC', payload: true });
          const availableChars = await getAvailableBaseCharacters();
          dispatch({ type: 'SET_AVAILABLE_BC', payload: availableChars });
          dispatch({ type: 'SET_LOADING_BC', payload: false });
        }
      } catch (err) {
        toast.error(
          'Erreur de chargement du compétiteur' +
            (err instanceof Error ? `: ${err.message}` : '')
        );
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [params.id, getCompetitorById, getAvailableBaseCharacters, setValue]);

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
      toast.error('Impossible de récupérer les variantes');
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
      toast.error('Erreur lors du déliage');
    } finally {
      dispatch({ type: 'SET_UNLINKING', payload: false });
    }
  };

  /* -------------- Submit -------------- */

  const onSubmit = async (data: EditCompetitorFormData) => {
    if (!state.competitor) return;

    try {
      const payload: UpdateCompetitorPayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        profilePictureUrl: data.profilePictureUrl,
      };

      await updateCompetitor(state.competitor.id, payload);

      if (!currentVariant && state.selectedVariant) {
        await linkCharacterToCompetitor(
          state.competitor.id,
          state.selectedVariant.id
        );
      }

      toast.success('Compétiteur mis à jour !');
      router.back();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  /* -------------- Render -------------- */

  if (state.loading || userLoading) {
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
        <Button
          onClick={() => router.back()}
          className="mt-4"
          variant="primary"
        >
          Retour
        </Button>
      </div>
    );
  }

  if (userData?.competitorId !== params.id) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p className="text-error-400">
          Vous n&apos;avez pas la permission de modifier ce compétiteur.
        </p>
        <Button
          onClick={() => router.back()}
          className="mt-4"
          variant="primary"
        >
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <PageHeader
        variant="flow"
        title="Modifier le compétiteur"
        backHref="/races"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Prénom"
          type="text"
          placeholder="Entrez le prénom"
          error={errors.firstName?.message}
          required
          {...register('firstName')}
        />

        <Input
          label="Nom"
          type="text"
          placeholder="Entrez le nom"
          error={errors.lastName?.message}
          required
          {...register('lastName')}
        />

        <div>
          <Input
            label="Image de profil (URL)"
            type="url"
            placeholder="https://example.com/image.jpg"
            error={errors.profilePictureUrl?.message}
            required
            {...register('profilePictureUrl')}
          />
          {profilePictureUrl && !errors.profilePictureUrl && (
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-500/30">
                <Image
                  src={profilePictureUrl}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
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
              <Button
                type="button"
                variant="error"
                size="sm"
                onClick={handleUnlink}
                disabled={state.unlinking}
                loading={state.unlinking}
                leftIcon={<MdLinkOff className="text-lg" />}
              >
                Délier
              </Button>
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
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!isFormComplete || isSubmitting}
            loading={isSubmitting}
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitorPage;
