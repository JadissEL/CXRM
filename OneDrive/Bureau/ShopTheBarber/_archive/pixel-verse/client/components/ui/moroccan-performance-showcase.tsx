import React from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LoadingSpinner, 
  Skeleton, 
  ContentSkeleton, 
  CardSkeleton,
  ProgressBar,
  StatusIndicator,
  LoadingOverlay,
  LazyLoadWrapper
} from "@/components/ui/loading-states";
import { 
  usePerformance, 
  useDebounce, 
  useThrottle,
  useResourcePreloader,
  useMemoryManagement
} from "@/hooks/use-performance";

export function MoroccanPerformanceShowcase() {
  const [activeTab, setActiveTab] = React.useState("loading");
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<"loading" | "success" | "error" | "warning" | "idle">("idle");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showLazyContent, setShowLazyContent] = React.useState(false);

  // Performance hooks
  const { metrics, getCached, setCached, clearCache } = usePerformance();
  const { memoryInfo, cleanup, monitorMemory } = useMemoryManagement();
  const { preloadImage, preloadMultiple, loadedResources, loadingResources } = useResourcePreloader();
  
  // Debounced and throttled values
  const debouncedSearch = useDebounce(searchTerm, 300);
  const throttledProgress = useThrottle(progress, 100);

  const tabs = [
    { id: "loading", label: "Loading States", icon: Zap },
    { id: "performance", label: "Performance", icon: () => <span>📊</span> },
    { id: "optimization", label: "Optimization", icon: () => <span>⚙️</span> },
  ];

  // Simulate loading operations
  const simulateLoading = async () => {
    setIsLoading(true);
    setStatus("loading");
    setProgress(0);

    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(i);
    }

    setStatus("success");
    setIsLoading(false);
  };

  const simulateError = async () => {
    setStatus("loading");
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus("error");
  };

  const simulateWarning = async () => {
    setStatus("loading");
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStatus("warning");
  };

  // Cache operations
  const testCache = () => {
    setCached("test-key", { data: "cached data", timestamp: Date.now() }, 60000);
    const cached = getCached("test-key");
    console.log("Cached data:", cached);
  };

  // Preload images
  const testPreload = async () => {
    const images = [
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=400&h=300&fit=crop"
    ];
    await preloadMultiple(images);
  };

  return (
    <div className="w-full bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 bg-moroccan-gradient-primary bg-clip-text text-transparent">
            Performance Premium
          </h2>
          <p className="text-moroccan-sand text-lg max-w-2xl mx-auto">
            Découvrez nos optimisations de performance avec des états de chargement élégants et des techniques d'optimisation avancées
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-medium">Memory</p>
            <p className="text-lg font-bold text-moroccan-gold">{memoryInfo.used} MB</p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🔄</div>
            <p className="text-sm font-medium">Render Time</p>
            <p className="text-lg font-bold text-moroccan-green">{metrics.renderTime}ms</p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">💾</div>
            <p className="text-sm font-medium">Cache Hits</p>
            <p className="text-lg font-bold text-moroccan-sand">{metrics.cacheHits}</p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📊</div>
            <p className="text-sm font-medium">Cache Misses</p>
            <p className="text-lg font-bold text-moroccan-gold">{metrics.cacheMisses}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-moroccan-darkgrey rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-moroccan-gradient-primary text-moroccan-charcoal shadow-lg"
                      : "text-moroccan-sand hover:text-moroccan-offwhite"
                  )}
                >
                  {typeof Icon === 'function' && Icon.name === '' ? (
                    <Icon />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "loading" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Loading States */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">États de Chargement</h3>
                <div className="space-y-4">
                  <LoadingSpinner size="sm" text="Petit chargement" />
                  <LoadingSpinner size="md" text="Chargement moyen" />
                  <LoadingSpinner size="lg" text="Grand chargement" />
                  <LoadingSpinner size="xl" text="Chargement extra large" />
                </div>
              </div>

              {/* Status Indicators */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Indicateurs de Statut</h3>
                <div className="space-y-3">
                  <StatusIndicator status="loading" text="Chargement en cours..." />
                  <StatusIndicator status="success" text="Opération réussie" />
                  <StatusIndicator status="error" text="Erreur détectée" />
                  <StatusIndicator status="warning" text="Attention requise" />
                  <StatusIndicator status="idle" text="En attente" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Barre de Progression</h3>
                <div className="space-y-4">
                  <ProgressBar progress={throttledProgress} />
                  <div className="flex space-x-2">
                    <Button onClick={simulateLoading} size="sm">
                      Simuler Chargement
                    </Button>
                    <Button onClick={simulateError} size="sm" variant="outline">
                      Simuler Erreur
                    </Button>
                    <Button onClick={simulateWarning} size="sm" variant="outline">
                      Simuler Warning
                    </Button>
                  </div>
                </div>
              </div>

              {/* Loading Overlay */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Overlay de Chargement</h3>
                <LoadingOverlay isLoading={isLoading}>
                  <div className="h-32 bg-moroccan-charcoal/50 rounded-lg flex items-center justify-center">
                    <p className="text-moroccan-sand">Contenu protégé par overlay</p>
                  </div>
                </LoadingOverlay>
                <Button onClick={() => setIsLoading(!isLoading)} className="mt-4">
                  Toggle Loading
                </Button>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Skeletons */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Skeletons</h3>
                <div className="space-y-4">
                  <ContentSkeleton lines={4} />
                  <div className="flex space-x-2">
                    <Skeleton variant="circular" width="40px" height="40px" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" height="16px" />
                      <Skeleton variant="text" height="12px" width="60%" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Skeletons */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Skeletons de Cartes</h3>
                <div className="space-y-4">
                  <CardSkeleton showImage={true} showActions={true} />
                  <CardSkeleton showImage={false} showActions={false} />
                </div>
              </div>

              {/* Lazy Loading */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Chargement Lazy</h3>
                <Button onClick={() => setShowLazyContent(!showLazyContent)} className="mb-4">
                  {showLazyContent ? "Masquer" : "Afficher"} Contenu Lazy
                </Button>
                {showLazyContent && (
                  <LazyLoadWrapper fallback={<LoadingSpinner text="Chargement lazy..." />}>
                    <div className="space-y-4">
                      <div className="bg-moroccan-charcoal/50 rounded-lg p-4">
                        <h4 className="font-bold text-moroccan-gold mb-2">Contenu Lazy Chargé</h4>
                        <p className="text-moroccan-sand text-sm">
                          Ce contenu a été chargé de manière lazy pour optimiser les performances.
                        </p>
                      </div>
                      <div className="bg-moroccan-charcoal/50 rounded-lg p-4">
                        <h4 className="font-bold text-moroccan-gold mb-2">Optimisation</h4>
                        <p className="text-moroccan-sand text-sm">
                          Le chargement lazy améliore les temps de chargement initiaux.
                        </p>
                      </div>
                    </div>
                  </LazyLoadWrapper>
                )}
              </div>

              {/* Search with Debounce */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Recherche avec Debounce</h3>
                <input
                  type="text"
                  placeholder="Tapez pour rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 bg-moroccan-charcoal border border-moroccan-darkgrey rounded text-moroccan-offwhite"
                />
                <div className="mt-4">
                  <p className="text-sm text-moroccan-sand">
                    Recherche actuelle: <span className="text-moroccan-gold">{searchTerm}</span>
                  </p>
                  <p className="text-sm text-moroccan-sand">
                    Recherche debounced: <span className="text-moroccan-green">{debouncedSearch}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "optimization" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Cache Management */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Gestion du Cache</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button onClick={testCache} size="sm">
                      Tester Cache
                    </Button>
                    <Button onClick={clearCache} size="sm" variant="outline">
                      Vider Cache
                    </Button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-moroccan-sand">Hits: <span className="text-moroccan-green">{metrics.cacheHits}</span></p>
                    <p className="text-moroccan-sand">Misses: <span className="text-moroccan-gold">{metrics.cacheMisses}</span></p>
                  </div>
                </div>
              </div>

              {/* Resource Preloading */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Préchargement</h3>
                <div className="space-y-4">
                  <Button onClick={testPreload} size="sm">
                    Précharger Images
                  </Button>
                  <div className="text-sm space-y-1">
                    <p className="text-moroccan-sand">Ressources chargées: <span className="text-moroccan-green">{loadedResources.size}</span></p>
                    <p className="text-moroccan-sand">En cours: <span className="text-moroccan-gold">{loadingResources.size}</span></p>
                  </div>
                </div>
              </div>

              {/* Memory Management */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Gestion Mémoire</h3>
                <div className="space-y-4">
                  <div className="text-sm space-y-1">
                    <p className="text-moroccan-sand">Utilisée: <span className="text-moroccan-gold">{memoryInfo.used} MB</span></p>
                    <p className="text-moroccan-sand">Totale: <span className="text-moroccan-green">{memoryInfo.total} MB</span></p>
                    <p className="text-moroccan-sand">Limite: <span className="text-moroccan-sand">{memoryInfo.limit} MB</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={cleanup} size="sm">
                      Nettoyer
                    </Button>
                    <Button onClick={monitorMemory} size="sm" variant="outline">
                      Actualiser
                    </Button>
                  </div>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Conseils Performance</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="text-moroccan-gold mt-1">⚡</div>
                    <p className="text-moroccan-sand">Utilisez le chargement lazy pour les images</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="text-moroccan-gold mt-1">💾</div>
                    <p className="text-moroccan-sand">Mettez en cache les données fréquemment utilisées</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="text-moroccan-gold mt-1">🔄</div>
                    <p className="text-moroccan-sand">Debouncez les recherches utilisateur</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="text-moroccan-gold mt-1">📊</div>
                    <p className="text-moroccan-sand">Surveillez l'utilisation mémoire</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-transform duration-300"
          >
            Optimiser les Performances
          </Button>
        </div>
      </div>
    </div>
  );
} 