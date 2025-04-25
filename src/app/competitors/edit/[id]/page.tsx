'use client';

import { NextPage } from 'next';
import { useRouter, useParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { MdLinkOff } from 'react-icons/md';

import { useApp } from '@/app/context/AppContext';
import {
  Competitor,
  UpdateCompetitorPayload,
} from '@/app/models/Competitor';
import { BaseCharacter, CharacterVariant } from '@/app/models/Character';

/* ---------------------------------------------------- */

const EditCompetitorPage: NextPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const {
    updateCompetitor,
    linkCharacterToCompetitor,
    unlinkCharacterFromCompetitor,
    getAvailableBaseCharacters,
    getAvailableVariantsForBaseCharacter,
  } = useApp();

  /* -------------- State -------------- */

  const [loading, setLoading] = useState(true);
  const [competitor, setCompetitor] = useState<Competitor | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  const currentVariant = competitor?.characterVariant ?? null;

  /* Sélection personnage */
  const [availableBC, setAvailableBC] = useState<BaseCharacter[]>([]);
  const [selectedBC, setSelectedBC] = useState<BaseCharacter | null>(null);
  const [variantsOfSelected, setVariantsOfSelected] = useState<CharacterVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<CharacterVariant | null>(null);

  const [loadingBC, setLoadingBC] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  /* -------------- Helpers -------------- */

  const isUrlValid = (url: string) =>
    /^(https?:\/\/).+\.(png|jpe?g|webp)$/.test(url.trim().toLowerCase());

  const isAllValid = () =>
    firstName.trim() &&
    lastName.trim() &&
    isUrlValid(profileUrl) &&
    (currentVariant || selectedVariant);

  /* -------------- Initial charge -------------- */

  useEffect(() => {
    if (!params.id) return;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitors/${params.id}`,
        );
        if (!res.ok) throw new Error('Not found');
        const data: Competitor = await res.json();
        setCompetitor(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setProfileUrl(data.profilePictureUrl);

        if (!data.characterVariant) {
          setLoadingBC(true);
          setAvailableBC(await getAvailableBaseCharacters());
          setLoadingBC(false);
        }
      } catch (err) {
        alert('Erreur de chargement du compétiteur' + (err instanceof Error ? `: ${err.message}` : ''));
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, getAvailableBaseCharacters]);

  /* -------------- Sélection BC -------------- */

  const handleSelectBC = async (bc: BaseCharacter) => {
    if (selectedBC?.id === bc.id) {
      setSelectedBC(null);
      setVariantsOfSelected([]);
      setSelectedVariant(null);
      return;
    }

    setSelectedBC(bc);
    setLoadingVariants(true);
    try {
      const vars = await getAvailableVariantsForBaseCharacter(bc.id);
      setVariantsOfSelected(vars);
      setSelectedVariant(vars.length === 1 ? vars[0] : null);
    } catch {
      alert('Impossible de récupérer les variantes');
    } finally {
      setLoadingVariants(false);
    }
  };

  /* -------------- Unlink -------------- */

  const handleUnlink = async () => {
    if (!competitor) return;
    setUnlinking(true);
    try {
      const updated = await unlinkCharacterFromCompetitor(competitor.id);
      setCompetitor(updated);
      setSelectedBC(null);
      setSelectedVariant(null);
      setVariantsOfSelected([]);
      setLoadingBC(true);
      setAvailableBC(await getAvailableBaseCharacters());
      setLoadingBC(false);
    } catch {
      alert('Erreur lors du déliage');
    } finally {
      setUnlinking(false);
    }
  };

  /* -------------- Submit -------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!competitor || !isAllValid()) return;

    // 1. Mise à jour des champs simples
    const payload: UpdateCompetitorPayload = {
      firstName,
      lastName,
      profilePictureUrl: profileUrl,
    };
    await updateCompetitor(competitor.id, payload);

    // 2. Lien du personnage si nécessaire
    if (!currentVariant && selectedVariant) {
      await linkCharacterToCompetitor(competitor.id, selectedVariant.id);
    }

    alert('Mis à jour !');
    router.back();
  };

  /* -------------- Render -------------- */

  if (loading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Chargement…</p>
      </div>
    );
  }
  if (!competitor) {
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
        {/* Prénom */}
        <div>
          <label className="block mb-1 text-neutral-300">Prénom</label>
          <input type="text" className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        {/* Nom */}
        <div>
          <label className="block mb-1 text-neutral-300">Nom</label>
          <input type="text" className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        {/* Image URL */}
        <div>
          <label className="block mb-1 text-neutral-300">Image de profil (URL)</label>
          <input type="text" className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} />
          {profileUrl && (
            <div className="mt-2 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image src={isUrlValid(profileUrl) ? profileUrl : "/placeholder.png"} alt="Preview" width={64} height={64} className="object-cover w-full h-full" />
              </div>
            </div>
          )}
        </div>

        {/* Personnage lié */}
        {currentVariant && (
          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-neutral-300 font-semibold">Personnage lié</h3>
                <p className="text-neutral-200">
                  {currentVariant.baseCharacter.name}
                  {currentVariant.label && currentVariant.label !== "Default" && ` – ${currentVariant.label}`}
                </p>
              </div>
              <button type="button" className="p-2 bg-red-700 hover:bg-red-600 rounded flex items-center gap-1" onClick={handleUnlink} disabled={unlinking}>
                <MdLinkOff className="text-lg" />
                <span>Délier</span>
              </button>
            </div>
          </div>
        )}

        {/* Sélection */}
        {!currentVariant && (
          <>
            <div className="mt-4">
              <label className="block mb-2 text-neutral-300">Personnage</label>
              {loadingBC ? (
                <p className="text-neutral-500">Chargement…</p>
              ) : availableBC.length === 0 ? (
                <p className="text-neutral-500">Aucun disponible</p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {availableBC.map((bc) => (
                    <div key={bc.id} onClick={() => handleSelectBC(bc)} className={`p-2 rounded cursor-pointer ${selectedBC?.id === bc.id ? "bg-primary-500 text-neutral-900" : "bg-neutral-800 hover:bg-neutral-700"}`}> {bc.name} </div>
                  ))}
                </div>
              )}
            </div>
            {selectedBC && variantsOfSelected.length > 1 && (
              <div>
                <label className="block mb-1 text-neutral-300">Variantes</label>
                {loadingVariants ? (
                  <p className="text-neutral-500">Chargement…</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {variantsOfSelected.map((v) => (
                      <div key={v.id} onClick={() => setSelectedVariant(v)} className={`p-2 rounded cursor-pointer ${selectedVariant?.id === v.id ? "bg-primary-500 text-neutral-900" : "bg-neutral-800 hover:bg-neutral-700"}`}>{v.label}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-2">
          <button type="button" className="flex-1 p-3 bg-transparent border-2 border-primary-500 rounded text-primary-500" onClick={() => router.back()}>Annuler</button>
          <button type="submit" disabled={!isAllValid()} className={`flex-1 p-3 rounded font-bold ${isAllValid() ? "bg-primary-500 text-neutral-900" : "bg-neutral-500 text-neutral-600"}`}>Enregistrer</button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitorPage;