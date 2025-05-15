import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { fetchServiceModules, ServiceModule } from "@/services/serviceModule";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Info, Star, Award, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { CategoryType, categoryConfig, getModuleHighlight } from "@/utils/categoryStyles";

const Servicios = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>("all");
  const [modules, setModules] = useState<ServiceModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await fetchServiceModules();
        setModules(data);
      } catch (error) {
        console.error("Error loading services:", error);
        toast.error("No se pudieron cargar los servicios");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Definir las categorías
  const categories = [
    { id: "all", name: "Todos" },
    { id: "technical", name: "Técnicos y Funcionales" },
    { id: "ai", name: "IA y Automatización" },
    { id: "ux", name: "UX/UI y SEO" },
    { id: "crm", name: "Gestión Interna y CRM" },
    { id: "extra", name: "Extras" },
  ];

  // Filtrar módulos por categoría
  const filteredModules = activeCategory === "all" 
    ? modules 
    : modules.filter(module => module.category === activeCategory);

  // Función para formatear el precio con símbolo de euro
  const formatPrice = (price: number, category: string) => {
    if (category === 'extra' && (price === 39 || price === 49)) {
      return `${price}€/mes`;
    } else if (category === 'extra' && price === 180) {
      return `${price}€/año`;
    } else {
      return `${price}€`;
    }
  };

  // Función para togglear selección de módulos
  const toggleModuleSelection = (id: string) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(moduleId => moduleId !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  // Calcular el precio total de los módulos seleccionados
  const calculateTotal = () => {
    return modules
      .filter(module => selectedModules.includes(module.id))
      .reduce((total, module) => total + module.price, 0);
  };

  // Renderiza el icono de la categoría basado en la configuración
  const renderCategoryIcon = (category: CategoryType) => {
    const IconComponent = categoryConfig[category]?.icon || categoryConfig.all.icon;
    return <IconComponent className="h-5 w-5" />;
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-6xl py-6 md:py-12 px-4 md:px-6">
        <BreadcrumbNav />
        
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block p-2 rounded-full bg-primary/10 mb-4">
            {renderCategoryIcon(activeCategory)}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Módulos Adicionales</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Personaliza tu solución web con módulos adicionales según tus necesidades
          </p>
        </div>

        {/* Background decoration */}
        <div className="absolute top-40 right-0 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl -z-10"></div>
        <div className="absolute top-80 left-10 w-72 h-72 bg-secondary/5 rounded-full filter blur-3xl -z-10"></div>

        {/* Categorías */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
          {categories.map((category) => {
            const catType = category.id as CategoryType;
            const catConfig = categoryConfig[catType];
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(catType)}
                className={cn(
                  "px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-2 relative overflow-hidden",
                  activeCategory === catType
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {/* Color indicator */}
                {catType !== "all" && (
                  <span
                    className={cn(
                      "absolute left-0 top-0 w-1 h-full",
                      catConfig.buttonIndicator
                    )}
                  ></span>
                )}
                <span className="pl-1">{renderCategoryIcon(catType)}</span>
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Contador de seleccionados y total */}
        {selectedModules.length > 0 && (
          <div className="bg-background dark:bg-background/95 border border-border py-4 px-6 rounded-xl mb-8 sticky top-0 z-10 shadow-lg shadow-primary/10 dark:shadow-primary/20 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold shadow-sm dark:shadow-primary/30">
                  {selectedModules.length}
                </span>
                <span className="font-medium text-base">
                  {selectedModules.length === 1 ? "módulo" : "módulos"} seleccionado{selectedModules.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-2xl">
                    {calculateTotal()}€
                  </span>
                </div>
                <Button className="rounded-xl bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white shadow-lg shadow-[#ff6b35]/20 dark:shadow-[#ff6b35]/30 px-5 py-2 h-auto">
                  Añadir seleccionados
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Módulos - con estado de carga */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-border p-6">
                <Skeleton className="h-7 w-3/4 mb-2" />
                <Skeleton className="h-8 w-1/4 mb-3" />
                <Skeleton className="h-16 w-full mb-6" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredModules.map((module) => {
              const categoryType = module.category as CategoryType;
              const catConfig = categoryConfig[categoryType];
              const IconComponent = catConfig?.icon || categoryConfig.all.icon;
              const highlight = getModuleHighlight(module);
              
              return (
                <Card
                  key={module.id}
                  className={cn(
                    "rounded-2xl border transition-all relative overflow-hidden group flex flex-col h-full",
                    `hover:shadow-lg hover:translate-y-[-4px] ${catConfig.shadow}`,
                    selectedModules.includes(module.id) 
                      ? `${catConfig.color} shadow-lg dark:shadow-lg` 
                      : "border-border dark:border-border/50",
                    `bg-gradient-to-br ${catConfig.gradientFrom} ${catConfig.gradientTo}`,
                    "dark:backdrop-blur-sm"                    
                  )}
                >
                  {/* Barra superior de color similar a packs */}
                  <div className={`${catConfig.bgColor.replace("bg-", "")} h-2 dark:h-2.5`}></div>
                  
                  {/* Tag for popular/recommended */}
                  {highlight && (
                    <div className="absolute top-4 right-4">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "px-2 py-1 font-medium flex items-center gap-1",
                          highlight === "Popular" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300 dark:border dark:border-amber-700/30" :
                          "bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300 dark:border dark:border-blue-700/30"
                        )}
                      >
                        {highlight === "Popular" ? 
                          <Star className="w-3 h-3" /> : 
                          <Award className="w-3 h-3" />
                        }
                        {highlight}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg md:text-xl">{module.name}</CardTitle>
                      {module.category === 'extra' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-5 w-5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="w-[200px] text-sm">Servicio de suscripción</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 mt-2">
                      <p className="text-2xl md:text-3xl font-bold">
                        {formatPrice(module.price, module.category)}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg", catConfig.bgColor)}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <Badge variant="outline" className={catConfig.badgeColor}>
                          {catConfig.name}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-grow">
                    <p className="text-muted-foreground text-sm md:text-base">
                      {module.description}
                    </p>
                  </CardContent>
                  <CardFooter className="mt-auto">
                    <Button 
                      onClick={() => toggleModuleSelection(module.id)} 
                      className={cn(
                        "w-full rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                        selectedModules.includes(module.id) 
                          ? `bg-${categoryType === 'all' ? 'primary' : categoryType}-100/80 text-${categoryType === 'all' ? 'primary' : categoryType}-700 hover:bg-${categoryType === 'all' ? 'primary' : categoryType}-200/80 dark:bg-${categoryType === 'all' ? 'primary' : categoryType}-900/50 dark:text-${categoryType === 'all' ? 'primary' : categoryType}-300 dark:hover:bg-${categoryType === 'all' ? 'primary' : categoryType}-900/60` 
                          : categoryType === 'all' 
                            ? "bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white shadow-md shadow-[#ff6b35]/20 dark:shadow-[#ff6b35]/30" 
                            : `${catConfig.buttonIndicator} text-white hover:${catConfig.buttonIndicator.replace("bg-", "bg-")}/90 shadow-md ${catConfig.shadow}`
                      )}
                    >
                      <Plus className="h-5 w-5" />
                      {selectedModules.includes(module.id) ? "Seleccionado" : "Añadir"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {filteredModules.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              No hay módulos disponibles en esta categoría
            </p>
          </div>
        )}

        <div className="mt-14 text-center">
          <Link to="/packs">
            <Button
              className="rounded-2xl px-8 py-4 text-lg font-medium"
            >
              Ver packs disponibles
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Servicios;
