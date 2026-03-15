import type { Metadata } from 'next';
import './globals.css';
import { MobileBookingButton } from '@/components/public/MobileBookingButton';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SALON_NAME ?? 'Salon de Coiffure',
  description: `Réservez votre rendez-vous en ligne`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <MobileBookingButton />
      </body>
    </html>
  );
}
