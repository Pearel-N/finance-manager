-- Update all system transactions to have excludeFromDailySpent = true
UPDATE "Transaction" t
SET "excludeFromDailySpent" = true
FROM "Category" c
WHERE t."categoryId" = c.id AND c.name = 'System';


