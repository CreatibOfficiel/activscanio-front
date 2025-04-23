"use client";

import { NextPage } from "next";
import { FormEvent, useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

import { AppContext } from "@/app/context/AppContext";
import { Competitor } from "@/app/models/Competitor";
import { BaseCharacter, CharacterVariant } from "@/app/models/Character";
import { MdLinkOff } from "react-icons/md";

const EditCompetitorPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();

  const {
    // From context
    baseCharacters,                // Used to detect the competitor's character if they have one
    updateCompetitor,
    unlinkCharacterFromCompetitor,
    getAvailableBaseCharacters,    // Loads the list of characters if the user doesn't have one linked
    getAvailableVariantsForBaseCharacter, // Loads the variants of a character
  } = useContext(AppContext);

  // General state of the competitor
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // Local state for the list of baseCharacters to display (if the user doesn't have a linked character)
  const [availableBaseCharacters, setAvailableBaseCharacters] = useState<
    BaseCharacter[]
  >([]);

  // Selected base character and variant in the UI
  const [selectedBaseCharacter, setSelectedBaseCharacter] =
    useState<BaseCharacter | null>(null);
  const [selectedVariant, setSelectedVariant] =
    useState<CharacterVariant | null>(null);
  const [characterVariants, setCharacterVariants] = useState<
    CharacterVariant[]
  >([]);
  const [currentVariant, setCurrentVariant] = useState<CharacterVariant | null>(
    null
  );

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBaseCharacters, setIsLoadingBaseCharacters] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  /**
   * Checks if the image URL is valid
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
   * Checks if all required fields are valid
   * and disables the button if a character has multiple variants but none is selected.
   */
  const isAllValid = (): boolean => {
    // Checks first name, last name, and URL
    if (!firstName.trim() || !lastName.trim() || !isUrlValid(profileUrl)) {
      return false;
    }

    // Ensures a variant is selected if multiple variants are available
    if (
      selectedBaseCharacter &&
      selectedBaseCharacter.variants &&
      selectedBaseCharacter.variants.length > 1 &&
      !selectedVariant
    ) {
      return false;
    }

    return true;
  };

  /**
   * Fetches the competitor by id
   */
  useEffect(() => {
    if (!competitor && params.id) {
      setIsLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/competitors/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => {
          setCompetitor({
            ...data,
            characterVariantId: data.characterVariant?.id,
          });
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setProfileUrl(data.profilePictureUrl);
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          alert("Error loading competitor: " + err.message);
        });
    }
  }, [competitor, params.id]);

  /**
   * If the competitor already has a characterVariant,
   * we use the "baseCharacters" array from context to find that character and its variant.
   * Otherwise, we load the list of available characters via getAvailableBaseCharacters.
   */
  useEffect(() => {
    if (!competitor) return;

    if (competitor.characterVariantId) {
      // => The competitor has a linked character, find it in baseCharacters
      if (baseCharacters.length === 0) return;

      const foundBaseChar = baseCharacters.find((bc) =>
        bc.variants?.some((v) => v.id === competitor.characterVariantId)
      );
      const foundVariantChar = baseCharacters
        .flatMap((bc) => bc.variants)
        .find((v) => v.id === competitor.characterVariantId);

      // Update the UI
      setSelectedBaseCharacter(foundBaseChar ?? null);
      setSelectedVariant(foundVariantChar ?? null);
      setCurrentVariant(foundVariantChar ?? null);
      setCharacterVariants(foundBaseChar?.variants ?? []);
    } else {
      // => The competitor does not have a base character/variant
      // Load the list of characters from the API
      const loadAvailableBC = async () => {
        setIsLoadingBaseCharacters(true);
        try {
          const characters = await getAvailableBaseCharacters();
          setAvailableBaseCharacters(characters);
        } catch (error) {
          console.error("Error loading base characters:", error);
        } finally {
          setIsLoadingBaseCharacters(false);
        }
      };
      loadAvailableBC();
    }
  }, [competitor, baseCharacters, getAvailableBaseCharacters]);

  /**
   * Handles selecting a base character from the loaded list
   * (case where the competitor has no character yet).
   * Calls getAvailableVariantsForBaseCharacter to fetch up-to-date variants.
   */
  const handleSelectBaseCharacter = async (character: BaseCharacter) => {
    if (selectedBaseCharacter?.id === character.id) {
      // Deselect if clicking the same one
      setSelectedBaseCharacter(null);
      setSelectedVariant(null);
      setCharacterVariants([]);
      return;
    }
    setSelectedBaseCharacter(character);

    // Load variants from the API to ensure we have the latest list
    setIsLoadingVariants(true);
    try {
      const variants = await getAvailableVariantsForBaseCharacter(character.id);
      setCharacterVariants(variants);
      if (variants.length === 1) {
        // If there is only one variant, select it automatically
        setSelectedVariant(variants[0]);
      } else {
        // Otherwise, wait for the user to choose one
        setSelectedVariant(null);
      }
    } catch (error) {
      console.error("Error loading variants from server:", error);
      alert("Unable to load variants for this character");
    } finally {
      setIsLoadingVariants(false);
    }
  };

  /**
   * Unlink the character from the competitor
   */
  const handleUnlinkCharacter = async () => {
    if (!competitor || !competitor.characterVariantId) return;

    setIsUnlinking(true);
    try {
      const updatedCompetitor = await unlinkCharacterFromCompetitor(
        competitor.id
      );
      // Clean up local state
      setCompetitor(updatedCompetitor);
      setCurrentVariant(null);
      setSelectedVariant(null);
      setSelectedBaseCharacter(null);

      // In this case, reload the list of available characters
      setIsLoadingBaseCharacters(true);
      try {
        const characters = await getAvailableBaseCharacters();
        setAvailableBaseCharacters(characters);
      } catch (error) {
        console.error("Error re-loading base characters:", error);
      } finally {
        setIsLoadingBaseCharacters(false);
      }

      alert("Character unlinked successfully!");
    } catch (error) {
      console.error("Error unlinking character:", error);
      alert("Error unlinking character");
    } finally {
      setIsUnlinking(false);
    }
  };

  /**
   * Form submission: update the competitor
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!competitor) return;
    if (!isAllValid()) return;

    const updatedCompetitor: Competitor = {
      ...competitor,
      firstName,
      lastName,
      profilePictureUrl: profileUrl,
      characterVariantId: selectedVariant?.id || undefined,
    };

    await updateCompetitor(updatedCompetitor);
    alert("Competitor updated successfully!");
    router.back();
  };

  /**
   * Loading screen for the competitor
   */
  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Loading competitor...</p>
      </div>
    );
  }

  /**
   * Competitor not found
   */
  if (!competitor) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Competitor not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 p-3 bg-primary-500 text-neutral-900 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  /**
   * Main render: the edit form
   */
  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Modifier le compétiteur</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* First Name Field */}
        <div>
          <label className="block mb-1 text-neutral-300">Prénom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name Field */}
        <div>
          <label className="block mb-1 text-neutral-300">Nom</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        {/* Profile Image Field */}
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

          {/* Preview of the image if URL is provided */}
          {profileUrl && (
            <div className="mt-2 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={isUrlValid(profileUrl) ? profileUrl : "/placeholder.png"}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Current character, with unlink button */}
        {currentVariant && (
          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-neutral-300 font-semibold">
                  Personnage lié
                </h3>
                <p className="text-neutral-200">
                  {selectedBaseCharacter?.name} - {currentVariant.label}
                </p>
              </div>
              <button
                type="button"
                className="p-2 bg-red-700 hover:bg-red-600 rounded flex items-center gap-1"
                onClick={handleUnlinkCharacter}
                disabled={isUnlinking}
              >
                <MdLinkOff className="text-lg" />
                <span>Délier</span>
              </button>
            </div>
          </div>
        )}

        {/* If the competitor doesn’t have a linked character yet, show the selection */}
        {!currentVariant && (
          <>
            <div className="mt-4">
              <label className="block mb-2 text-neutral-300">Personnage</label>
              {isLoadingBaseCharacters ? (
                <p className="text-neutral-500">Loading characters...</p>
              ) : (
                <>
                  {availableBaseCharacters.length === 0 ? (
                    <p className="text-neutral-500">
                      No characters available
                    </p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {availableBaseCharacters.map((character) => (
                        <div
                          key={character.id}
                          onClick={() => handleSelectBaseCharacter(character)}
                          className={`
                            p-2 rounded cursor-pointer items-center
                            ${
                              selectedBaseCharacter?.id === character.id
                                ? "bg-primary-500 text-neutral-900"
                                : "bg-neutral-800 hover:bg-neutral-700"
                            }
                          `}
                        >
                          <span className="text-xs mt-1">{character.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Variants */}
            {selectedBaseCharacter &&
              characterVariants.length > 1 && (
                <div>
                  <label className="block mb-1 text-neutral-300">
                    Variantes
                  </label>
                  {isLoadingVariants ? (
                    <p className="text-neutral-500">
                      Loading variants...
                    </p>
                  ) : characterVariants.length === 0 ? (
                    <p className="text-neutral-500">
                      No variants available
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {characterVariants.map((variant) => (
                        <div
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`
                            p-2 rounded cursor-pointer items-center
                            ${
                              selectedVariant?.id === variant.id
                                ? "bg-primary-500 text-neutral-900"
                                : "bg-neutral-800 hover:bg-neutral-700"
                            }
                          `}
                        >
                          <span className="text-xs mt-1">{variant.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </>
        )}

        {/* Action buttons */}
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
            disabled={!isAllValid()}
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
