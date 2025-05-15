
import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
          <p className="text-muted-foreground">Última actualización: {currentYear}</p>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introducción</h2>
              <p>
                WebNex ("nosotros", "nuestro" o "la Compañía") se compromete a proteger la privacidad y los datos personales de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información cuando utiliza nuestra plataforma web modular y servicios relacionados ("Servicios").
              </p>
              <p>
                Al utilizar nuestros Servicios, usted acepta las prácticas descritas en esta Política de Privacidad. Le recomendamos que lea este documento cuidadosamente.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Información que recopilamos</h2>
              <p>Podemos recopilar los siguientes tipos de información:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Información de registro:</strong> Nombre, correo electrónico, nombre de empresa y contraseña cuando crea una cuenta.</li>
                <li><strong>Información de perfil:</strong> Datos adicionales que proporciona voluntariamente como información de contacto, dirección, información fiscal, etc.</li>
                <li><strong>Contenido generado:</strong> Cualquier contenido que suba o cree en nuestra plataforma.</li>
                <li><strong>Información técnica:</strong> Dirección IP, tipo de dispositivo, navegador, sistema operativo, páginas visitadas y tiempo de permanencia.</li>
                <li><strong>Comunicaciones:</strong> Cuando se comunica con nosotros o utiliza nuestro sistema de chat.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Cómo utilizamos su información</h2>
              <p>Utilizamos su información para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proporcionar, mantener y mejorar nuestros Servicios.</li>
                <li>Crear y mantener su cuenta.</li>
                <li>Procesar sus transacciones.</li>
                <li>Enviar información administrativa, como confirmaciones, facturas y notificaciones.</li>
                <li>Responder a sus comentarios y preguntas.</li>
                <li>Enviar comunicaciones promocionales, si ha dado su consentimiento.</li>
                <li>Analizar tendencias de uso para mejorar la experiencia del usuario.</li>
                <li>Detectar y prevenir fraudes y abusos.</li>
                <li>Cumplir con obligaciones legales.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Compartición de información</h2>
              <p>Podemos compartir su información con:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Proveedores de servicios:</strong> Empresas que nos ayudan a prestar servicios (alojamiento, procesamiento de pagos, etc.).</li>
                <li><strong>Socios comerciales:</strong> Con su consentimiento, para ofrecerle productos o servicios que puedan interesarle.</li>
                <li><strong>Cumplimiento legal:</strong> Cuando sea necesario para cumplir con la ley o proteger nuestros derechos.</li>
                <li><strong>Transferencias comerciales:</strong> En relación con una fusión, adquisición o venta de activos.</li>
              </ul>
              <p>No vendemos sus datos personales a terceros.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Cookies y tecnologías similares</h2>
              <p>
                Utilizamos cookies y tecnologías similares para recopilar información sobre cómo interactúa con nuestros Servicios. Esto nos ayuda a recordar sus preferencias, entender cómo utiliza nuestra plataforma y personalizar su experiencia.
              </p>
              <p>Tipos de cookies que utilizamos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Necesarias:</strong> Esenciales para el funcionamiento de la plataforma.</li>
                <li><strong>Analíticas:</strong> Nos ayudan a entender cómo los usuarios interactúan con nuestros Servicios.</li>
                <li><strong>Funcionales:</strong> Mejoran la funcionalidad y permiten características personalizadas.</li>
                <li><strong>Publicitarias:</strong> Utilizadas para mostrar anuncios relevantes (con su consentimiento).</li>
              </ul>
              <p>
                Puede gestionar las preferencias de cookies a través de la configuración de su navegador o mediante nuestro panel de preferencias de privacidad.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Sus derechos</h2>
              <p>Dependiendo de su ubicación, puede tener los siguientes derechos:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a sus datos personales.</li>
                <li>Corregir datos inexactos.</li>
                <li>Eliminar sus datos (derecho al olvido).</li>
                <li>Restringir u objetar el procesamiento de sus datos.</li>
                <li>Solicitar la portabilidad de sus datos.</li>
                <li>Retirar su consentimiento en cualquier momento.</li>
              </ul>
              <p>
                Para ejercer estos derechos, póngase en contacto con nosotros a través de los datos proporcionados en la sección "Contacto".
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Seguridad de datos</h2>
              <p>
                Implementamos medidas de seguridad técnicas y organizativas diseñadas para proteger sus datos personales contra acceso, divulgación, alteración y destrucción no autorizados. Sin embargo, ninguna transmisión de datos por Internet o sistema de almacenamiento es 100% seguro.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Retención de datos</h2>
              <p>
                Conservamos sus datos personales durante el tiempo necesario para cumplir con los fines descritos en esta Política de Privacidad, a menos que la ley exija un período de retención más largo. Cuando ya no necesitemos sus datos, los eliminaremos de forma segura.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Menores</h2>
              <p>
                Nuestros Servicios no están dirigidos a personas menores de 18 años. No recopilamos a sabiendas información personal de menores. Si cree que hemos recopilado información de un menor, póngase en contacto con nosotros inmediatamente.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Cambios en esta política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. La versión más reciente estará siempre disponible en nuestra plataforma con la fecha de la última actualización. Le recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Contacto</h2>
              <p>
                Si tiene preguntas o inquietudes sobre esta Política de Privacidad o sobre cómo tratamos sus datos personales, póngase en contacto con nosotros en:
              </p>
              <p className="font-medium">
                Email: privacidad@webnex.es<br />
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

export default PrivacyPolicy;
