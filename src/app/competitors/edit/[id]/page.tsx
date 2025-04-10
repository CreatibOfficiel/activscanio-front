"use client";

import { NextPage } from "next";
import { FormEvent, useContext, useEffect, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { useRouter, useParams } from "next/navigation";
import { Competitor } from "@/app/models/Competitor";
import { Character } from "@/app/models/Character";
import Image from "next/image";

const EditCompetitorPage: NextPage = () => {
  const router = useRouter();
  const params = useParams();
  const { allCompetitors, updateCompetitor } = useContext(AppContext);
  
  const [competitor, setCompetitor] = useState<Competitor | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterVariant, setCharacterVariant] = useState("Standard");
  const [isLoading, setIsLoading] = useState(true);

  // Récupère le compétiteur à éditer
  useEffect(() => {
    if (params.id && allCompetitors.length > 0) {
      const comp = allCompetitors.find(c => c.id === params.id);
      if (comp) {
        setCompetitor(comp);
        setFirstName(comp.firstName);
        setLastName(comp.lastName);
        setProfileUrl(comp.profilePictureUrl);
        
        if (comp.character) {
          setSelectedCharacter(comp.character);
          setCharacterVariant(comp.character.variant);
        }
      }
      setIsLoading(false);
    }
  }, [params.id, allCompetitors]);

  const isUrlValid = (url: string): boolean => {
    const lower = url.trim().toLowerCase();
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
    return isUrlValid(profileUrl);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAllValid() || !competitor) return;

    // Mise à jour du compétiteur
    const updatedCompetitor: Competitor = {
      ...competitor,
      firstName,
      lastName,
      profilePictureUrl: profileUrl,
      character: selectedCharacter 
        ? {
            ...selectedCharacter,
            variant: characterVariant
          }
        : undefined
    };

    await updateCompetitor(updatedCompetitor);
    alert("Compétiteur modifié avec succès !");
    router.back();
  };

  // Sélection d'un personnage
  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen">
        <p>Chargement...</p>
      </div>
    );
  }

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

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <h1 className="text-title mb-4">Modifier le compétiteur</h1>
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
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
          />
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
        
        {/* Sélection du personnage */}
        <div className="mt-4">
          <label className="block mb-2 text-neutral-300">Personnage</label>
          <div className="grid grid-cols-5 gap-2">
            {/* Suppression de l'affichage des personnages par défaut */}
            {selectedCharacter ? (
              <div 
                onClick={() => setSelectedCharacter(null)} // Permet de désélectionner le personnage
                className={`
                  p-2 rounded cursor-pointer flex flex-col items-center
                  bg-primary-500 text-neutral-900
                `}
              >
                <Image 
                  src={selectedCharacter.imageUrl}
                  alt={selectedCharacter.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <span className="text-xs mt-1">{selectedCharacter.name}</span>
              </div>
            ) : (
              <p className="text-neutral-300">Aucun personnage sélectionné</p>
            )}
          </div>
        </div>
        
        {/* Variant du personnage */}
        {selectedCharacter && (
          <div>
            <label className="block mb-1 text-neutral-300">Variante</label>
            <select
              className="w-full p-2 bg-neutral-800 text-neutral-300 rounded border border-neutral-750"
              value={characterVariant}
              onChange={(e) => setCharacterVariant(e.target.value)}
            >
              <option value="Standard">Standard</option>
              <option value="Metal">Metal</option>
              <option value="Gold">Gold</option>
              <option value="Baby">Baby</option>
              <option value="Tanooki">Tanooki</option>
              <option value="Cat">Cat</option>
            </select>
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
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitorPage;