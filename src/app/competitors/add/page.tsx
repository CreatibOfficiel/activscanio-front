"use client";

import { NextPage } from "next";
import { FormEvent, useContext, useState } from "react";
import { AppContext } from "@/app/context/AppContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { validateImageUrl, validateCompetitorName } from "@/app/utils/validators";
import { normalizeText } from "@/app/utils/formatters";

const AddCompetitorPage: NextPage = () => {
  const router = useRouter();
  const { addCompetitor } = useContext(AppContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [url, setUrl] = useState("");

  const isFormValid = (): boolean => {
    return (
      validateCompetitorName(firstName) &&
      validateCompetitorName(lastName) &&
      validateImageUrl(url)
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) return;

    await addCompetitor({
      id: "",
      firstName: normalizeText(firstName),
      lastName: normalizeText(lastName),
      profilePictureUrl: url,
      rating: 1500,
      rd: 350,
      vol: 0.06,
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
          {url && validateImageUrl(url) && (
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
              isFormValid()
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
