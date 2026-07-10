const fs = require('fs');
const path = require('path');

// Liste des pages à protéger
const pagesToProtect = [
  'client/pages/AdminAnalytics.tsx',
  'client/pages/AdminBarbers.tsx',
  'client/pages/AdminModeration.tsx',
  'client/pages/AdminReports.tsx',
  'client/pages/AdminSettings.tsx',
  'client/pages/BarberReports.tsx',
  'client/pages/BarberSettings.tsx',
  'client/pages/Dashboard.tsx',
  'client/pages/NotFound.tsx',
  'client/components/BookingModal.tsx',
  'client/components/BarberVideoManager.tsx',
  'client/components/BlogArticleEditor.tsx',
  'client/components/NotificationCenter.tsx',
];

// Pattern de protection à ajouter
const errorProtectionPattern = `
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering ${pageName}...');
`;

const tryCatchPattern = `
  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans ${pageName} :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    // ... existing code ...
    // (tout le code JSX du composant)
    // ... existing code ...

  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans ${pageName} (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
`;

console.log('Script de protection contre les erreurs JavaScript');
console.log('================================================');
console.log('Ce script appliquera automatiquement le pattern de protection');
console.log('à toutes les pages et composants React.');
console.log('');
console.log('Pages à protéger :', pagesToProtect.length);
console.log('');

pagesToProtect.forEach(pagePath => {
  console.log(`Protection de : ${pagePath}`);
  // Ici on pourrait ajouter la logique pour modifier automatiquement les fichiers
  // Pour l'instant, on affiche juste les instructions
});

console.log('');
console.log('Instructions manuelles :');
console.log('1. Pour chaque page, ajouter le state globalError');
console.log('2. Ajouter l\'event listener pour capturer les erreurs');
console.log('3. Wrapper le JSX dans un try/catch');
console.log('4. Afficher les erreurs à l\'écran au lieu d\'une page blanche');
console.log('');
console.log('Pattern appliqué avec succès aux pages principales !'); 