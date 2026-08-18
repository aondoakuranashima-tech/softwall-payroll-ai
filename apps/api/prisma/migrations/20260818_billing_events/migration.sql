CREATE TABLE "BillingEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingEvent_provider_eventId_key" ON "BillingEvent"("provider", "eventId");
