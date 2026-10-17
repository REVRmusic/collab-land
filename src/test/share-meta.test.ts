import { describe, expect, it } from "vitest";
import {
  escapeXml,
  wrapText,
  projectOgSvg,
  profileOgSvg,
  defaultOgSvg,
  buildProjectShareMeta,
  buildProfileShareMeta,
} from "@/lib/share-meta";

describe("share-meta utilities", () => {
  it("escapes XML special characters properly", () => {
    expect(escapeXml("Rock & Roll <Live> '2026' \"Remix\"")).toBe(
      "Rock &amp; Roll &lt;Live&gt; &apos;2026&apos; &quot;Remix&quot;",
    );
    expect(escapeXml(null)).toBe("");
  });

  it("wraps text within character limits", () => {
    const text = "Ceci est une description longue pour tester le retour à la ligne automatique";
    const lines = wrapText(text, 25, 3);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.length).toBeLessThanOrEqual(3);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(30);
    }
  });

  it("builds rich project share metadata", () => {
    const meta = buildProjectShareMeta(
      {
        id: "p123",
        title: "Panic In The Fox Ft. Loadjaxx",
        description: "Morceau club orienté peak time.",
        help_needed: "Mix du drop plus large et solo de synthé.",
        genre: "Electro House",
        bpm: 128,
        musical_key: "F Minor",
        cover_url: "covers/cover.jpg",
        created_at: new Date().toISOString(),
        version_count: 4,
        latest_version_number: 4,
        owner_name: "Bastien",
        owner_username: "revr",
        owner_avatar_url: null,
      },
      "p123",
      "https://collab-land.lovable.app",
    );

    expect(meta.title).toContain("Panic In The Fox Ft. Loadjaxx");
    expect(meta.title).toContain("Bastien");
    expect(meta.description).toContain("4 versions");
    expect(meta.description).toContain("128 BPM");
    expect(meta.description).toContain("F Minor");
    expect(meta.description).toContain("Mix du drop plus large");
    expect(meta.imageUrl).toBe("https://collab-land.lovable.app/og/projects/p123");
  });

  it("generates comprehensive project OG SVG with all requested elements", () => {
    const svg = projectOgSvg({
      title: "Panic In The Fox Ft. Loadjaxx & Friends",
      ownerName: "Bastien DJ",
      ownerUsername: "revr",
      versionCount: 3,
      latestVersionNumber: 3,
      genre: "Electro House",
      bpm: 128,
      musicalKey: "F Minor",
      helpNeeded: "Besoin d'un drop plus puissant et retours sur le mix vocal.",
      seed: "p123:Panic In The Fox",
    });

    // Structure SVG valide
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"');
    expect(svg).toContain("</svg>");

    // Titre et nom de l'artiste
    expect(svg).toContain("Panic In The Fox");
    expect(svg).toContain("Bastien DJ");
    expect(svg).toContain("@revr");

    // Nombre de versions
    expect(svg).toContain("3 versions");
    expect(svg).toContain("V3");

    // Métadonnées musicales
    expect(svg).toContain("128 BPM");
    expect(svg).toContain("F Minor");
    expect(svg).toContain("Electro House");

    // Modifications souhaitées
    expect(svg).toContain("MODIFICATIONS SOUHAITÉES PAR LE DJ");
    expect(svg).toContain("Besoin d&apos;un drop plus puissant");

    // Marque
    expect(svg).toContain("CollabLand");
    expect(svg).toContain("PROJET EN COURS");
  });

  it("embeds cover image when coverDataUri is provided", () => {
    const fakeDataUri = "data:image/jpeg;base64,AAAA";
    const svg = projectOgSvg({
      title: "Summer Breeze",
      ownerName: "DJ Alex",
      ownerUsername: "alex",
      versionCount: 2,
      coverDataUri: fakeDataUri,
    });

    expect(svg).toContain(fakeDataUri);
    expect(svg).toContain('clip-path="url(#coverClip)"');
  });

  it("generates profile OG SVG with artist info and stats", () => {
    const svg = profileOgSvg({
      name: "Tamdak Music",
      username: "tamdak",
      bio: "Producteur Bass House & Techno basé à Montpellier. Ouvert aux collabs.",
      projectCount: 5,
    });

    expect(svg).toContain("Tamdak Music");
    expect(svg).toContain("@tamdak");
    expect(svg).toContain("5 projets en écoute");
    expect(svg).toContain("Bass House &amp; Techno");
    expect(svg).toContain("VITRINE ARTISTE / DJ");
  });

  it("generates default OG SVG for main pages", () => {
    const svg = defaultOgSvg();

    expect(svg).toContain("CollabLand");
    expect(svg).toContain("Faites de la musique ensemble");
  });

  it("rasterizes SVG to valid PNG binary with renderSvgToPng", async () => {
    const { renderSvgToPng } = await import("@/lib/share-meta.server");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="315"><rect width="600" height="315" fill="#140f22"/><text x="40" y="80" font-family="'Space Grotesk'" font-size="32" fill="#ffffff">CollabLand Test</text></svg>`;
    const png = await renderSvgToPng(svg);

    expect(png).not.toBeNull();
    expect(png!.length).toBeGreaterThan(100);
    // Check PNG magic bytes: 0x89, 'P', 'N', 'G'
    expect(png![0]).toBe(0x89);
    expect(png![1]).toBe(0x50);
    expect(png![2]).toBe(0x4e);
    expect(png![3]).toBe(0x47);
  });
});
