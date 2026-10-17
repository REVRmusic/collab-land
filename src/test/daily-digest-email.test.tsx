import * as React from "react";
import { describe, expect, it } from "vitest";
import { render } from "@react-email/render";
import { DailyDigestEmail } from "@/lib/email-templates/daily-digest";
import { formatDigestItem } from "@/lib/email-digest.server";

describe("DailyDigestEmail", () => {
  it("renders correctly to HTML and plain text with activities", async () => {
    const items = [
      {
        id: "notif-1",
        type: "new_version",
        icon: "🎧",
        actorName: "David",
        actionText: "a publié la V2 de",
        projectTitle: "Summer Breeze",
        projectUrl: "https://collab-land.lovable.app/projects/123",
      },
      {
        id: "notif-2",
        type: "new_message",
        icon: "🎙️",
        actorName: "Sarah",
        actionText: "a envoyé un message vocal dans",
        projectTitle: "Summer Breeze",
        projectUrl: "https://collab-land.lovable.app/projects/123",
      },
    ];

    const element = React.createElement(DailyDigestEmail, {
      displayName: "Bastien",
      username: "revr",
      items,
      siteUrl: "https://collab-land.lovable.app",
      totalPendingCount: 2,
    });

    const html = await render(element);
    const text = await render(element, { plainText: true });

    expect(html).toContain("Ton récapitulatif du jour");
    expect(html).toContain("Bastien");
    expect(html).toContain("David");
    expect(html).toContain("Summer Breeze");
    expect(html).toContain("Ouvrir CollabLand");
    expect(html).toContain("Résumé quotidien");

    expect(text.toLowerCase()).toContain("ton récapitulatif du jour");
    expect(text).toContain("Bastien");
    expect(text).toContain("David");
    expect(text).toContain("Summer Breeze");
  });

  it("formats different notification types accurately", () => {
    const siteUrl = "https://collab-land.lovable.app";
    const versionItem = formatDigestItem(
      {
        id: "n1",
        user_id: "u1",
        type: "new_version",
        created_at: new Date().toISOString(),
        project_id: "p1",
        data: { title: "Track Alpha", version: 3 },
        actor_id: "a1",
        actor: { username: "producer_x", display_name: "Producer X" },
      },
      siteUrl,
    );

    expect(versionItem.icon).toBe("🎧");
    expect(versionItem.actionText).toContain("V3");
    expect(versionItem.projectTitle).toBe("Track Alpha");
    expect(versionItem.projectUrl).toBe("https://collab-land.lovable.app/projects/p1");
  });
});
