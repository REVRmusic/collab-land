import * as React from 'react'
import { BrandLayout, CTA, Note, P } from './_layout'

interface EmailChangeEmailProps { siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ oldEmail, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <BrandLayout preview="Confirme ta nouvelle adresse email" title="Changement d'email">
    <P>
      Tu as demandé à remplacer l'adresse de ton compte <strong>{oldEmail || email}</strong> par{' '}
      <strong>{newEmail}</strong>.
    </P>
    <CTA href={confirmationUrl} label="Confirmer le changement" />
    <Note>Ce n'était pas toi ? Sécurise ton compte en changeant ton mot de passe.</Note>
  </BrandLayout>
)

export default EmailChangeEmail
