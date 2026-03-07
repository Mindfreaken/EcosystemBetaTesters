Will seed on first user sign up

To upload nerdle schedule

npx tsx nerdle/scripts/uploadSchedulesToConvex.ts \
  --url https://wandering-avocet-71.convex.site \
  --root nerdle/schedules \
  --replace

To upload the english words 

CONVEX_URL=https://wandering-avocet-71.convex.cloud \
npm run corpus:upload