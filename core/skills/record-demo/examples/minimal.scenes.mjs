// Minimal template and self-test. No server, no login.
// From this directory:
//   node ../scripts/record.mjs minimal.scenes.mjs --plan
//   node ../scripts/record.mjs minimal.scenes.mjs --dry
import os from "node:os";
const PAGE = new URL("./minimal.html", import.meta.url).href;
const T = s => `<span class="tag">${s}</span>`;

export default {
  name: "minimal-demo",
  title: "Demo shop checkout",
  outDir: `${os.tmpdir()}/minimal-demo-out`,
  footer: "Local environment, fake data",
  criteria: {
    C01: "Buying requires accepting the terms",
    C02: "A valid order shows a confirmation",
    C03: "Refunds are handled by support (operator procedure)",
  },
  intro: `<h1>Demo shop checkout</h1><div>What this demo covers: C01, C02, C03</div>`,
  introMs: 3000,
  scenes: [
    {id: "S1", criteria: ["C01"], how: "ui", steps: [
      {goto: PAGE},
      {caption: `${T("C01")} Buying without accepting the terms is rejected.`},
      {click: "#buy", ms: 1500},
      {expect: "#out", text: "accept the terms"},
    ]},
    {id: "S2", criteria: ["C02"], how: "ui", steps: [
      {fill: "#qty", value: 3},
      {select: "#plan", option: "Pro"},
      {check: {label: "Accept terms"}},
      {caption: `${T("C02")} With the terms accepted, the order is placed.`},
      {click: {role: "button", name: "Buy"}, ms: 1500},
      {expect: "#out", text: "Order placed: 3 x Pro"},
      {panel: ({render}) => `<h3>Order check</h3>${render.kv({Quantity: 3, Plan: "Pro"})}`, ms: 2000},
    ]},
    {id: "S3", criteria: ["C03"], how: "card", steps: [
      {caption: null},
      {card: `<h1>${T("C03")} Refunds</h1><div>Handled by support staff; the system does not enforce it.</div>`, ms: 3000},
    ]},
  ],
};
