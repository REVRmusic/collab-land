import * as React from 'react'
import { BrandLayout, Code, Note, P } from './_layout'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <BrandLayout preview="Ton code de vérification CollabLand" title="Code de vérification">
    <P>Utilise ce code pour confirmer ton identité :</P>
    <Code value={token} />
    <Note>Ce code expire bientôt. Tu ne l'as pas demandé ? Ignore cet email.</Note>
  </BrandLayout>
)

export default ReauthenticationEmail
