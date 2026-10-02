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

- Keep new cross-panel requirement mock controls in `src/components/client-requirement-panels.tsx` so customer, provider, and admin routes share one coherent demo model.
- Keep client-requested mock admin cab, banner, and provider vehicle controls in the shared requirement panel module so all panels use one demo source.
- Render the shared MyTento brand mark through `BrandLogo` so customer, provider, and admin headers stay visually consistent.
