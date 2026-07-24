# ART-003 deterministic Art Studio acceptance harness

The development/test-only route `/art-studio/acceptance` exists to close the
owner-acceptance gap without requiring an authenticated session, Supabase data,
fixture seeding or a production permission bypass. It is registered only when
Vite exposes `import.meta.env.DEV`; production builds do not register the
route. The existing protected `/admin/community-art` and
`/admin/render-engine` routes are unchanged.

## Local workflow

1. Start the app with `npm run dev`.
2. Open `/art-studio/acceptance`.
3. Choose or drop in
   `fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt` from the owner
   checkout.
4. Confirm the displayed raw SHA-256 is
   `c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79`, the
   file is 386 bytes, and line endings are CRLF.
5. Choose both `kingshot-reference-chat.png` and
   `kingshot-reference-game.png`.
6. Compare the candidate through the editor, gallery, full-preview modal,
   submission, moderation and Calibration Lab surfaces at 390, 768, 1280 and
   1440px. Record visual differences manually; the harness intentionally does
   not fabricate a similarity score or claim pixel-perfect parity.
7. Exercise both copy buttons. The Clipboard API and deterministic textarea
   fallback use the production `copyApprovedPayload` contract and preserve the
   source string exactly.

The fixture remains `calibration_required` until the owner accepts the visual
evidence. Reference images and fixture metadata are held in component state
and object URLs only; no harness metadata is written to localStorage,
Supabase, Vercel or another persistence layer.

## Architecture and safety

The harness composes the production `KingshotArtRenderer` and the established
Art Studio renderer classes. It supplies only deterministic in-memory title,
creator, moderation and calibration metadata. It does not duplicate the fixed
cell grid, change production CSS geometry, call Community Art services, weaken
`ProtectedRoute`, or expose moderation/admin actions. The raw file is hashed as
bytes before UTF-8 decoding, and its decoded CRLF source remains the value used
by every surface and copy action.

Focused contracts run with:

```text
npm run test:art-studio-acceptance
```

