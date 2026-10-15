import Link from "next/link";
import { OFFER } from "@/core/landing/domain/content";
import {
    BUSINESS,
    formatList,
    PAYMENT_PROCESSOR,
    PROCESSOR_IS_MERCHANT_OF_RECORD,
    sellerLine,
} from "../domain/business";
import {
    BILLING_DISPUTES,
    DATA_RETENTION,
    LEGAL_ROUTES,
    LEGAL_VERSIONS,
    PRIVACY_COMMITMENTS,
    REFUND_POLICY,
    TERMS_CHANGE_NOTICE_DAYS,
} from "../domain/policies";
import {
    Callout,
    ClauseList,
    LegalDocument,
    type LegalSection,
    SubClause,
} from "./legal-document";

const email = (
    <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
);

const sellerIdentity = !BUSINESS.legalName
    ? null
    : BUSINESS.entityType === "company"
      ? `${BUSINESS.legalName}, empresa constituida conforme a las leyes de ${BUSINESS.country}, con domicilio en ${BUSINESS.registeredAddress}`
      : `${BUSINESS.legalName}, persona natural que opera conforme a las leyes de ${BUSINESS.country}`;

const SECTIONS: LegalSection[] = [
    {
        id: "aceptacion",
        title: "Introducción y aceptación",
        content: (
            <>
                <p>
                    {sellerIdentity ? (
                        <>
                            {BUSINESS.brand} es un servicio operado por{" "}
                            <strong>{sellerIdentity}</strong> (“nosotros”).
                        </>
                    ) : (
                        <>
                            <strong>{BUSINESS.brand}</strong> (“nosotros”) es un
                            servicio que opera conforme a las leyes de{" "}
                            {BUSINESS.country}.
                        </>
                    )}{" "}
                    Estos Términos y Condiciones (“Términos”) regulan el acceso
                    y uso de los servicios de lecturas astrológicas generadas
                    con inteligencia artificial disponibles en{" "}
                    {BUSINESS.websiteUrl} (el “Servicio”).
                </p>
                <p>
                    Al responder el cuestionario, completar una compra o usar el
                    Servicio de cualquier otra forma, confirmas que: (a) tienes
                    al menos {PRIVACY_COMMITMENTS.minimumAge} años; (b) leíste,
                    entendiste y aceptas estos Términos; (c) aceptas nuestra{" "}
                    <Link href={LEGAL_ROUTES.privacy}>
                        Política de Privacidad
                    </Link>
                    ; y (d) actúas en nombre propio.
                </p>
                <Callout>
                    Si no estás de acuerdo con estos Términos, no uses el
                    Servicio. Seguir usándolo después de una actualización
                    implica que aceptas la versión revisada.
                </Callout>
            </>
        ),
    },
    {
        id: "servicio",
        title: "Descripción del Servicio",
        content: (
            <>
                <SubClause title="Qué ofrecemos">
                    <p>
                        {BUSINESS.brand} es una plataforma digital de
                        entretenimiento y autoconocimiento. Eliges un tipo de
                        lectura, respondes alrededor de {OFFER.questions}{" "}
                        preguntas y, de forma opcional, indicas tu fecha, hora y
                        lugar de nacimiento. Con esa información, un sistema de
                        inteligencia artificial genera una{" "}
                        <strong>
                            lectura astrológica digital personalizada
                        </strong>
                        .
                    </p>
                    <p>
                        Junto con la lectura obtienes acceso a un{" "}
                        <strong>asistente conversacional de IA</strong> durante{" "}
                        {OFFER.chatHours} horas, contadas desde tu primera
                        pregunta (no desde el pago). Al terminar ese plazo la
                        sesión de chat se cierra y no puede extenderse, pero
                        conservas acceso a tu lectura.
                    </p>
                </SubClause>
                <SubClause title="Naturaleza digital del Servicio">
                    <p>
                        El Servicio es un producto digital e intangible que se
                        entrega por internet. Al confirmarse el pago, la lectura
                        se genera y se pone a tu disposición de inmediato,
                        normalmente en pocos minutos. Por tratarse de una
                        entrega digital inmediata, los reembolsos se rigen por
                        la sección{" "}
                        <a href="#reembolsos">Política de reembolsos</a>.
                    </p>
                </SubClause>
                <SubClause title="Contenido generado por IA, sin intervención humana">
                    <p>
                        Todas las lecturas y respuestas del chat son{" "}
                        <strong>generadas por inteligencia artificial</strong>.
                        Ninguna persona realiza lecturas en vivo, consultas ni
                        sesiones individuales. El asistente no es un astrólogo,
                        terapeuta ni profesional humano.
                    </p>
                </SubClause>
                <SubClause title="Proveedores de modelos de IA">
                    <p>
                        El Servicio utiliza modelos de inteligencia artificial
                        de terceros, entre ellos{" "}
                        {formatList(BUSINESS.aiProviders)}. El rendimiento y la
                        disponibilidad del Servicio pueden verse afectados por
                        el estado operativo de esos proveedores. Te avisaremos
                        oportunamente de interrupciones significativas.
                    </p>
                </SubClause>
            </>
        ),
    },
    {
        id: "acceso",
        title: "Acceso y responsabilidad del usuario",
        content: (
            <>
                <p>
                    Para recibir tu lectura debes proporcionar un correo
                    electrónico válido. Eres responsable de la exactitud de la
                    información que ingresas, de mantener la confidencialidad de
                    tus enlaces o credenciales de acceso y de toda la actividad
                    realizada con ellos.
                </p>
                <ClauseList
                    items={[
                        <>
                            Avísanos de inmediato a {email} si detectas un uso
                            no autorizado.
                        </>,
                        "No compartas tus credenciales ni tu enlace de acceso con terceros.",
                        "Mantén actualizado el correo con el que realizaste la compra.",
                    ]}
                />
            </>
        ),
    },
    {
        id: "precio",
        title: "Producto y precio",
        content: (
            <>
                <p>
                    Cada lectura se vende como una{" "}
                    <strong>compra única de {OFFER.price}</strong> e incluye la
                    lectura personalizada, el acceso permanente a ella y{" "}
                    {OFFER.chatHours} horas de conversación con el asistente. El
                    precio se muestra antes de iniciar el cuestionario y
                    nuevamente en la página de pago.
                </p>
                <p>
                    <strong>
                        No es una suscripción, no hay renovaciones automáticas
                        ni cobros recurrentes
                    </strong>
                    , y no guardamos tu tarjeta para cobros futuros. Por eso no
                    existe un proceso de cancelación de suscripción: cada compra
                    es independiente.
                </p>
            </>
        ),
    },
    {
        id: "pago",
        title: "Facturación y pago",
        content: (
            <>
                <SubClause title="Autorización de compra única">
                    <p>
                        Cada compra es una transacción única. Al completarla,
                        autorizas un único cargo a tu tarjeta de crédito o
                        débito por el monto mostrado en el checkout.
                    </p>
                </SubClause>
                <SubClause title="Procesador de pagos">
                    <p>
                        Los pagos son procesados por{" "}
                        <strong>{PAYMENT_PROCESSOR}</strong>,{" "}
                        {PROCESSOR_IS_MERCHANT_OF_RECORD
                            ? "que actúa como comerciante registrado (Merchant of Record) y procesador de pagos certificado PCI-DSS."
                            : "procesador de pagos certificado PCI-DSS."}{" "}
                        Los datos de tu tarjeta se ingresan directamente en{" "}
                        {PAYMENT_PROCESSOR} y{" "}
                        <strong>
                            nunca se almacenan en nuestros servidores
                        </strong>
                        . En tu estado de cuenta el cargo aparecerá como{" "}
                        <strong>{BUSINESS.billingDescriptor}</strong>.
                    </p>
                </SubClause>
                <SubClause title="Impuestos">
                    <p>
                        Según tu país de residencia, pueden aplicarse impuestos
                        indirectos (como IGV, IVA o similares), que se
                        calcularán y mostrarán en el checkout antes de que
                        confirmes el pago.
                    </p>
                </SubClause>
            </>
        ),
    },
    {
        id: "reembolsos",
        title: "Política de reembolsos",
        content: (
            <>
                <p>
                    Por la naturaleza inmediata e intangible del Servicio, las
                    compras en general no son reembolsables, salvo en los casos
                    siguientes:
                </p>
                <ClauseList
                    items={[
                        <>
                            <strong>Garantía de primera compra:</strong>{" "}
                            reembolso total si lo solicitas dentro de los{" "}
                            {REFUND_POLICY.firstPurchaseDays} días siguientes a
                            tu primera compra en {BUSINESS.brand}, sin necesidad
                            de justificar el motivo.
                        </>,
                        <>
                            <strong>
                                Lectura no entregada o falla técnica:
                            </strong>{" "}
                            reembolso total si no recibiste tu lectura o si una
                            falla atribuible a nosotros te impidió usar el chat,
                            solicitándolo dentro de los{" "}
                            {REFUND_POLICY.technicalIssueDays} días posteriores
                            al pago.
                        </>,
                        <>
                            <strong>Cobro duplicado:</strong> reembolso total de
                            cualquier cargo duplicado por error, dentro de los{" "}
                            {REFUND_POLICY.technicalIssueDays} días posteriores
                            al pago.
                        </>,
                        <>
                            <strong>Derechos legales:</strong> se respetan los
                            derechos que te otorgue la normativa de protección
                            al consumidor aplicable.
                        </>,
                    ]}
                />
                <SubClause title="Cómo solicitar un reembolso">
                    <p>
                        Escríbenos a {email} con el correo de tu compra, el
                        número de orden y el motivo. Confirmaremos la recepción
                        en un máximo de {REFUND_POLICY.acknowledgeBusinessDays}{" "}
                        días hábiles y procesaremos los reembolsos aprobados en{" "}
                        {REFUND_POLICY.processingBusinessDays} días hábiles. El
                        dinero se devuelve al mismo medio de pago a través de{" "}
                        {PAYMENT_PROCESSOR}; el plazo en que se refleja depende
                        de tu banco.
                    </p>
                </SubClause>
                <SubClause title="No reembolsable">
                    <ClauseList
                        items={[
                            `Solicitudes presentadas después de ${REFUND_POLICY.technicalIssueDays} días desde el pago.`,
                            "Compras posteriores a la primera, salvo falla técnica o cobro duplicado.",
                            "Desacuerdo con el contenido o las interpretaciones de una lectura entregada correctamente, fuera de la garantía de primera compra.",
                            "Accesos suspendidos por incumplir estos Términos o la Política de Uso Aceptable.",
                        ]}
                    />
                </SubClause>
            </>
        ),
    },
    {
        id: "disputas",
        title: "Disputas de cobro",
        content: (
            <p>
                Si crees que hay un error en un cargo, contáctanos a {email}{" "}
                antes de iniciar un contracargo con tu banco. Respondemos en un
                máximo de {BILLING_DISPUTES.responseBusinessDays} días hábiles y
                resolvemos los errores de cobro confirmados en un máximo de{" "}
                {BILLING_DISPUTES.resolutionBusinessDays} días hábiles.
            </p>
        ),
    },
    {
        id: "contenido-ia",
        title: "Contenido generado por IA y propiedad intelectual",
        content: (
            <>
                <SubClause title="Tus lecturas">
                    <p>
                        El contenido generado a partir de tus datos (las
                        “Respuestas”) es para tu uso personal. Puedes guardarlo
                        y compartirlo para cualquier fin lícito compatible con
                        estos Términos.
                    </p>
                </SubClause>
                <SubClause title="Lo que nos envías">
                    <p>
                        Al enviarnos información (respuestas del cuestionario,
                        datos de nacimiento y mensajes del chat), nos otorgas
                        una licencia limitada y no exclusiva para procesarla
                        únicamente con el fin de prestarte el Servicio.{" "}
                        <strong>
                            No usamos tu información para entrenar modelos de
                            inteligencia artificial
                        </strong>{" "}
                        sin tu consentimiento expreso.
                    </p>
                </SubClause>
                <SubClause title="Exactitud">
                    <p>
                        El contenido generado por IA puede contener errores,
                        imprecisiones o contradicciones. No garantizamos un
                        resultado específico, y no somos responsables por el
                        contenido producido por modelos de terceros.
                    </p>
                </SubClause>
                <SubClause title="Nuestra marca y plataforma">
                    <p>
                        La marca {BUSINESS.brand}, el diseño, el software y los
                        textos del sitio nos pertenecen y no pueden copiarse ni
                        explotarse sin autorización previa por escrito.
                    </p>
                </SubClause>
            </>
        ),
    },
    {
        id: "uso-aceptable",
        title: "Uso aceptable",
        content: (
            <>
                <p>
                    Puedes usar el Servicio solo con fines lícitos y personales.
                    Te comprometes a <strong>no</strong>:
                </p>
                <ClauseList
                    items={[
                        "Generar o solicitar contenido ilegal, difamatorio, acosador, discriminatorio o fraudulento.",
                        "Ingresar datos personales de terceros sin su consentimiento, o usar el Servicio para investigar, vigilar o perfilar a otra persona.",
                        "Generar contenido que sexualice a menores o vulnere normas de protección infantil.",
                        "Crear deepfakes o contenido que suplante a personas reales.",
                        "Producir malware, phishing o herramientas de ataque.",
                        "Vulnerar o eludir las medidas de seguridad del Servicio, o los límites de la sesión de chat.",
                        "Revender o sublicenciar el acceso sin autorización escrita.",
                        "Infringir cualquier ley, regulación o norma de las redes de tarjetas.",
                    ]}
                />
                <SubClause title="Prohibiciones específicas de IA">
                    <ClauseList
                        items={[
                            "Usar las entradas, respuestas o derivados del Servicio para entrenar, ajustar, evaluar o destilar modelos de IA que compitan con el Servicio.",
                            "Extraer sistemáticamente o a gran escala las respuestas del modelo.",
                            "Presentar el contenido generado como si fuera obra de un profesional humano (médico, psicólogo, abogado o asesor financiero) en contextos donde pueda causar daño.",
                        ]}
                    />
                </SubClause>
            </>
        ),
    },
    {
        id: "datos",
        title: "Datos, privacidad y seguridad",
        content: (
            <p>
                El uso del Servicio se rige por nuestra{" "}
                <Link href={LEGAL_ROUTES.privacy}>Política de Privacidad</Link>.
                Los datos de tarjeta se procesan exclusivamente a través de{" "}
                {PAYMENT_PROCESSOR}, procesador certificado PCI-DSS, y no se
                almacenan en nuestros servidores. Tus lecturas se conservan
                mientras tengas acceso activo y hasta{" "}
                {DATA_RETENTION.readingMonthsAfterLastAccess} meses después de
                tu último acceso, salvo que solicites antes su eliminación.
            </p>
        ),
    },
    {
        id: "responsabilidad",
        title: "Descargos y limitación de responsabilidad",
        content: (
            <>
                <Callout>
                    <strong>Aviso sobre el contenido.</strong> {BUSINESS.brand}{" "}
                    ofrece contenido de{" "}
                    <strong>entretenimiento y autoconocimiento</strong> generado
                    por inteligencia artificial. La astrología no es una
                    disciplina científica y las lecturas no predicen hechos
                    futuros. El contenido no sustituye asesoría médica,
                    psicológica, legal ni financiera, y no debe usarse para
                    tomar decisiones importantes sobre tu salud, tus finanzas o
                    tu seguridad. Si atraviesas una crisis emocional, busca
                    ayuda profesional o comunícate con los servicios de
                    emergencia de tu país.
                </Callout>
                <p>
                    El Servicio se presta “tal cual” y “según disponibilidad”,
                    sin garantías de ningún tipo, expresas o implícitas,
                    incluidas las de exactitud del contenido generado por IA.
                </p>
                <p>
                    En la máxima medida permitida por la ley, no seremos
                    responsables por daños indirectos, incidentales,
                    consecuentes o punitivos. Nuestra responsabilidad total no
                    excederá el monto que nos hayas pagado en los 12 meses
                    anteriores al hecho que origine el reclamo. Nada en estos
                    Términos limita los derechos irrenunciables que te otorga la
                    ley de protección al consumidor.
                </p>
            </>
        ),
    },
    {
        id: "terminacion",
        title: "Vigencia y terminación",
        content: (
            <p>
                Estos Términos están vigentes mientras uses el Servicio. Podemos
                suspender o cancelar tu acceso si incumples gravemente estos
                Términos, si sospechamos actividad fraudulenta o si la ley lo
                exige. Si lo hacemos por motivos distintos a tu incumplimiento,
                te reembolsaremos el monto de cualquier lectura o sesión pagada
                que no hayas podido usar. Puedes solicitar la eliminación de tu
                información en cualquier momento escribiendo a {email}.
            </p>
        ),
    },
    {
        id: "ley-aplicable",
        title: "Ley aplicable y reclamos",
        content: (
            <p>
                Estos Términos se rigen por las leyes de la República del{" "}
                {BUSINESS.country}, incluido el Código de Protección y Defensa
                del Consumidor (Ley N.º 29571). Antes de iniciar cualquier
                procedimiento formal, escríbenos a {email} para buscar una
                solución directa. Puedes además presentar un reclamo ante el
                INDECOPI o la autoridad de protección al consumidor de tu país.
            </p>
        ),
    },
    {
        id: "cambios",
        title: "Cambios a estos Términos",
        content: (
            <p>
                Podemos actualizar estos Términos. Si el cambio es relevante, te
                avisaremos por correo electrónico con al menos{" "}
                {TERMS_CHANGE_NOTICE_DAYS} días de anticipación a su entrada en
                vigor. Las compras ya realizadas se rigen por la versión vigente
                al momento del pago. Si alguna disposición resulta inválida, el
                resto mantiene plena vigencia.
            </p>
        ),
    },
    {
        id: "contacto",
        title: "Contacto",
        content: (
            <>
                <p>
                    Para soporte, facturación, reembolsos, privacidad o
                    seguridad, escríbenos a un único canal atendido:
                </p>
                <ClauseList
                    items={[
                        <>Correo: {email}</>,
                        `Horario de atención: ${BUSINESS.businessHours}`,
                        `Titular: ${sellerLine()}`,
                        ...(BUSINESS.entityType === "company"
                            ? [`Domicilio: ${BUSINESS.registeredAddress}`]
                            : []),
                    ]}
                />
                <p>
                    Al usar el Servicio o marcar “Acepto” en el checkout,
                    reconoces y aceptas estos Términos.
                </p>
            </>
        ),
    },
];

export function TermsDocument() {
    const { version, updatedAt } = LEGAL_VERSIONS.terms;
    return (
        <LegalDocument
            kicker={`${BUSINESS.brand} · Legal`}
            title="Términos y Condiciones"
            version={version}
            updatedAt={updatedAt}
            intro={
                <p>
                    Lo esencial: pagas {OFFER.price} una sola vez, sin
                    suscripción. Recibes una lectura generada por IA y{" "}
                    {OFFER.chatHours} horas de chat. Si es tu primera compra,
                    tienes {REFUND_POLICY.firstPurchaseDays} días para pedir tu
                    dinero de vuelta. El detalle completo está abajo.
                </p>
            }
            sections={SECTIONS}
        />
    );
}
