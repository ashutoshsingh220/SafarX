import { describe, it, expect } from "vitest";
import { applyMembership } from "../membership";
import type { FareBreakdown, UserProfile } from "../types";

const baseBreakdown: FareBreakdown = {
  busFare: 100000,
  rideFare: 5000,
  feederDiscount: 0,
  crossSubsidy: 0,
  membershipCap: 0,
  advanceDiscount: 0,
  total: 105000,
  currency: "INR",
  strategiesApplied: [],
};

describe("Pricing Engine: Membership", () => {
  it("caps ride fare at 2000 paisa for 'plus' member if fare is higher", () => {
    const user: UserProfile = { id: "u1", membershipPlan: "plus" };
    const result = applyMembership(baseBreakdown, user);
    
    expect(result.rideFare).toBe(2000); // capped at ₹20
    expect(result.membershipCap).toBe(3000); // 5000 - 2000
    expect(result.total).toBe(102000); // 105000 - 3000
    expect(result.strategiesApplied).toContain("membership_cap");
  });

  it("caps ride fare at 2000 paisa for 'premium' member if fare is higher", () => {
    const user: UserProfile = { id: "u2", membershipPlan: "premium" };
    const result = applyMembership(baseBreakdown, user);
    
    expect(result.rideFare).toBe(2000);
    expect(result.membershipCap).toBe(3000);
  });

  it("does not apply cap for 'free' member", () => {
    const user: UserProfile = { id: "u3", membershipPlan: "free" };
    const result = applyMembership(baseBreakdown, user);
    
    expect(result.rideFare).toBe(5000);
    expect(result.membershipCap).toBe(0);
    expect(result.total).toBe(105000);
  });

  it("does not apply cap if ride fare is already below cap", () => {
    const user: UserProfile = { id: "u1", membershipPlan: "plus" };
    const lowFareBreakdown = { ...baseBreakdown, rideFare: 1500, total: 101500 };
    const result = applyMembership(lowFareBreakdown, user);
    
    expect(result.rideFare).toBe(1500);
    expect(result.membershipCap).toBe(0);
    expect(result.total).toBe(101500);
  });
});
