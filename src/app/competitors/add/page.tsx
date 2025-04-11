"use client";

import { NextPage } from "next";
import { FormEvent, useContext, useEffect, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { useRouter } from "next/navigation";
import { BaseCharacter, CharacterVariant } from "@/app/models/Character";
import Image from "next/image";

const AddCompetitorPage: NextPage = () => {
  const router = useRouter();
  const { addCompetitor, baseCharacters, getCharacterVariants } =
    useContext(AppContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedBaseCharacter, setSelectedBaseCharacter] =
    useState<BaseCharacter | null>(null);
  const [selectedVariant, setSelectedVariant] =
    useState<CharacterVariant | null>(null);
  const [characterVariants, setCharacterVariants] = useState<
    CharacterVariant[]
  >([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const isUrlValid = (urlStr: string): boolean => {
    const lower = urlStr.trim().toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://"))
      return false;
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

  const isAllValid = (): boolean => {
    if (!firstName.trim() || !lastName.trim()) return false;
    return isUrlValid(url);
  };

  // Load variants when a base character is selected
  useEffect(() => {
    const loadVariants = async () => {
      if (
        (selectedBaseCharacter?.variants?.length ?? 0) > 1 &&
        selectedBaseCharacter?.id
      ) {
        setIsLoadingVariants(true);
        try {
          const variants = await getCharacterVariants(selectedBaseCharacter.id);
          setCharacterVariants(variants);

          if (!selectedVariant && variants.length > 0) {
            setSelectedVariant(variants[0]);
          }
        } catch (error) {
          console.error("Error loading variants:", error);
        } finally {
          setIsLoadingVariants(false);
        }
      } else {
        setCharacterVariants([]);
        setSelectedVariant(null);
      }
    };

    loadVariants();
  }, [selectedBaseCharacter, getCharacterVariants, selectedVariant]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAllValid()) return;

    await addCompetitor({
      id: "",
      firstName,
      lastName,
      profilePictureUrl: url,
      characterVariantId: selectedVariant?.id || undefined,
    });

    alert("Compétiteur ajouté avec succès !");
    router.back();
  };

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Ajouter un·e compétiteur·trice</h1>
      <p className="text-neutral-300 text-regular mb-4">Nouveau astronaute ?</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 text-neutral-300">Prénom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-neutral-300">Nom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 text-neutral-300">
            Image de profil (URL)
          </label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {url && isUrlValid(url) && (
            <div className="mt-2 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={url}
                  alt="Aperçu"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Selection of base character */}
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
                    src={character.imageUrl || ""}
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

        {/* Show variants only if the selected base character has variants */}
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
                      alt={variant.label || ""}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                    <span className="text-xs mt-1">{variant.label || ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            className={`flex-1 p-3 rounded text-bold ${
              isAllValid()
                ? "bg-primary-500 text-neutral-900"
                : "bg-neutral-500 text-neutral-600"
            }`}
          >
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCompetitorPage;
