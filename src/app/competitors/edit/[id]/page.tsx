"use client";

import { NextPage } from "next";
import { FormEvent, useCallback, useContext, useEffect, useState } from "react";
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
    allCompetitors,
    updateCompetitor,
    getAvailableBaseCharacters,
    getAvailableCharacterVariants,
    unlinkCharacterFromCompetitor,
  } = useContext(AppContext);

  // General state
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  // Base character and variant state
  const [availableBaseCharacters, setAvailableBaseCharacters] = useState<
    BaseCharacter[]
  >([]);
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

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBaseCharacters, setIsLoadingBaseCharacters] = useState(true);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  /**
   * Check if the image URL is valid
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
   * Check if all fields are valid
   */
  const isAllValid = (): boolean => {
    if (!firstName.trim() || !lastName.trim()) return false;
    return isUrlValid(profileUrl);
  };

  /**
   * Loads the competitor based on the URL ID,
   * then initializes its information
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
      setIsLoading(false);
    };

    loadCompetitor();
  }, [params.id, allCompetitors]);

  /**
   * Load available base characters
   */
  useEffect(() => {
    const loadAvailableBaseCharacters = async () => {
      if (!competitor) return;

      setIsLoadingBaseCharacters(true);
      try {
        const characters = await getAvailableBaseCharacters();
        setAvailableBaseCharacters(characters);
      } catch (error) {
        console.error("Error loading available base characters:", error);
      } finally {
        setIsLoadingBaseCharacters(false);
      }
    };

    if (competitor) {
      loadAvailableBaseCharacters();
    }
  }, [competitor, getAvailableBaseCharacters]);

  /**
   * Find and load the current BaseCharacter of the competitor if available
   */
  const loadCurrentCharacter = useCallback(async () => {
    if (!competitor?.characterVariantId) return;

    try {
      // Find in the available base characters
      for (const baseChar of availableBaseCharacters) {
        const variantMatch = baseChar.variants.find(
          (v) => v.id === competitor.characterVariantId
        );
        if (variantMatch) {
          setSelectedBaseCharacter(baseChar);
          setCurrentVariant(variantMatch);
          return;
        }
      }

      // If not found, may be the character is already assigned to this competitor
      // Try to load the complete character
      const allBaseChars = await getAvailableBaseCharacters();
      for (const baseChar of allBaseChars) {
        // Variant characters are not fully loaded in allBaseChars, only the IDs
        const variantIds = baseChar.variants.map((v) => v.id);
        if (variantIds.includes(competitor.characterVariantId)) {
          setSelectedBaseCharacter(baseChar);
          // We need to load all variants for the character
          const allVariants = await getAvailableCharacterVariants(
            baseChar.id,
            competitor.id
          );
          const currentVar = allVariants.find(
            (v) => v.id === competitor.characterVariantId
          );
          if (currentVar) {
            setCurrentVariant(currentVar);
            setSelectedVariant(currentVar);
          }
          return;
        }
      }
    } catch (error) {
      console.error("Error loading current character:", error);
    }
  }, [
    competitor,
    availableBaseCharacters,
    getAvailableBaseCharacters,
    getAvailableCharacterVariants,
  ]);

  /**
   * When the available base characters are loaded, we load the current character
   */
  useEffect(() => {
    if (availableBaseCharacters.length > 0 && competitor?.characterVariantId) {
      loadCurrentCharacter();
    }
  }, [availableBaseCharacters, competitor, loadCurrentCharacter]);

  /**
   * Load the variants of the selected base character
   */
  useEffect(() => {
    const loadVariants = async () => {
      if (!selectedBaseCharacter || !selectedBaseCharacter.id) {
        setCharacterVariants([]);
        if (!currentVariant) {
          setSelectedVariant(null);
        }
        return;
      }

      setIsLoadingVariants(true);
      try {
        if (!competitor) return;

        // If editing, we also want to see the character currently assigned
        const competitorId =
          competitor?.characterVariantId === currentVariant?.id
            ? competitor.id
            : undefined;
        const variants = await getAvailableCharacterVariants(
          selectedBaseCharacter.id,
          competitorId
        );
        setCharacterVariants(variants);

        // If the current variant belongs to the same base character, we keep it
        if (
          currentVariant &&
          currentVariant.baseCharacterId === selectedBaseCharacter.id
        ) {
          // Check if it is in the list of available variants
          const matchingVariant = variants.find(
            (v) => v.id === currentVariant.id
          );
          if (matchingVariant) {
            setSelectedVariant(matchingVariant);
          } else {
            // If the current variant is not available, select the first available one
            setSelectedVariant(variants.length > 0 ? variants[0] : null);
          }
        } else if (
          !selectedVariant ||
          selectedVariant.baseCharacterId !== selectedBaseCharacter.id
        ) {
          // If we change base character or have no variant, select the first available one
          setSelectedVariant(variants.length > 0 ? variants[0] : null);
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
    competitor,
    currentVariant,
    getAvailableCharacterVariants,
    selectedVariant,
  ]);

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
      // Update the competitor in the state
      setCompetitor(updatedCompetitor);
      setCurrentVariant(null);
      setSelectedVariant(null);
      setSelectedBaseCharacter(null);

      // Reload available characters
      const characters = await getAvailableBaseCharacters();
      setAvailableBaseCharacters(characters);

      alert("Character successfully unlinked!");
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
    if (!isAllValid() || !competitor) return;

    const updatedCompetitor: Competitor = {
      ...competitor,
      firstName,
      lastName,
      profilePictureUrl: profileUrl,
      characterVariantId: selectedVariant?.id || undefined,
    };

    await updateCompetitor(updatedCompetitor);
    alert("Competitor successfully updated!");
    router.back();
  };

  /**
   * Display loading
   */
  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  /**
   * Display if the competitor does not exist
   */
  if (!competitor) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Competitor not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 p-3 bg-primary-500 text-neutral-900 rounded"
        >
          Back
        </button>
      </div>
    );
  }

  /**
   * Main render: edit form
   */
  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Edit Competitor</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* First Name Field */}
        <div>
          <label className="block mb-1 text-neutral-300">First Name</label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        {/* Last Name Field */}
        <div>
          <label className="block mb-1 text-neutral-300">Last Name</label>
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
            Profile Image (URL)
          </label>
          <input
            type="text"
            className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
          />

          {/* Image preview if URL is provided */}
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

        {/* Current character with unlink button */}
        {currentVariant && (
          <div className="mt-4 p-3 bg-neutral-800 rounded">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-neutral-300 font-semibold">
                  Current Character
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
                <span>Unlink</span>
              </button>
            </div>
          </div>
        )}

        {/* Base character selection */}
        <div className="mt-4">
          <label className="block mb-2 text-neutral-300">
            {currentVariant ? "Change Character" : "Character"}
          </label>
          {isLoadingBaseCharacters ? (
            <p className="text-neutral-500">Loading characters...</p>
          ) : availableBaseCharacters.length === 0 ? (
            <p className="text-neutral-500">No characters available</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {availableBaseCharacters.map((character) => (
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
        </div>

        {/* Variants */}
        {selectedBaseCharacter && characterVariants.length > 0 && (
          <div>
            <label className="block mb-1 text-neutral-300">Variant</label>
            {isLoadingVariants ? (
              <p className="text-neutral-500">Loading variants...</p>
            ) : characterVariants.length === 0 ? (
              <p className="text-neutral-500">No variants available</p>
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

        {/* Action buttons */}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 p-3 bg-transparent border-2 border-primary-500 rounded text-primary-500"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 p-3 rounded text-bold ${
              isAllValid()
                ? "bg-primary-500 text-neutral-900"
                : "bg-neutral-500 text-neutral-600"
            }`}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitorPage;
