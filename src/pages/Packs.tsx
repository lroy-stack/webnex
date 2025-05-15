import React, { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { fetchPacks, Pack } from "@/services/packService";
import { fetchServiceModulesByCategory, ServiceModule } from "@/services/serviceModule";
import { ArrowRight, Check, RefreshCw, ChevronDown, ChevronUp, Filter, Search, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import PackDetailModal from "@/components/packs/PackDetailModal";
interface ColorClass {
  bg: string;
  text: string;
  border: string;
  shadow: string;
}
type ColorClasses = {
  [key: string]: ColorClass;
};
type PackType = 'all' | 'basic' | 'specialized' | 'standard';
const Packs = () => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [complementaryServices, setComplementaryServices] = useState<ServiceModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<PackType>('all');
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isMobile = useIsMobile();
  const packSectionsRef = useRef<HTMLDivElement>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Mapeo de colores a clases de Tailwind con sombras mejoradas
  const colorClasses: ColorClasses = {
    "blue-500": {
      bg: "bg-blue-500",
      text: "text-blue-500",
      border: "border-blue-500",
      shadow: "shadow-blue-500/20"
    },
    "indigo-600": {
      bg: "bg-indigo-600",
      text: "text-indigo-600",
      border: "border-indigo-600",
      shadow: "shadow-indigo-600/20"
    },
    "green-500": {
      bg: "bg-green-500",
      text: "text-green-500",
      border: "border-green-500",
      shadow: "shadow-green-500/20"
    },
    "amber-500": {
      bg: "bg-amber-500",
      text: "text-amber-500",
      border: "border-amber-500",
      shadow: "shadow-amber-500/20"
    },
    "purple-600": {
      bg: "bg-purple-600",
      text: "text-purple-600",
      border: "border-purple-600",
      shadow: "shadow-purple-600/20"
    },
    "orange-500": {
      bg: "bg-orange-500",
      text: "text-orange-500",
      border: "border-orange-500",
      shadow: "shadow-orange-500/20"
    },
    "pink-500": {
      bg: "bg-pink-500",
      text: "text-pink-500",
      border: "border-pink-500",
      shadow: "shadow-pink-500/20"
    },
    "teal-500": {
      bg: "bg-teal-500",
      text: "text-teal-500",
      border: "border-teal-500",
      shadow: "shadow-teal-500/20"
    },
    "red-500": {
      bg: "bg-red-500",
      text: "text-red-500",
      border: "border-red-500",
      shadow: "shadow-red-500/20"
    }
  };
  const toggleExpandPack = (packId: string) => {
    if (expandedPack === packId) {
      setExpandedPack(null);
    } else {
      setExpandedPack(packId);
    }
  };
  const handleOpenDetails = (pack: Pack) => {
    setSelectedPack(pack);
    setShowModal(true);
  };
  useEffect(() => {
    loadPacks();
    loadComplementaryServices();
  }, []);
  const loadPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPacks();
      // Ordenar packs por posición
      setPacks(data.sort((a, b) => (a.position || 0) - (b.position || 0)));
    } catch (err) {
      setError("No se pudieron cargar los packs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // New function to load complementary services
  const loadComplementaryServices = async () => {
    try {
      setLoadingServices(true);
      // Get complementary services - using "ux" and "technical" categories as examples
      // You can adjust these categories based on what you want to show
      const services = await fetchServiceModulesByCategory("ux");
      setComplementaryServices(services);
    } catch (err) {
      console.error("Error loading complementary services:", err);
      toast.error("No se pudieron cargar los servicios complementarios");
    } finally {
      setLoadingServices(false);
    }
  };

  // Agrupar packs por tipo
  const basicPacks = packs.filter(pack => pack.type === 'basic');
  const specializedPacks = packs.filter(pack => pack.type === 'specialized');
  const standardPacks = packs.filter(pack => pack.type === 'standard');

  // Filtrar packs según el filtro activo y el término de búsqueda
  const filteredPacks = activeFilter === 'all' ? packs.filter(pack => searchQuery ? pack.name.toLowerCase().includes(searchQuery.toLowerCase()) || pack.short_description && pack.short_description.toLowerCase().includes(searchQuery.toLowerCase()) : true) : packs.filter(pack => pack.type === activeFilter && (searchQuery ? pack.name.toLowerCase().includes(searchQuery.toLowerCase()) || pack.short_description && pack.short_description.toLowerCase().includes(searchQuery.toLowerCase()) : true));

  // Función para navegar a una sección
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: offsetTop - 100,
        // Offset para que no quede justo al borde
        behavior: 'smooth'
      });
    }
  };
  return <Layout>
      <div className="container mx-auto max-w-6xl py-6 md:py-12 px-4 md:px-6">
        <BreadcrumbNav />
        
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Nuestros Packs</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Soluciones web modulares adaptadas a las necesidades específicas de tu negocio
          </p>
        </div>

        {/* Buscador - Nuevo para móvil */}
        <div className="mb-4 md:mb-6 relative">
          <Input type="text" placeholder="Buscar packs..." className="w-full rounded-full max-w-sm mx-auto pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          
          {searchQuery && <Button variant="ghost" className="absolute right-[calc(50%-9rem)] top-1 h-8 w-8 p-0" onClick={() => setSearchQuery("")}>
              &times;
            </Button>}
        </div>

        {/* Navegación por tabs para móviles y navegación rápida para desktop */}
        <div className="mb-8 md:mb-12" ref={packSectionsRef}>
          {isMobile ? <Tabs defaultValue="all" className="w-full" onValueChange={value => setActiveFilter(value as PackType)}>
              <TabsList className="w-full mb-4 p-1 h-auto flex justify-between bg-muted/50 overflow-x-auto scrollbar-none">
                <TabsTrigger value="all" className="flex-1 py-2 text-sm whitespace-nowrap">
                  Todos
                </TabsTrigger>
                {basicPacks.length > 0 && <TabsTrigger value="basic" className="flex-1 py-2 text-sm whitespace-nowrap">
                    Pack Base
                  </TabsTrigger>}
                {standardPacks.length > 0 && <TabsTrigger value="standard" className="flex-1 py-2 text-sm whitespace-nowrap">
                    Estándar
                  </TabsTrigger>}
                {specializedPacks.length > 0 && <TabsTrigger value="specialized" className="flex-1 py-2 text-sm whitespace-nowrap">
                    Especializados
                  </TabsTrigger>}
              </TabsList>
            </Tabs> : <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant={activeFilter === 'all' ? "default" : "outline"} className="px-4 py-2 text-base cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => setActiveFilter('all')}>
                  Todos
                </Badge>
                {basicPacks.length > 0 && <Badge variant={activeFilter === 'basic' ? "default" : "outline"} className="px-4 py-2 text-base cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => {
              setActiveFilter('basic');
              scrollToSection('pack-base');
            }}>
                    Pack Base
                  </Badge>}
                {standardPacks.length > 0 && <Badge variant={activeFilter === 'standard' ? "default" : "outline"} className="px-4 py-2 text-base cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => {
              setActiveFilter('standard');
              scrollToSection('packs-estandar');
            }}>
                    Packs Estándar
                  </Badge>}
                {specializedPacks.length > 0 && <Badge variant={activeFilter === 'specialized' ? "default" : "outline"} className="px-4 py-2 text-base cursor-pointer hover:bg-primary/5 transition-colors" onClick={() => {
              setActiveFilter('specialized');
              scrollToSection('packs-especializados');
            }}>
                    Packs Especializados
                  </Badge>}
              </div>
            </div>}
        </div>

        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {[...Array(3)].map((_, index) => <div key={index} className="rounded-2xl border border-border overflow-hidden">
                <div className="bg-gray-200 h-2" />
                <div className="p-6 h-64">
                  <Skeleton className="h-8 w-1/2 mb-3" />
                  <Skeleton className="h-10 w-1/4 mb-3" />
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-full mb-6" />
                  <Skeleton className="h-10 w-full mt-auto rounded-xl" />
                </div>
              </div>)}
          </div> : error ? <div className="text-center py-12">
            <p className="text-xl text-red-500 mb-4">{error}</p>
            <Button onClick={loadPacks} variant="outline" size="lg" className="flex items-center gap-2 mx-auto">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div> : <>
            {activeFilter === 'all' && !searchQuery ? <>
                {/* Pack Base - Si existe */}
                {basicPacks.length > 0 && <div className="mb-12 md:mb-16 scroll-mt-24" id="pack-base">
                    <div className="relative mb-6 md:mb-8">
                      <h2 className="text-2xl md:text-3xl font-bold text-center">
                        Pack Base
                      </h2>
                      <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                    
                    {/* Pack Base Card Grid - Usamos Carousel para móvil */}
                    {isMobile ? <Carousel className="w-full">
                        <CarouselContent>
                          {basicPacks.map(pack => {
                  const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                  const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                  return <CarouselItem key={pack.id} className="md:basis-1/2">
                                {renderPackCard(pack, colorClass)}
                              </CarouselItem>;
                })}
                        </CarouselContent>
                        <div className="flex justify-center mt-4">
                          <CarouselPrevious className="relative -left-0 -translate-y-0 mr-2" />
                          <CarouselNext className="relative -right-0 -translate-y-0 ml-2" />
                        </div>
                      </Carousel> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {basicPacks.map(pack => {
                const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                return renderPackCard(pack, colorClass);
              })}
                      </div>}

                    {/* Complementary Services Section - Convertido a carrusel para móvil */}
                    <div className="mt-10 bg-muted/30 rounded-2xl p-4 md:p-6 border border-border">
                      <div className="mb-6 text-center">
                        <h3 className="text-xl md:text-2xl font-bold mb-2">Servicios complementarios para Pack Base</h3>
                        <p className="text-muted-foreground">Optimiza tu presencia online con estos módulos adicionales</p>
                      </div>
                      
                      {loadingServices ? <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[...Array(3)].map((_, index) => <Card key={index} className="rounded-xl overflow-hidden">
                              <div className="h-1.5 bg-gray-200"></div>
                              <CardHeader className="pb-2">
                                <Skeleton className="h-5 w-1/2 mb-1" />
                                <Skeleton className="h-6 w-1/4" />
                              </CardHeader>
                              <CardContent className="pb-4">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                              </CardContent>
                              <CardFooter>
                                <Skeleton className="h-8 w-full rounded-lg" />
                              </CardFooter>
                            </Card>)}
                        </div> : <Carousel className="w-full">
                          <CarouselContent>
                            {complementaryServices.slice(0, 6).map(service => {
                    // Map service category to a color
                    let colorKey;
                    switch (service.category) {
                      case 'ux':
                        colorKey = 'green-500';
                        break;
                      case 'ai':
                        colorKey = 'purple-600';
                        break;
                      case 'technical':
                        colorKey = 'blue-500';
                        break;
                      case 'crm':
                        colorKey = 'amber-500';
                        break;
                      default:
                        colorKey = 'teal-500';
                    }
                    const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                    return <CarouselItem key={service.id} className={`${isMobile ? 'basis-full' : 'md:basis-1/3'}`}>
                                  <Card className={cn("rounded-xl overflow-hidden transition-all h-full", "hover:shadow-md hover:translate-y-[-2px]", colorClass.shadow)}>
                                    <div className={`${colorClass.bg} h-1.5`}></div>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">{service.name}</CardTitle>
                                      <CardDescription>
                                        <span className="text-xl font-bold block">{service.price}€</span>
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-4">
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {service.description}
                                      </p>
                                    </CardContent>
                                    <CardFooter>
                                      <Button variant="secondary" size="sm" className="w-full">
                                        <Link to="/servicios" className="w-full flex items-center justify-center">
                                          Ver detalle
                                        </Link>
                                      </Button>
                                    </CardFooter>
                                  </Card>
                                </CarouselItem>;
                  })}
                          </CarouselContent>
                          <div className="flex justify-center mt-4">
                            <CarouselPrevious className="relative -left-0 -translate-y-0 mr-2" />
                            <CarouselNext className="relative -right-0 -translate-y-0 ml-2" />
                          </div>
                        </Carousel>}
                      
                      <div className="mt-6 text-center complementary-btn-container">
                        <Link to="/servicios">
                          <Button className="rounded-xl text-base font-medium bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white shadow-lg shadow-[#ff6b35]/20 transition-all px-[8px] py-[22px]">
                            Ver todos los módulos adicionales
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>}

                {/* Packs Estándar */}
                {standardPacks.length > 0 && <div className="mb-12 md:mb-16 scroll-mt-24" id="packs-estandar">
                    <div className="relative mb-6 md:mb-8">
                      <h2 className="text-2xl md:text-3xl font-bold text-center">
                        Packs Estándar
                      </h2>
                      <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                    
                    {isMobile ? <Carousel className="w-full">
                        <CarouselContent>
                          {standardPacks.map(pack => {
                  const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                  const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                  return <CarouselItem key={pack.id} className="md:basis-1/2">
                                {renderPackCard(pack, colorClass)}
                              </CarouselItem>;
                })}
                        </CarouselContent>
                        <div className="flex justify-center mt-4">
                          <CarouselPrevious className="relative -left-0 -translate-y-0 mr-2" />
                          <CarouselNext className="relative -right-0 -translate-y-0 ml-2" />
                        </div>
                      </Carousel> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {standardPacks.map(pack => {
                const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                return renderPackCard(pack, colorClass);
              })}
                      </div>}
                  </div>}

                {/* Packs Especializados */}
                {specializedPacks.length > 0 && <div className="scroll-mt-24" id="packs-especializados">
                    <div className="relative mb-6 md:mb-8">
                      <h2 className="text-2xl md:text-3xl font-bold text-center">
                        Packs Especializados
                      </h2>
                      <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>
                    
                    {isMobile ? <Carousel className="w-full">
                        <CarouselContent>
                          {specializedPacks.map(pack => {
                  const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                  const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                  return <CarouselItem key={pack.id} className="md:basis-1/2">
                                {renderPackCard(pack, colorClass)}
                              </CarouselItem>;
                })}
                        </CarouselContent>
                        <div className="flex justify-center mt-4">
                          <CarouselPrevious className="relative -left-0 -translate-y-0 mr-2" />
                          <CarouselNext className="relative -right-0 -translate-y-0 ml-2" />
                        </div>
                      </Carousel> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                        {specializedPacks.map(pack => {
                const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                return renderPackCard(pack, colorClass);
              })}
                      </div>}
                  </div>}
              </> : (/* Packs filtrados */
        <>
                {searchQuery && <p className="text-center mb-4 text-muted-foreground">
                    {filteredPacks.length === 0 ? "No hay resultados para tu búsqueda" : `Mostrando ${filteredPacks.length} resultados para "${searchQuery}"`}
                  </p>}
                
                <div className={isMobile && filteredPacks.length > 1 ? "" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"}>
                  {isMobile && filteredPacks.length > 1 ? <Carousel className="w-full">
                      <CarouselContent>
                        {filteredPacks.map(pack => {
                  const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
                  const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
                  return <CarouselItem key={pack.id} className="md:basis-1/2">
                              {renderPackCard(pack, colorClass, true)}
                            </CarouselItem>;
                })}
                      </CarouselContent>
                      <div className="flex justify-center mt-4">
                        <CarouselPrevious className="relative -left-0 -translate-y-0 mr-2" />
                        <CarouselNext className="relative -right-0 -translate-y-0 ml-2" />
                      </div>
                    </Carousel> : filteredPacks.map(pack => {
              const colorKey = pack.color?.replace('bg-', '') || 'blue-500';
              const colorClass = colorClasses[colorKey] || colorClasses['blue-500'];
              return renderPackCard(pack, colorClass, true);
            })}
                </div>
              </>)}

            {/* Mostrar mensaje si no hay packs con el filtro seleccionado */}
            {filteredPacks.length === 0 && activeFilter !== 'all' && !searchQuery && <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">
                  No hay packs disponibles para este filtro
                </p>
                <Button onClick={() => setActiveFilter('all')} className="mt-4">
                  Ver todos los packs
                </Button>
              </div>}

            {/* Botón de navegación hacia servicios */}
            <div className="mt-14 text-center">
              <Link to="/servicios">
                <Button className="rounded-2xl px-8 py-4 md:py-6 text-lg font-medium bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white shadow-lg shadow-[#ff6b35]/20 transition-all">
                  Ver módulos adicionales
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </>}
      </div>
      
      <PackDetailModal pack={selectedPack} open={showModal} onOpenChange={setShowModal} />
    </Layout>;
  function renderPackCard(pack: Pack, colorClass: ColorClass, showTypeBadge: boolean = false) {
    const isExpanded = expandedPack === pack.id;
    const shouldCollapse = isMobile && pack.features && pack.features.length > 3;
    return <Card id={pack.slug} key={pack.id} className={cn("rounded-2xl border border-border overflow-hidden transition-all h-full", "hover:shadow-lg hover:translate-y-[-4px]", colorClass.shadow)}>
        <div className={`${colorClass.bg} h-2`}></div>
        <CardHeader className={isMobile ? "p-4" : undefined}>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl md:text-2xl">{pack.name}</CardTitle>
            {showTypeBadge && <Badge variant="outline" className="capitalize ml-2 text-xs md:text-sm">
                {pack.type === 'basic' ? 'Base' : pack.type === 'specialized' ? 'Especializado' : 'Estándar'}
              </Badge>}
          </div>
          <CardDescription>
            <span className="text-2xl md:text-3xl font-bold block">{pack.price}€</span>
            <span className="inline-block mt-2 px-3 py-1 bg-muted rounded-xl text-sm truncate max-w-full">{pack.target}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className={cn("space-y-4 flex-1", isMobile ? "p-4 pt-0" : undefined)}>
          <p className="text-muted-foreground line-clamp-2">
            {pack.short_description}
          </p>
          
          {pack.features && pack.features.length > 0 && <div className="space-y-2">
              {pack.features.slice(0, shouldCollapse && !isExpanded ? 3 : undefined).map((feature, index) => <div key={index} className="flex items-start gap-2">
                  <Check className={`${colorClass.text} h-5 w-5 mr-2 mt-0.5 flex-shrink-0`} />
                  <span className="text-sm">{feature}</span>
                </div>)}
              
              {shouldCollapse && <Button variant="ghost" size="sm" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            toggleExpandPack(pack.id);
          }} className="w-full mt-2 flex items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg py-1.5 text-sm">
                  {isExpanded ? <>
                      <span className="mr-1">Ver menos</span>
                      <ChevronUp className="h-4 w-4" />
                    </> : <>
                      <span className="mr-1">Ver {pack.features.length - 3} más</span>
                      <ChevronDown className="h-4 w-4" />
                    </>}
                </Button>}
            </div>}
        </CardContent>
        <CardFooter className={cn("flex gap-3 mt-auto", isMobile ? "p-4 pt-0" : undefined)}>
          <Button 
            className={`flex-1 ${colorClass.bg} hover:${colorClass.bg}/90 text-white`}
            onClick={() => handleOpenDetails(pack)}>
            Ver detalles
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => handleOpenDetails(pack)} className="flex-shrink-0">
            <Info className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>;
  }
};
export default Packs;