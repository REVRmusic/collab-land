import * as React from "react";
import { APP_URL, BrandLayout, CTA, Note, P } from "./_layout";

interface AdminNewSignupEmailProps {
  email: string;
  username?: string | null;
  displayName?: string | null;
}

export const AdminNewSignupEmail = ({ email, username, displayName }: AdminNewSignupEmailProps) => {
  const label = displayName || username || email;
  const profileUrl = username ? `${APP_URL}/u/${username}` : `${APP_URL}/admin`;
  return (
    <BrandLayout preview={`Nouvelle inscription : ${label}`} title="Nouvelle inscription 🎉">
      <P>
        Un nouveau compte vient d’être créé sur CollabLand.
      </P>
      <P>
        <strong>Email :</strong> {email}
        {username ? (
          <>
            <br />
            <strong>Pseudo :</strong> @{username}
          </>
        ) : null}
        {displayName ? (
          <>
            <br />
            <strong>Nom :</strong> {displayName}
          </>
        ) : null}
      </P>
      <CTA href={profileUrl} label={username ? "Voir la vitrine" : "Ouvrir l’admin"} />
      <Note>Email automatique réservé aux administrateurs CollabLand.</Note>
    </BrandLayout>
  );
};

export default AdminNewSignupEmail;
