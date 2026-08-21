export function formatPrice(amount, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Number(amount),
  );
}

export function formatDate(dateString) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(dateString),
  );
}

export const STATUS_LABELS = {
  BROUILLON: 'Brouillon',
  EN_ATTENTE_PAIEMENT: 'En attente de paiement',
  PUBLIE: 'Publié',
  SUSPENDU: 'Suspendu',
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  EXPEDIEE: 'Expédiée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
  REUSSI: 'Réussi',
  ECHOUE: 'Échoué',
};

export const PROVIDER_LABELS = {
  ORANGE_MONEY: 'Orange Money',
  MOOV_MONEY: 'Moov Money',
  WAVE: 'Wave',
  SANK_MONEY: 'Sank Money',
};
