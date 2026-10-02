import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const CONTACT = "contact@lm-music.com";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Mentions légales — CollabLand" },
      { name: "description", content: "Éditeur, hébergeur et politique de données personnelles de CollabLand." },
      { property: "og:title", content: "Mentions légales — CollabLand" },
      { property: "og:description", content: "Éditeur, hébergeur et données personnelles de CollabLand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Legal,
});

function Legal() {
  return (
    <LegalPage title="Mentions légales" updated="2 octobre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          <strong>RIVIERE Bastien</strong> — Entrepreneur individuel (micro-entreprise)<br />
          47 rue Vivienne, 75002 Paris, France<br />
          SIREN 913 486 072 — SIRET 913 486 072 00022<br />
          RCS Paris 913 486 072<br />
          TVA intracommunautaire : FR66913486072<br />
          Contact : <a className="text-primary" href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
        <p className="mt-2">Directeur de la publication : Bastien Rivière.</p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          L'application est hébergée par Lovable (Lovable Labs Incorporated) sur l'infrastructure de Cloudflare, Inc.,
          101 Townsend St, San Francisco, CA 94107, États-Unis. Les données et fichiers sont stockés via le service
          Lovable Cloud.
        </p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          La marque CollabLand, le logo et l'interface sont la propriété de l'éditeur. Les morceaux, visuels et messages
          publiés restent la propriété de leurs auteurs.
        </p>
      </section>
      <section>
        <h2>Données personnelles (RGPD)</h2>
        <ul>
          <li><strong>Données collectées :</strong> email, nom d'utilisateur, nom affiché, photo et bio, contenus publiés (audio, covers, messages, vocaux), amitiés et notifications.</li>
          <li><strong>Finalité :</strong> fournir le service de collaboration, afficher tes projets aux personnes que tu choisis, envoyer les emails liés à ton compte et le résumé quotidien (désactivable dans les paramètres).</li>
          <li><strong>Base légale :</strong> l'exécution du contrat (les conditions d'utilisation).</li>
          <li><strong>Durée de conservation :</strong> tant que ton compte est actif ; les données sont supprimées dans les 30 jours suivant une demande de suppression.</li>
          <li><strong>Partage :</strong> aucune vente ni cession de données. Seuls les prestataires techniques (hébergement, envoi d'emails) les traitent pour notre compte.</li>
          <li><strong>Tes droits :</strong> accès, rectification, suppression, portabilité et opposition, en écrivant à {CONTACT}. Tu peux aussi saisir la CNIL (cnil.fr).</li>
          <li><strong>Cookies :</strong> uniquement le stockage nécessaire à ta connexion, aucun traceur publicitaire.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
