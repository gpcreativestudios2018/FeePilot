# Contributing to FeePilot

## Updating Platform Fees

When platform fees change:

1. Verify new fees on the official platform page
2. Update the fee values in `src/data/fees.ts`
3. Update the `lastVerified` date for that platform
4. Update `RULES_UPDATED_AT` at the top of the file
5. Add a note to CHANGELOG.md
6. Test calculations with sample prices

## Official Fee Sources

- **Etsy:** https://www.etsy.com/legal/fees/
- **eBay:** https://www.ebay.com/sellercenter/selling/selling-fees
- **Poshmark:** https://poshmark.com/posh_protect
- **Depop:** https://www.depop.com/sellingfees/
- **Mercari:** https://www.mercari.com/us/help_center/topics/selling/fees/
- **StockX:** https://stockx.com/about/selling/
