import assert from "node:assert/strict";

import { createServer } from "vite";

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const domain = await vite.ssrLoadModule(
    "/shared/domains/player-identity/index.ts",
  );
  const adapterModule = await vite.ssrLoadModule(
    "/server/art-studio/playerAttributionAdapter.ts",
  );
  const aliasResult = domain.validatePublicPlayerAlias("public_creator_01");
  assert.equal(aliasResult.valid, true);
  const publicAlias = aliasResult.value;
  const revision = domain.validatePlayerIdentityRevision(4).value;
  let readerCalls = 0;
  const reader = {
    async readPublic() {
      readerCalls += 1;
      return {
        ok: true,
        revision,
        value: {
          publicAlias,
          displayName: "公開 Creator",
          avatar: { url: "https://example.invalid/public-avatar.png" },
          kingdom: { displayName: "Kingdom 101" },
          alliance: { displayName: "FORGE" },
          visibility: {
            audience: "public",
            visibleFields: ["publicAlias", "displayName", "avatar", "kingdom", "alliance"],
            revision,
          },
          forgeUserId: "private-user-id",
          providerIdentifier: "private-provider-id",
          evidenceReference: "private-evidence",
          supportCase: "private-case",
          hiddenAlias: "private-alias",
        },
      };
    },
  };

  const disabled = new adapterModule.ArtStudioPlayerAttributionAdapter(reader);
  assert.deepEqual(await disabled.resolve(publicAlias), {
    available: false,
    reasonCode: "ART_STUDIO_ATTRIBUTION_DISABLED",
  });
  assert.equal(readerCalls, 0, "disabled attribution must not query Player Identity");

  const enabled = new adapterModule.ArtStudioPlayerAttributionAdapter(reader, true);
  const resolved = await enabled.resolve(publicAlias);
  assert.equal(resolved.available, true);
  assert.equal(resolved.reasonCode, "ART_STUDIO_ATTRIBUTION_PUBLIC_PROFILE");
  assert.equal(resolved.attribution.creatorLabel, "公開 Creator");
  const serialized = JSON.stringify(resolved).toLowerCase();
  for (const forbidden of [
    "forgeuserid",
    "provideridentifier",
    "evidencereference",
    "supportcase",
    "hiddenalias",
    "visibility",
  ]) {
    assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
  }

  const aliasOnly = new adapterModule.ArtStudioPlayerAttributionAdapter({
    async readPublic() {
      return {
        ok: true,
        revision,
        value: {
          publicAlias,
          visibility: {
            audience: "public",
            visibleFields: ["publicAlias"],
            revision,
          },
        },
      };
    },
  }, true);
  const aliasOnlyResult = await aliasOnly.resolve(publicAlias);
  assert.equal(aliasOnlyResult.reasonCode, "ART_STUDIO_ATTRIBUTION_PUBLIC_ALIAS_ONLY");
  assert.equal(aliasOnlyResult.attribution.creatorLabel, publicAlias);

  const unavailable = new adapterModule.ArtStudioPlayerAttributionAdapter({
    async readPublic() {
      return { ok: false, code: "alias_private" };
    },
  }, true);
  assert.deepEqual(await unavailable.resolve(publicAlias), {
    available: false,
    reasonCode: "ART_STUDIO_ATTRIBUTION_UNAVAILABLE",
  });

  console.log("Art Studio Player attribution adapter tests passed.");
} finally {
  await vite.close();
}
