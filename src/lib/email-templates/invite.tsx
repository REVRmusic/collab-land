import * as React from 'react'
import { BrandLayout, CTA, Note, P } from './_layout'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <BrandLayout preview="Tu es invité sur CollabLand" title="Tu es invité sur CollabLand">
    <P>Un producteur t'invite à rejoindre CollabLand pour faire avancer vos morceaux ensemble.</P>
    <CTA href={confirmationUrl} label="Accepter l'invitation" />
    <Note>Tu ne t'attendais pas à cette invitation ? Tu peux ignorer cet email.</Note>
  </BrandLayout>
)

export default InviteEmail
