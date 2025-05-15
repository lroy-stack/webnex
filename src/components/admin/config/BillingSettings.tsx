
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CreditCard, Receipt, Settings2 } from "lucide-react";
import { getBillingSettings } from "@/services/adminConfigService";

export const BillingSettings: React.FC = () => {
  const { data: billingData, isLoading, isError } = useQuery({
    queryKey: ["billing-settings"],
    queryFn: getBillingSettings,
  });

  if (isLoading) {
    return <BillingSettingsSkeleton />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No se pudo cargar la configuración de facturación. Por favor, inténtelo de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }

  // Si no hay datos de facturación configurados
  if (!billingData || billingData.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Configuración de Facturación</h2>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sin configuración</AlertTitle>
          <AlertDescription>
            No se ha encontrado configuración de facturación. Configure los ajustes de facturación para comenzar.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Primeros pasos</CardTitle>
            <CardDescription>
              Configure los ajustes básicos de facturación para su plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Moneda predeterminada</label>
              <Select defaultValue="eur">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione moneda" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eur">Euro (EUR)</SelectItem>
                  <SelectItem value="usd">Dólar (USD)</SelectItem>
                  <SelectItem value="gbp">Libra Esterlina (GBP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Impuesto predeterminado (%)</label>
              <Input type="number" placeholder="21" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de empresa</label>
              <Input placeholder="Mi Empresa S.L." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">CIF/NIF</label>
              <Input placeholder="B12345678" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Guardar configuración</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Integración con pasarelas de pago</CardTitle>
            <CardDescription>
              Configure las pasarelas de pago para procesar transacciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <CreditCard className="h-8 w-8" />
                  <div>
                    <h4 className="font-medium">Stripe</h4>
                    <p className="text-sm text-muted-foreground">Procesa pagos con tarjeta y más</p>
                  </div>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Settings2 className="h-8 w-8" />
                  <div>
                    <h4 className="font-medium">PayPal</h4>
                    <p className="text-sm text-muted-foreground">Acepta pagos via PayPal</p>
                  </div>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Opciones de Facturación</h2>
      
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="settings">Configuración</TabsTrigger>
          <TabsTrigger value="payment-methods">Métodos de Pago</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ajustes Generales</CardTitle>
              <CardDescription>
                Configuración general de la facturación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Moneda predeterminada</label>
                  <Select defaultValue={billingData.default_currency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">Euro (EUR)</SelectItem>
                      <SelectItem value="usd">Dólar (USD)</SelectItem>
                      <SelectItem value="gbp">Libra Esterlina (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Impuesto predeterminado (%)</label>
                  <Input type="number" defaultValue={billingData.default_tax_rate} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre de la empresa</label>
                  <Input defaultValue={billingData.company_name} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">CIF/NIF</label>
                  <Input defaultValue={billingData.tax_id} />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Dirección de facturación</label>
                <Input defaultValue={billingData.billing_address} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas predeterminadas en facturas</label>
                <Input defaultValue={billingData.invoice_notes} />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Guardar Cambios</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pasarelas de Pago</CardTitle>
              <CardDescription>
                Configure las opciones de pago para su plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingData.payment_gateways.map((gateway: any) => (
                  <div key={gateway.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {gateway.name === 'stripe' ? (
                        <CreditCard className="h-8 w-8" />
                      ) : (
                        <Settings2 className="h-8 w-8" />
                      )}
                      <div>
                        <h4 className="font-medium">{gateway.name}</h4>
                        <p className="text-sm text-muted-foreground">{gateway.description}</p>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                          gateway.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {gateway.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <Button variant={gateway.active ? "default" : "outline"}>
                      {gateway.active ? 'Configurar' : 'Activar'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Facturas</CardTitle>
              <CardDescription>
                Revise y gestione las facturas generadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingData.recent_invoices && billingData.recent_invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.recent_invoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.number}</TableCell>
                        <TableCell>{invoice.client_name}</TableCell>
                        <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                        <TableCell>{invoice.amount} €</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status === 'paid' ? 'Pagada' : 
                             invoice.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Receipt className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay facturas disponibles
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const BillingSettingsSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 w-48"><Skeleton className="h-full w-full" /></div>
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
        <Skeleton className="h-9 rounded-md" />
      </TabsList>
      
      <div className="mt-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    </Tabs>
  </div>
);
