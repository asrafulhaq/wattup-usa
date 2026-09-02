# Charging price: where it comes from, and when that has to change

Written because the question came up while seeding a network-wide tariff: should the
price come from a third party? Yes, eventually. This is the note for whoever picks that
up, and for the hardware conversation, which is what actually gates it.

## Where the price comes from today

A `pricePerKwh` column on `location`, edited in the dashboard, nullable. Null renders as
**"Being confirmed"** on the station card and the station page rather than as a blank or
a zero.

That is the right answer for right now, and not a compromise: **no WattUp site is
energised**, so there is no system holding a real tariff to sync with. A price that looks
live with no live source behind it is worse than a static one, because a driver trusts
the timestamp next to it.

## When it stops being the right answer

Not a date. Three events, any of which forces the change.

**1. The first charger is energised.** The hard deadline. From the moment hardware talks
to a management platform there is a real tariff in a real system, and the column becomes
a copy that can drift from what the driver is actually charged at the plug. That is a
trust problem and arguably a legal one.

**2. The tariff stops being one number.** A column can hold `$0.39/kWh`. It cannot hold
"$0.39 off-peak, $0.52 peak, member rate $0.34, plus $0.40/min idle after ten minutes".
At that point the display is not stale, it is wrong.

**3. Somebody asks for live availability.** "3 of 4 bays available" arrives down the same
feed as the price. In practice this is usually what forces the work, and pricing comes
with it.

## How it works when it does change

The chain is:

```
charger --OCPP--> CPMS (the vendor's management platform) --OCPI--> us
```

- **OCPP** is charger to backend. Not ours to integrate; it is how the hardware reports
  in.
- **OCPI** is backend to everyone else. It is what carries tariffs, availability and
  locations to operators and to apps like PlugShare, A Better Routeplanner and Google
  Maps. This is the one we consume.

The work, in order:

1. **Identify the CPMS.** ChargePoint, EVBox, Kempower, Tritium and the rest each expose
   either an OCPI endpoint or their own REST API. Everything below depends on which.
2. **Get credentials.** OCPI registration is a token exchange against the platform's
   `credentials` endpoint; we register as a receiver.
3. **Map our sites to theirs.** Each `Location` needs the CPMS's own identifier so a row
   here matches a location there.
4. **Poll on a schedule.** OCPI supports pull and push. Pull every few minutes into a
   cached read is simpler and sufficient, and fits the `cacheTag`/`updateTag` mechanism
   the dashboard already uses.
5. **Overlay, do not replace.** The live value wins; the column stays as the fallback for
   any site not yet reporting, which during a rollout is most of them.

The code change is small, because the shape already allows for it. `pricePerKwh` is one
field and `formatPrice()` is one function, so the whole integration lands at one line in
the mapper:

```ts
// lib/locations/server.ts, in toStationRecord
pricePerKwh: live[row.cpmsLocationId]?.pricePerKwh ?? Number(row.pricePerKwh),
```

Realistically a day's work once credentials exist. The expensive part is not the code, it
is obtaining vendor API access, which runs in weeks.

## What deliberately is not built yet

**No CPMS identifier column.** Until we know which platform it is, we are guessing
whether that is one identifier or three, and whether it lives on the site or on each
individual charger. A speculative column is a migration we would redo. It is the first
thing that changes, not something to add in advance.

**No live-looking presentation.** No "updated a minute ago", no availability counts, no
"from $X". Every one of those is a claim we cannot currently support.

## The question that unblocks it

> Who supplies the chargers, what management platform do they run, and does it expose
> OCPI?

That single answer decides whether this is a one-day standards-based integration or a
two-week bespoke one. It belongs with the other open items in
`project_client_open_questions`: the Mapbox token restrictions, the amenity survey and
the connector specification.

## Related risk, worth restating

Eleven sites currently present as **Open**. The signed-locations sheet records that
switchgear was *ordered*, not that anything was commissioned. "Open" plus a price is a
promise to a driver who may act on it. Whether those eleven should read Open or Under
construction is a client decision, and it is a separate one from where the price comes
from.
