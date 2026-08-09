import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listModels, assertAyitiModel, isAyitiModel, routeCitizenIntent,
  executeAyitiModel, translateAssist,
} from "../src/index.js";

describe("ayiti policy", () => {
  it("only ayiti models", () => {
    assert.ok(listModels().every((m) => m.id.startsWith("ayiti.")));
    assert.equal(isAyitiModel("models5"), false);
    assert.throws(() => assertAyitiModel("echo"), /Forbidden/);
  });

  it("routes citizen intents", () => {
    assert.equal(routeCitizenIntent("NIF nan DGI").model, "ayiti.dgi");
    assert.equal(routeCitizenIntent("inflation BRH").model, "ayiti.brh");
    assert.equal(routeCitizenIntent("siklon urgence").model, "ayiti.alert");
  });

  it("translate assist hits glossary", () => {
    const t = translateAssist("citizen tax budget", "ht");
    assert.ok(t.glossaryHits.length >= 2);
  });
});

describe("live apis", () => {
  it("search", async () => {
    const r = await executeAyitiModel("ayiti.search", "inflation Haiti");
    assert.equal(r.provider, "ayiti-os-gov");
    assert.ok(r.output.length > 0);
  });

  it("stats", async () => {
    const r = await executeAyitiModel("ayiti.stats", "displacement");
    assert.match(r.output, /series|matched|catalog/i);
  });

  it("uxp + translate offline", async () => {
    const u = await executeAyitiModel("ayiti.uxp", JSON.stringify({ from: "mef", to: "dgi" }));
    assert.equal(u.data.envelope.protocol, "ayiti-uxp");
    const t = await executeAyitiModel("ayiti.translate", "government tax");
    assert.match(t.output, /glossary|term/i);
  });
});
