LastPass Confirms A Supply Chain Breach Through The Klue Attack
June 28 2026

LastPass confirmed that attackers stole customer data from its Salesforce environment after a supply chain breach at a third party vendor named Klue. The company was alerted to the incident on June 12 2026 and disclosed it publicly on June 23. The important detail up front: password vaults and master passwords were not touched. What leaked was the contact and support data LastPass stored inside a sales and marketing platform, and that is more than enough to fuel a wave of convincing phishing.

## What actually happened at Klue?

The attack did not begin at LastPass at all. It began at Klue, a market intelligence platform that LastPass used internally, which connects to business systems like Salesforce and Gong using OAuth tokens. On June 12 an intruder used a compromised legacy credential to break into Klue and then stole OAuth tokens that Klue held for many of its customers. Those tokens are digital keys that let one application act on behalf of another, so once the attacker held them, no password was required to walk straight into the connected Salesforce accounts.

LastPass was only one name on a long victim list. A threat actor calling itself Icarus claimed responsibility and threatened to leak the stolen data unless a ransom was paid. Other companies pulled into the same breach included Recorded Future, Tanium, Jamf, Sprout Social, Gong, Insurity, and the vulnerability disclosure platform HackerOne. When a company whose entire job is managing security disclosures gets caught through a marketing integration, the lesson about third party risk writes itself.

## Why does a breach with no stolen vaults still matter?

Because the data that did leak is the raw material for targeted fraud. According to LastPass, the exposed records included customer names, email addresses, phone numbers, physical addresses, and support case data. An attacker armed with your name, your contact details, and the fact that you are a LastPass customer can craft an email or text that looks exactly like a real support message. The vault staying sealed protects your passwords, but it does nothing to stop a well written lure that asks you to log in to a fake page.

There is also history weighing on this. The 2022 LastPass breach was far worse, with attackers stealing encrypted vault backups that were later cracked offline for users with weak master passwords. Security researchers tied a string of cryptocurrency thefts to that incident, totaling well over $150 million through 2025, and LastPass settled a $24.5 million class action in 2025. The Klue breach is narrower, but it lands on an already battered trust record, and that context is exactly why some users will treat it as the final push toward Bitwarden or 1Password.

## How should LastPass customers respond?

Treat every unexpected LastPass message as suspect and never act on one through a link. LastPass said it disabled employee access to Klue, rotated the exposed tokens, and notified law enforcement, and it warned that the attackers were using lookalike sender domains to push their lures. The practical move is to ignore inbound messages entirely and reach the company only through the official site you type yourself. Turning on multifactor authentication and confirming your master password is long and unique closes the door the 2022 breach left ajar.

The broader takeaway is that your security posture is only as strong as the weakest vendor your providers trust. You can do everything right inside your own account and still surface in a breach notice because a marketing tool three steps removed got popped. OAuth tokens sitting inside software as a service vendors are an attack surface, and the Klue chain shows how a single forgotten credential can cascade across eight companies at once.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
