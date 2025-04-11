"use client";

import { NextPage } from "next";
import { FormEvent, useCallback, useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { BaseCharacter, CharacterVariant } from "@/app/models/Character";

const EditCompetitorPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();

  const {
    allCompetitors,
    updateCompetitor,
    baseCharacters,
    getCharacterVariants,
  } = useContext(AppContext);

  // État général
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // État pour la sélection du personnage
  const [selectedBaseCharacter, setSelectedBaseCharacter] =
    useState<BaseCharacter | null>(null);
  const [selectedVariant, setSelectedVariant] =
    useState<CharacterVariant | null>(null);
  const [characterVariants, setCharacterVariants] = useState<
    CharacterVariant[]
  >([]);

  // État de chargement
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  /**
   * Vérifie si un URL d'image est valide
   */
  const isUrlValid = (url: string): boolean => {
    const lower = url.trim().toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return false;
    }
    if (
      !(
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".webp")
      )
    ) {
      return false;
    }
    return true;
  };

  /**
   * Vérifie la validité des champs du formulaire
   */
  const isAllValid = (): boolean => {
    if (!firstName.trim() || !lastName.trim()) return false;
    return isUrlValid(profileUrl);
  };

  /**
   * Trouve le BaseCharacter associé à un Competitor
   */
  const findBaseCharacterForCompetitor = useCallback(
    (comp: Competitor): BaseCharacter | null => {
      if (!comp.characterVariantId) return null;

      for (const bc of baseCharacters) {
        if (bc.variants.length > 0) {
          const variantIds = bc.variants.map((v) => v.id);
          if (variantIds.includes(comp.characterVariantId)) {
            return bc;
          }
        }
      }

      return null;
    },
    [baseCharacters]
  );

  /**
   * Charge le compétiteur en fonction de l'ID de l'URL,
   * puis initialise ses informations et son personnage.
   */
  useEffect(() => {
    const loadCompetitor = () => {
      if (!params.id || allCompetitors.length === 0) return;

      const comp = allCompetitors.find((c) => c.id === params.id);
      if (!comp) {
        setIsLoading(false);
        return;
      }

      setCompetitor(comp);
      setFirstName(comp.firstName);
      setLastName(comp.lastName);
      setProfileUrl(comp.profilePictureUrl);

      // On récupère le BaseCharacter correspondant
      if (comp.characterVariantId) {
        const baseChar = findBaseCharacterForCompetitor(comp);
        if (baseChar) {
          setSelectedBaseCharacter(baseChar);
        }
      }
      setIsLoading(false);
    };

    loadCompetitor();
  }, [params.id, allCompetitors, findBaseCharacterForCompetitor]);

  /**
   * Charge les variantes du personnage sélectionné
   * (si le personnage possède plusieurs variantes).
   * Puis sélectionne la bonne variante si le compétiteur en a une.
   */
  useEffect(() => {
    const loadVariants = async () => {
      if (
        !selectedBaseCharacter ||
        selectedBaseCharacter.variants.length <= 1
      ) {
        // Si le perso n'a pas de variantes multiples, on reset la liste et la sélection
        setCharacterVariants([]);
        setSelectedVariant(null);
        return;
      }

      setIsLoadingVariants(true);
      try {
        const variants = await getCharacterVariants(selectedBaseCharacter.id);
        setCharacterVariants(variants);

        // Tenter de retrouver la variante du compétiteur
        if (competitor?.characterVariantId) {
          const matchingVariant = variants.find(
            (v) => v.id === competitor.characterVariantId
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant);
          } else if (variants.length > 0) {
            // Si la variante n'existe plus, on sélectionne la première
            setSelectedVariant(variants[0]);
          }
        } else if (!selectedVariant && variants.length > 0) {
          // Si le compétiteur n'a pas de variante ou qu'on n'en a pas défini,
          // on sélectionne par défaut la première
          setSelectedVariant(variants[0]);
        }
      } catch (error) {
        console.error("Error loading variants:", error);
      } finally {
        setIsLoadingVariants(false);
      }
    };

    loadVariants();
  }, [
    selectedBaseCharacter,
    getCharacterVariants,
    competitor,
    selectedVariant,
  ]);

  /**
   * Soumission du formulaire : met à jour le compétiteur
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAllValid() || !competitor) return;

    const updatedCompetitor: Competitor = {
      ...competitor,
      firstName,
      lastName,
      profilePictureUrl: profileUrl,
      characterVariantId: selectedVariant?.id || undefined,
    };

    await updateCompetitor(updatedCompetitor);
    alert("Compétiteur modifié avec succès !");
    router.back();
  };

  /**
   * Affichage du chargement
   */
  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

  /**
   * Affichage si le compétiteur n'existe pas
   */
  if (!competitor) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Compétiteur non trouvé</p>
        <button
          onClick={() => router.back()}
          className="mt-4 p-3 bg-primary-500 text-neutral-900 rounded"
        >
          Retour
        </button>
      </div>
    );
  }

  /**
   * Rendu principal : formulaire d'édition
   */
  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Modifier le compétiteur</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Champ Prénom */}
        <div>
          <label className="block mb-1 text-neutral-300">Prénom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Champ Nom */}
        <div>
          <label className="block mb-1 text-neutral-300">Nom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Champ Image de profil */}
        <div>
          <label className="block mb-1 text-neutral-300">
            Image de profil (URL)
          </label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
          />

          {/* Aperçu de l'image si on a une URL */}
          {profileUrl && (
            <div className="mt-2 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={isUrlValid(profileUrl) ? profileUrl : "/placeholder.png"}
                  alt="Aperçu"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sélection du personnage de base */}
        <div className="mt-4">
          <label className="block mb-2 text-neutral-300">Personnage</label>
          {baseCharacters.length === 0 ? (
            <p className="text-neutral-500">Aucun personnage disponible</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {baseCharacters.map((character) => (
                <div
                  key={character.id}
                  onClick={() =>
                    setSelectedBaseCharacter(
                      selectedBaseCharacter?.id === character.id
                        ? null
                        : character
                    )
                  }
                  className={`
                    p-2 rounded cursor-pointer flex flex-col items-center
                    ${
                      selectedBaseCharacter?.id === character.id
                        ? "bg-primary-500 text-neutral-900"
                        : "bg-neutral-800 hover:bg-neutral-700"
                    }
                  `}
                >
                  <Image
                    src={character.imageUrl}
                    alt={character.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <span className="text-xs mt-1">{character.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variantes (uniquement si le personnage a plusieurs variantes) */}
        {(selectedBaseCharacter?.variants.length ?? 0) > 1 && (
          <div>
            <label className="block mb-1 text-neutral-300">Variante</label>
            {isLoadingVariants ? (
              <p className="text-neutral-500">Chargement des variantes...</p>
            ) : characterVariants.length === 0 ? (
              <p className="text-neutral-500">Aucune variante disponible</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {characterVariants.map((variant) => (
                  <div
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`
                      p-2 rounded cursor-pointer flex flex-col items-center
                      ${
                        selectedVariant?.id === variant.id
                          ? "bg-primary-500 text-neutral-900"
                          : "bg-neutral-800 hover:bg-neutral-700"
                      }
                    `}
                  >
                    <Image
                      src={variant.imageUrl}
                      alt={variant.label}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                    <span className="text-xs mt-1">{variant.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
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
            className={`flex-1 p-3 rounded text-bold ${
              isAllValid()
                ? "bg-primary-500 text-neutral-900"
                : "bg-neutral-500 text-neutral-600"
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
