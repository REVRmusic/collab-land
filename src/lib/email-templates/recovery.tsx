import * as React from 'react'
import { BrandLayout, CTA, Note, P } from './_layout'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <BrandLayout preview="Réinitialise ton mot de passe CollabLand" title="Nouveau mot de passe">
    <P>Tu as demandé à réinitialiser ton mot de passe CollabLand. Clique ci-dessous pour en choisir un nouveau.</P>
    <CTA href={confirmationUrl} label="Choisir un nouveau mot de passe" />
    <Note>Ce n'était pas toi ? Ignore cet email, ton mot de passe reste inchangé.</Note>
  </BrandLayout>
)

export default RecoveryEmail
