import { it } from "vitest";
import { calculerPaie } from "@/lib/payroll";
import { DEFAULT_PARAMS, DEFAULT_EMPLOYEES } from "@/lib/constants";
it("scan", () => {
  for (let y = 2020; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      const ref = new Date(Date.UTC(y, m, 1));
      const tot = DEFAULT_EMPLOYEES.reduce((s, e) => s + calculerPaie(e, DEFAULT_PARAMS, ref).net, 0);
      if (Math.abs(tot - 338174) < 1500) console.log(y, m + 1, Math.round(tot));
    }
  }
});
