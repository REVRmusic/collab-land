import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — CollabLand" },
      { name: "description", content: "Les règles d'utilisation de CollabLand, la plateforme de collaboration entre producteurs." },
      { property: "og:title", content: "Conditions d'utilisation — CollabLand" },
      { property: "og:description", content: "Les règles d'utilisation de CollabLand." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="2 octobre 2026">
      <section>
        <h2>1. Le service</h2>
        <p>CollabLand permet aux producteurs de musique de partager des projets en cours, d'en publier des versions, d'échanger des messages et des vocaux, de proposer des covers et de demander des stems. Le service est édité par RIVIERE Bastien (voir les <Link to="/legal" className="text-primary">mentions légales</Link>). Créer un compte signifie accepter ces conditions.</p>
      </section>
      <section>
        <h2>2. Ton compte</h2>
        <p>Tu dois donner une adresse email valide et garder ton mot de passe secret. Tu es responsable de ce qui est fait depuis ton compte. Un seul compte par personne ; ton nom d'utilisateur ne doit pas usurper l'identité de quelqu'un.</p>
      </section>
      <section>
        <h2>3. Tes contenus</h2>
        <p>Tu restes <strong>propriétaire</strong> de tout ce que tu publies (morceaux, versions, covers, messages, vocaux). Tu accordes seulement à CollabLand le droit, non exclusif et gratuit, de stocker et d'afficher ces contenus aux personnes que tu as choisies, pour faire fonctionner le service. Ce droit prend fin quand tu supprimes le contenu ou ton compte.</p>
        <p className="mt-2">Les collaborateurs n'obtiennent aucun droit d'exploitation sur ta musique. Tout accord sur les stems, les crédits ou le partage des droits se fait directement entre vous.</p>
      </section>
      <section>
        <h2>4. Droits d'auteur et comportement</h2>
        <ul>
          <li>Ne publie que des contenus dont tu détiens les droits ou que tu as l'autorisation d'utiliser (samples compris).</li>
          <li>Pas de contenus illégaux, haineux, harcelants ou à caractère sexuel impliquant des mineurs.</li>
          <li>Ne télécharge et ne redistribue pas les projets des autres sans leur accord.</li>
        </ul>
        <p className="mt-2">Pour signaler un contenu, écris à l'adresse indiquée dans les mentions légales.</p>
      </section>
      <section>
        <h2>5. Liens externes</h2>
        <p>Les liens de téléchargement (WeTransfer, SwissTransfer, Google Drive, Dropbox, iCloud…) renvoient vers des services tiers dont CollabLand n'est pas responsable. Vérifie ce que tu partages.</p>
      </section>
      <section>
        <h2>6. Suspension et suppression</h2>
        <p>Tu peux supprimer tes contenus à tout moment, ou demander la suppression de ton compte. En cas de manquement à ces conditions, nous pouvons retirer un contenu ou suspendre un compte.</p>
      </section>
      <section>
        <h2>7. Responsabilité</h2>
        <p>Le service est fourni tel quel. Nous faisons notre possible pour qu'il soit disponible et que les fichiers soient conservés, mais garde toujours une sauvegarde de tes projets. Nous ne sommes pas responsables des échanges entre utilisateurs.</p>
      </section>
      <section>
        <h2>8. Modifications et droit applicable</h2>
        <p>Ces conditions peuvent évoluer ; tu seras prévenu en cas de changement important. Elles sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action devant les tribunaux compétents de Paris.</p>
      </section>
    </LegalPage>
  );
}
