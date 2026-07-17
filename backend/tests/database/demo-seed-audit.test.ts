import { describe, expect, it } from "vitest";

const productionCosts: Record<string, number> = { "2026-07":2600000, "2026-08":2200000, "2026-09":2000000, "2026-10":500000, "2026-11":0, "2026-12":0 };
const months=Object.keys(productionCosts);
function balances(structure:"monthly"|"bullet", delayed:boolean) {
  let balance=1500000; const output:number[]=[];
  for(const month of months){
    if(month==="2026-07") balance += 12000000-100000;
    balance -= productionCosts[month]! + 1000000;
    const harvestMonth=delayed?"2026-11":"2026-10";
    if(month===harvestMonth) balance += 19500000;
    if(structure==="monthly" && ["2026-09","2026-10","2026-11","2026-12"].includes(month)) balance -= 3120000;
    if(structure==="bullet" && month==="2026-11") balance -= 12480000;
    output.push(balance);
  }
  return output;
}

describe("rice demo arithmetic audit",()=>{
  it("has no expected monthly gap",()=>{const result=balances("monthly",false); expect(Math.min(...result)).toBe(480000); expect(result.at(-1)).toBe(7120000);});
  it("creates the presentation gap after a one-month delay",()=>{const result=balances("monthly",true); expect(Math.min(...result)).toBe(-4140000); expect(result.findIndex((value)=>value<0)).toBe(3);});
  it("removes that timing gap with post-harvest repayment",()=>{const result=balances("bullet",true); expect(Math.min(...result)).toBe(2100000); expect(result.at(-1)).toBe(7120000);});
});