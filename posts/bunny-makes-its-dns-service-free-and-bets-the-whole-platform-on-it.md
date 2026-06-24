Bunny Makes Its DNS Service Free and Bets the Whole Platform on It
June 24 2026

In a June 2026 announcement, the European infrastructure company bunny.net eliminated all DNS query fees and made Bunny DNS free, including hosting for up to 500 domains per account. The only remaining cost is the platform's standard one dollar per month minimum spend that applies across every bunny.net service.

## What did Bunny actually change?

The company removed usage based billing from DNS entirely. Bunny DNS previously charged per million queries, with a free allowance and paid tiers above it. That pricing structure is gone, replaced by free DNS hosting capped at 500 domains, with no per query charge regardless of traffic. To ease migration, Bunny added automatic zone scanning that reconstructs your records by checking common names and types, plus support for uploading a standard BIND file. Once records are in place, a single click can route traffic through the Bunny content delivery network.

Bunny DNS is not an ordinary record lookup service. The company describes it as a scriptable routing engine that can make decisions using latency data, health checks, and even JavaScript, rather than simply returning static records. That engine already powers Bunny's content delivery network, and the product handles close to 200 billion queries every month across more than 300,000 domains. Making it free turns the most technically demanding layer of the stack into a no cost entry point.

## Why give away the product that powers the platform?

Because DNS is the on ramp to everything else Bunny sells. The company framed the move around its mission to make the internet faster, but the business logic is straightforward. DNS sits at the very start of every web request, so a developer who runs their DNS on Bunny is one click away from enabling the paid CDN, edge storage, video streaming, and security products. Giving away the entry layer is a customer acquisition strategy dressed as generosity, and it is a smart one.

There is also a defensive angle. Bunny grew without venture capital out of Slovenia, and it competes against Cloudflare, a far larger rival that built its own reputation on generous free tiers. Matching and undercutting Cloudflare on the foundational DNS layer is how a smaller European player stays in the conversation rather than getting squeezed out.

## What does this mean for the Cloudflare alternative debate?

It sharpens an argument that has been building across European tech. Developers on Hacker News tied the news directly to a search for European alternatives to United States cloud giants, a theme that has gained urgency amid shifting United States and European Union politics. Not every European option competes cleanly. Hetzner, another favorite, drew criticism for repeatedly raising prices in 2026. Bunny moving the other direction, cutting cost to zero on a core product, is exactly the kind of pressure that keeps the alternative ecosystem credible.

Check out what else is trending at [Hacker News Trending](https://www.cosmictesla.com/#hn-trending)
