
import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <Link to="/app">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al panel
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">Términos de Servicio</h1>
          <p className="text-muted-foreground">Última actualización: {currentYear}</p>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Aceptación de los términos</h2>
              <p>
                Al acceder o utilizar los servicios de WebNex ("Servicios"), usted acepta estar legalmente vinculado por estos Términos de Servicio ("Términos"). Si no está de acuerdo con alguna parte de estos términos, no podrá acceder o utilizar nuestros Servicios.
              </p>
              <p>
                Estos Términos constituyen un acuerdo legal entre usted y WebNex ("nosotros", "nuestro" o "la Compañía").
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Descripción de los servicios</h2>
              <p>
                WebNex proporciona una plataforma web modular que permite a los usuarios crear y gestionar su presencia digital mediante bloques modulares personalizables para negocios. Los servicios específicos disponibles dependen del plan o paquete contratado.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Registro de cuenta</h2>
              <p>
                Para acceder a ciertos servicios, deberá crear una cuenta. Usted es responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar información precisa, actualizada y completa durante el registro.</li>
                <li>Mantener la seguridad de sus credenciales de acceso.</li>
                <li>Todas las actividades que ocurran bajo su cuenta.</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta.</li>
              </ul>
              <p>
                Nos reservamos el derecho de suspender o terminar su cuenta si consideramos que ha violado estos Términos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Planes y pagos</h2>
              <p>
                Ofrecemos diversos planes y paquetes con diferentes características y precios. Al contratar un plan de pago:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Se compromete a pagar todas las tarifas asociadas con su plan.</li>
                <li>Los pagos no son reembolsables, excepto donde lo exija la ley.</li>
                <li>Podemos cambiar nuestras tarifas con previo aviso de 30 días.</li>
                <li>La falta de pago puede resultar en la suspensión o terminación de sus servicios.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Contenido del usuario</h2>
              <p>
                Usted conserva todos los derechos sobre el contenido que cargue, publique o muestre a través de nuestros Servicios ("Contenido del Usuario"). Al proporcionar Contenido del Usuario:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nos otorga una licencia mundial, no exclusiva, transferible, libre de regalías para usar, reproducir, modificar, publicar y distribuir dicho contenido con el fin de proporcionar y mejorar los Servicios.</li>
                <li>Declara y garantiza que tiene todos los derechos necesarios para otorgarnos esta licencia.</li>
                <li>Entiende que su Contenido del Usuario puede ser visible para otros usuarios según la configuración de su cuenta.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Uso aceptable</h2>
              <p>
                Al utilizar nuestros Servicios, acepta no:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Infringir estos Términos o cualquier ley aplicable.</li>
                <li>Publicar contenido ilegal, difamatorio, obsceno, ofensivo o fraudulento.</li>
                <li>Hacerse pasar por otra persona o entidad, o tergiversar su afiliación.</li>
                <li>Interferir con el funcionamiento de nuestros Servicios o intentar acceder a áreas restringidas.</li>
                <li>Distribuir virus, malware o cualquier código diseñado para dañar nuestros sistemas.</li>
                <li>Recopilar información de otros usuarios sin su consentimiento.</li>
                <li>Utilizar nuestros Servicios para enviar comunicaciones no solicitadas.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Propiedad intelectual</h2>
              <p>
                Nuestros Servicios y todo su contenido, características y funcionalidad (incluyendo software, textos, imágenes, marcas, logotipos y diseños) son propiedad de WebNex o de nuestros licenciantes y están protegidos por leyes de propiedad intelectual.
              </p>
              <p>
                No puede reproducir, distribuir, modificar, crear obras derivadas, mostrar públicamente, o utilizar de cualquier otra manera nuestro contenido sin nuestro permiso expreso por escrito.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Cancelación y terminación</h2>
              <p>
                Puede cancelar su cuenta en cualquier momento. Tras la cancelación:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Es posible que ya no tenga acceso a su cuenta y al Contenido del Usuario.</li>
                <li>Podemos conservar cierta información conforme a nuestra Política de Privacidad.</li>
                <li>Las obligaciones de pago pendientes seguirán siendo aplicables.</li>
              </ul>
              <p>
                Nos reservamos el derecho de suspender o terminar su acceso a los Servicios en cualquier momento, por cualquier motivo, sin previo aviso, si consideramos que ha violado estos Términos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Limitación de responsabilidad</h2>
              <p>
                En la medida permitida por la ley:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nuestros Servicios se proporcionan "tal cual" y "según disponibilidad".</li>
                <li>No garantizamos que nuestros Servicios serán ininterrumpidos, oportunos, seguros o libres de errores.</li>
                <li>No seremos responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos.</li>
                <li>Nuestra responsabilidad total no excederá la cantidad pagada por usted, si la hubiera, por el uso de nuestros Servicios durante los 12 meses anteriores.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Indemnización</h2>
              <p>
                Usted acepta indemnizar, defender y mantener indemne a WebNex y a sus afiliados, directores, empleados y agentes de y contra cualquier reclamación, responsabilidad, daño, pérdida y gasto (incluidos honorarios y costos legales razonables) que surjan de o estén relacionados con su uso de nuestros Servicios, su Contenido del Usuario, o su violación de estos Términos.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Modificaciones</h2>
              <p>
                Podemos modificar estos Términos en cualquier momento publicando los términos revisados en nuestra plataforma. Su uso continuado de nuestros Servicios después de dichos cambios constituye su aceptación de los términos revisados.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Ley aplicable</h2>
              <p>
                Estos Términos se regirán e interpretarán de acuerdo con las leyes de España, sin tener en cuenta sus principios de conflicto de leyes. Cualquier disputa que surja de estos Términos estará sujeta a la jurisdicción exclusiva de los tribunales de [Jurisdicción].
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Contacto</h2>
              <p>
                Si tiene alguna pregunta sobre estos Términos, póngase en contacto con nosotros en:
              </p>
              <p className="font-medium">
                Email: legal@webnex.es<br />
                Dirección: [Dirección de la empresa]<br />
                Teléfono: [Número de teléfono]
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfService;
