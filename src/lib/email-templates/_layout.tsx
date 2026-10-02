import * as React from 'react'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components'

export const APP_URL = 'https://collab-land.lovable.app'
const LOGO_URL = `${APP_URL}/__l5e/assets-v1/812b59ea-8d5b-459c-91a0-474d0a9a5493/collabland-logo.png`

export const BrandLayout = ({
  preview, title, children,
}: { preview: string; title: string; children: React.ReactNode }) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section style={brandRow}>
          <Img src={LOGO_URL} width="44" height="44" alt="CollabLand" style={{ display: 'inline-block', borderRadius: '12px', verticalAlign: 'middle' }} />
          <span style={brandName}>CollabLand</span>
        </Section>
        <Section style={card}>
          <Heading style={h1}>{title}</Heading>
          {children}
        </Section>
        <Text style={footer}>
          CollabLand — Faites de la musique ensemble
          <br />
          <Link href={`${APP_URL}/terms`} style={footerLink}>Conditions d'utilisation</Link>
          {' · '}
          <Link href={`${APP_URL}/legal`} style={footerLink}>Mentions légales</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const P = ({ children }: { children: React.ReactNode }) => <Text style={text}>{children}</Text>

export const CTA = ({ href, label }: { href: string; label: string }) => (
  <>
    <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
      <Button href={href} style={button}>{label}</Button>
    </Section>
    <Text style={small}>
      Le bouton ne fonctionne pas ? Copie ce lien dans ton navigateur :<br />
      <Link href={href} style={{ color: '#7c3aed', wordBreak: 'break-all' }}>{href}</Link>
    </Text>
  </>
)

export const Note = ({ children }: { children: React.ReactNode }) => (
  <>
    <Hr style={{ borderColor: '#ece9f3', margin: '24px 0 16px' }} />
    <Text style={small}>{children}</Text>
  </>
)

export const Code = ({ value }: { value: string }) => <Text style={code}>{value}</Text>

const font = "'DM Sans', 'Helvetica Neue', Arial, sans-serif"
const main = { backgroundColor: '#ffffff', fontFamily: font, margin: 0, padding: '24px 0' }
const outer = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const brandRow = { padding: '8px 0 20px', textAlign: 'center' as const }
const brandName = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '22px', fontWeight: 700, color: '#17151c', marginLeft: '10px', verticalAlign: 'middle' }
const card = { backgroundColor: '#faf8ff', border: '1px solid #ece9f3', borderRadius: '20px', padding: '36px 32px' }
const h1 = { fontFamily: "'Space Grotesk', Arial, sans-serif", fontSize: '26px', lineHeight: '1.25', fontWeight: 700, color: '#17151c', margin: '0 0 18px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#3f3b4a', margin: '0 0 14px' }
const small = { fontSize: '12px', lineHeight: '1.5', color: '#8a8597', margin: '0' }
const button = {
  backgroundColor: '#7c3aed',
  backgroundImage: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
  color: '#ffffff', fontSize: '15px', fontWeight: 600, borderRadius: '12px',
  padding: '14px 28px', textDecoration: 'none', display: 'inline-block',
}
const code = { fontFamily: 'monospace', fontSize: '30px', letterSpacing: '8px', fontWeight: 700, color: '#7c3aed', textAlign: 'center' as const, margin: '20px 0' }
const footer = { fontSize: '12px', lineHeight: '1.7', color: '#8a8597', textAlign: 'center' as const, margin: '24px 0 0' }
const footerLink = { color: '#8a8597', textDecoration: 'underline' }
