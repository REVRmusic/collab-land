<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Stemroom architecture
- Media (audio, avatars, covers) lives in private storage buckets; DB stores paths, UI resolves signed URLs via useMediaUrl — public buckets are blocked by workspace policy.
- Waveform peaks are computed client-side at upload (Web Audio) and stored as JSON so players render instantly.
- Project visibility is enforced by the can_view_project() SQL function used in every RLS policy on project-scoped tables.
- Notifications are created only by DB triggers; the client never inserts them.
