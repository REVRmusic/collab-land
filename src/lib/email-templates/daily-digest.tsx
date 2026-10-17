import * as React from "react";
import { Link, Section, Text } from "@react-email/components";
import { BrandLayout, CTA, Note, P } from "./_layout";
import { SITE_URL } from "@/lib/email-config";

export interface DigestItem {
  id: string;
  type: string;
  icon: string;
  actorName: string;
  actionText: string;
  projectTitle?: string | null;
  projectUrl?: string | null;
  detail?: string | null;
}

export interface DailyDigestEmailProps {
  displayName?: string | null;
  username: string;
  items: DigestItem[];
  siteUrl?: string;
  totalPendingCount?: number;
}

export const DailyDigestEmail = ({
  displayName,
  username,
  items,
  siteUrl = SITE_URL,
  totalPendingCount,
}: DailyDigestEmailProps) => {
  const count = totalPendingCount ?? items.length;
  const name = displayName || (username ? `@${username}` : "producteur");
  const preview = `${count} nouveauté${count > 1 ? "s" : ""} sur tes projets et amis`;

  return (
    <BrandLayout preview={preview} title="Ton récapitulatif du jour 🎧">
      <P>
        Salut <strong>{name}</strong>,
      </P>
      <P>
        Voici les nouveautés et activités enregistrées sur tes projets et dans ton cercle ces dernières 24 heures :
      </P>

      <Section style={listSection}>
        {items.map((item) => (
          <div key={item.id} style={itemCard}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0}>
              <tbody>
                <tr>
                  <td width="36" valign="top" style={{ paddingRight: "12px" }}>
                    <div style={iconBadge}>{item.icon}</div>
                  </td>
                  <td valign="top">
                    <Text style={itemText}>
                      <strong style={{ color: "#17151c" }}>{item.actorName}</strong>{" "}
                      {item.actionText}
                      {item.projectTitle ? (
                        <>
                          {" "}
                          {item.projectUrl ? (
                            <Link href={item.projectUrl} style={projectLink}>
                              « {item.projectTitle} »
                            </Link>
                          ) : (
                            <strong style={{ color: "#17151c" }}>« {item.projectTitle} »</strong>
                          )}
                        </>
                      ) : null}
                    </Text>
                    {item.detail ? <Text style={detailText}>{item.detail}</Text> : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </Section>

      {totalPendingCount && totalPendingCount > items.length ? (
        <Text style={moreText}>
          + {totalPendingCount - items.length} autre{totalPendingCount - items.length > 1 ? "s" : ""} notification
          {totalPendingCount - items.length > 1 ? "s" : ""} dans l'application.
        </Text>
      ) : null}

      <CTA href={siteUrl} label="Ouvrir CollabLand" />

      <Note>
        Tu reçois cet e-mail car l'option « Résumé quotidien » est activée sur ton profil.
        <br />
        Tu peux la désactiver ou modifier tes préférences à tout moment dans tes{" "}
        <Link href={`${siteUrl}/settings`} style={{ color: "#7c3aed", textDecoration: "underline" }}>
          paramètres
        </Link>.
      </Note>
    </BrandLayout>
  );
};

const listSection = {
  margin: "18px 0 10px",
};

const itemCard = {
  backgroundColor: "#ffffff",
  border: "1px solid #e7e4f0",
  borderRadius: "14px",
  padding: "12px 14px",
  marginBottom: "10px",
};

const iconBadge = {
  width: "32px",
  height: "32px",
  borderRadius: "8px",
  backgroundColor: "#f4f1fa",
  fontSize: "17px",
  lineHeight: "32px",
  textAlign: "center" as const,
};

const itemText = {
  fontSize: "14px",
  lineHeight: "1.45",
  color: "#3f3b4a",
  margin: "0",
};

const projectLink = {
  color: "#7c3aed",
  fontWeight: 600,
  textDecoration: "none",
};

const detailText = {
  fontSize: "12px",
  lineHeight: "1.4",
  color: "#8a8597",
  margin: "4px 0 0",
};

const moreText = {
  fontSize: "13px",
  color: "#6b6678",
  textAlign: "center" as const,
  margin: "8px 0 16px",
};

export default DailyDigestEmail;
