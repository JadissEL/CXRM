import React from 'react';

interface LoyaltyCardProps {
  points: number;
  onRedeem: () => void;
  onSendGift: () => void;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ points, onRedeem, onSendGift }) => (
  <div className="bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-xl shadow-lg p-6 flex flex-col items-center">
    <h2 className="text-2xl font-bold mb-2">Mes Points Fidélité</h2>
    <div className="text-5xl font-extrabold text-yellow-700 mb-4">{points}</div>
    <div className="flex gap-4">
      <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700" onClick={onRedeem}>
        Utiliser mes points
      </button>
      <button className="bg-white border border-yellow-600 text-yellow-700 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-100" onClick={onSendGift}>
        Offrir une carte cadeau
      </button>
    </div>
  </div>
); 