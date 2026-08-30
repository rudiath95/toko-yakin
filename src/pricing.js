// Stackable bulk pricing logic (pure helpers).
(function () {
  "use strict";

  // Given a single-unit price and tier list [{min, totalPrice}], compute the
  // cheapest stacked breakdown: use best bulk packs first, remainder as singles.
  function computeStackablePriceFromSnapshot(singlePrice, tiers, qty) {
    if (qty <= 0) return { total: 0, breakdown: [] };
    var remaining = qty;
    var total = 0;
    var breakdown = [];

    var tiersWithEfficiency = (tiers || []).map(function (tier) {
      return {
        min: tier.min,
        totalPrice: tier.totalPrice,
        effUnit: tier.totalPrice / tier.min
      };
    });
    tiersWithEfficiency.sort(function (a, b) { return a.effUnit - b.effUnit; });

    for (var i = 0; i < tiersWithEfficiency.length; i++) {
      var tier = tiersWithEfficiency[i];
      if (remaining >= tier.min) {
        var maxPacks = Math.floor(remaining / tier.min);
        if (maxPacks > 0) {
          var unitsCovered = maxPacks * tier.min;
          var priceForPacks = maxPacks * tier.totalPrice;
          total += priceForPacks;
          remaining -= unitsCovered;
          breakdown.push({
            type: "bulk",
            minQty: tier.min,
            totalPricePerPack: tier.totalPrice,
            packs: maxPacks,
            units: unitsCovered,
            subtotal: priceForPacks,
            effectiveUnit: tier.effUnit
          });
        }
      }
    }

    if (remaining > 0) {
      var singlesTotal = remaining * singlePrice;
      total += singlesTotal;
      breakdown.push({
        type: "single",
        qty: remaining,
        unitPrice: singlePrice,
        subtotal: singlesTotal
      });
    }
    return { total: total, breakdown: breakdown };
  }

  // Build human-readable breakdown lines for the details popup.
  function buildBreakdownLines(breakdown) {
    var lines = [];
    for (var i = 0; i < breakdown.length; i++) {
      var part = breakdown[i];
      if (part.type === "bulk") {
        var perUnit = part.effectiveUnit.toFixed(2);
        lines.push(
          "\uD83D\uDCE6 " + part.packs + " x BULK (" + part.minQty + " pcs) @ Rp. " +
          part.totalPricePerPack.toFixed(2) + "/pack \u2192 total Rp. " +
          part.subtotal.toFixed(2) + " (\u2248Rp. " + perUnit + "/ea)"
        );
      } else if (part.type === "single") {
        lines.push(
          "\u2728 " + part.qty + " x SINGLE @ Rp. " + part.unitPrice.toFixed(2) +
          " = Rp. " + part.subtotal.toFixed(2)
        );
      }
    }
    return lines;
  }

  window.Pricing = {
    compute: computeStackablePriceFromSnapshot,
    breakdownLines: buildBreakdownLines
  };
})();