'use client';

import { NextPage } from 'next';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useReducer } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';

import { useApp } from '@/app/context/AppContext';
import { UpdateCompetitorPayload } from '@/app/models/Competitor';
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
      } catch (err) {
        toast.error(
          'Erreur de chargement du compétiteur' +
            (err instanceof Error ? `: ${err.message}` : '')
        );
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [params.id, getCompetitorById, setValue]);

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
            disabled={!isValid || isSubmitting}
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
