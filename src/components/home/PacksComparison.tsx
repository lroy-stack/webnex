
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Package } from "lucide-react";
import { fetchPacks, Pack } from "@/services/packService";
import { Skeleton } from "@/components/ui/skeleton";

export const PacksComparison: React.FC = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setLoading(true);
        const data = await fetchPacks();
        // Para la página principal, solo mostramos algunos packs principales
        // 2 de tipo basic/standard y 2 de tipo specialized
        const standardPacks = data.filter(p => p.type === 'standard' || p.type === 'basic').slice(0, 2);
        const specializedPacks = data.filter(p => p.type === 'specialized').slice(0, 2);
        setPacks([...standardPacks, ...specializedPacks].sort((a, b) => (a.position || 0) - (b.position || 0)).slice(0, 4));
        setError(null);
      } catch (err) {
        setError("No se pudieron cargar los packs");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPacks();
  }, []);

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Packs web para tu negocio</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Cargando soluciones...
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-border overflow-hidden transition-all"
              >
                <div className="bg-gray-200 h-2" />
                <div className="p-4 sm:p-6 h-48 sm:h-52">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-1/4 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <Skeleton className="h-10 w-full mt-auto rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-20">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Packs web para tu negocio</h2>
            <p className="text-xl text-red-500 max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 lg:py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Packs web para tu negocio</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Soluciones modulares diseñadas para diferentes tipos de negocios
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-border overflow-hidden transition-all hover:shadow-md flex flex-col h-full"
            >
              <div className={`${pack.color} h-2`} />
              <div className="p-3 sm:p-6 flex flex-col flex-grow">
                <div className="mb-auto">
                  <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2">{pack.name}</h3>
                  <p className="text-lg sm:text-3xl font-bold mb-1 sm:mb-4">{pack.price}€</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-6">{pack.target}</p>
                </div>
                <Link
                  to={`/packs#${pack.slug}`}
                  className="flex items-center justify-center w-full py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-xs sm:text-base mt-2"
                >
                  Ver detalles
                  <ArrowRight className="ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <Link
            to="/packs"
            className="inline-flex items-center rounded-2xl bg-[#0d5bff] text-white px-5 py-3 text-base sm:text-lg font-medium transition-colors hover:bg-[#0d5bff]/90"
          >
            Ver todos los packs
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
