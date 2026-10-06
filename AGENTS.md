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

- Keep customer cab discovery in `src/components/client-requirement-panels.tsx` and source operational records from Lovable Cloud so customer, provider, and admin views stay consistent.
- Render the shared MyTento brand mark through `BrandLogo` so customer, provider, and admin headers stay visually consistent.
- Keep private business data behind authenticated cloud access and enforce admin/provider roles in the database, not browser state.
- Model customer-bookable services as provider service listings linked to catalogue categories so pricing and availability have one live source.
- Use a persistent sidebar and wide data workspace for the admin panel on desktop while preserving stacked touch layouts on smaller screens.

- Keep `capacitor.config.ts` (webDir `www`, no server.url) and Capacitor packages in the project so downloaded code always builds the bundled MyTento Android app.
