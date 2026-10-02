import * as React from 'react'
import { BrandLayout, CTA, Note, P } from './_layout'

interface SignupEmailProps { siteName: string; siteUrl: string; recipient: string; confirmationUrl: string }

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <BrandLayout preview="Bienvenue sur CollabLand — confirme ton email" title="Bienvenue dans le studio 🎛️">
    <P>Ton compte CollabLand est presque prêt. Ici, un morceau ne se fait jamais seul :</P>
    <P>
      🎧 <strong>Partage</strong> tes projets en cours avec les amis de ton choix<br />
      🔁 <strong>Fais évoluer</strong> chaque version, de la démo au master<br />
      🎙️ <strong>Discute en vocal</strong> et échange des stems
    </P>
    <P>Confirme ton adresse ({recipient}) pour commencer :</P>
    <CTA href={confirmationUrl} label="Confirmer mon email" />
    <Note>Tu n'as pas créé de compte ? Tu peux ignorer cet email.</Note>
  </BrandLayout>
)

export default SignupEmail
