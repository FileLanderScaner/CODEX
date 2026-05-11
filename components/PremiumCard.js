import React from 'react';
import PremiumCtaCard from './ui/PremiumCtaCard';

export default function PremiumCard({ onPress }) {
  return <PremiumCtaCard onPress={onPress} savingsLabel="alertas, historial y favoritos ilimitados" />;
}
