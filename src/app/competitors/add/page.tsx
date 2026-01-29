"use client";

import { NextPage } from "next";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppContext } from "@/app/context/AppContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { normalizeText } from "@/app/utils/formatters";
import { addCompetitorSchema, AddCompetitorFormData } from "@/app/schemas";
import { Input, Button, PageHeader } from "@/app/components/ui";

const AddCompetitorPage: NextPage = () => {
  const router = useRouter();
  const { addCompetitor } = useContext(AppContext);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<AddCompetitorFormData>({
    resolver: zodResolver(addCompetitorSchema),
    mode: "onChange",
  });

  const profilePictureUrl = watch("profilePictureUrl");

  const onSubmit = async (data: AddCompetitorFormData) => {
    try {
      await addCompetitor({
        id: "",
        firstName: normalizeText(data.firstName),
        lastName: normalizeText(data.lastName),
        profilePictureUrl: data.profilePictureUrl,
        rating: 1500,
        rd: 350,
        vol: 0.06,
      });

      toast.success("Compétiteur ajouté avec succès !");
      router.back();
    } catch (error) {
      toast.error("Erreur lors de l'ajout du compétiteur");
      console.error(error);
    }
  };

  return (
    <div className="p-4 bg-neutral-900 text-neutral-100 min-h-screen pb-20">
      <PageHeader
        variant="flow"
        title="Ajouter un·e compétiteur·trice"
        subtitle="Nouveau astronaute ?"
        backHref="/races"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Prénom"
          type="text"
          placeholder="Entrez le prénom"
          error={errors.firstName?.message}
          required
          {...register("firstName")}
        />

        <Input
          label="Nom"
          type="text"
          placeholder="Entrez le nom"
          error={errors.lastName?.message}
          required
          {...register("lastName")}
        />

        <div>
          <Input
            label="Image de profil (URL)"
            type="url"
            placeholder="https://example.com/image.jpg"
            error={errors.profilePictureUrl?.message}
            required
            {...register("profilePictureUrl")}
          />
          {profilePictureUrl && !errors.profilePictureUrl && (
            <div className="mt-4 flex justify-center">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-500/30">
                <Image
                  src={profilePictureUrl}
                  alt="Aperçu"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
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
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCompetitorPage;
