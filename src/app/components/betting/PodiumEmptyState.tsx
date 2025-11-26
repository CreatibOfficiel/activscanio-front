"use client";

import { FC } from 'react';
import { Card } from '@/app/components/layout';

const PodiumEmptyState: FC = () => {
  return (
    <Card className="p-8 text-center">
      <p className="text-regular text-neutral-400">
        Aucun compétiteur éligible pour le moment.
      </p>
      <p className="text-sub text-neutral-500 mt-2">
        Les compétiteurs doivent avoir participé à au moins une course cette semaine.
      </p>
    </Card>
  );
};

export default PodiumEmptyState;
