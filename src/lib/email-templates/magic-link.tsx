import * as React from 'react'
import { BrandLayout, CTA, Note, P } from './_layout'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <BrandLayout preview="Ton lien de connexion CollabLand" title="Ton lien de connexion">
    <P>Clique sur le bouton pour te connecter à CollabLand. Ce lien expire bientôt.</P>
    <CTA href={confirmationUrl} label="Me connecter" />
    <Note>Tu n'as pas demandé ce lien ? Tu peux ignorer cet email.</Note>
  </BrandLayout>
)

export default MagicLinkEmail
