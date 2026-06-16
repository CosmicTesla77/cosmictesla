A Backdoor in a LinkedIn Job Offer Targets Developers in 2026
June 16 2026

A developer who received a LinkedIn job offer in June 2026 traced it to a code repository rigged to install a backdoor the instant he ran npm install. The trick hides inside an npm prepare script, which runs automatically right after dependencies finish installing, so merely setting up the project executes the malware. It is the latest documented case in a long running operation that security researchers call Contagious Interview, and it has quietly turned the technical hiring process into a malware delivery pipeline aimed squarely at people who write code.

## How does the LinkedIn job scam actually work?

The choreography mimics a real hiring process so closely that it disarms experienced engineers. A recruiter reaches out on LinkedIn with a legitimate sounding role at a company that actually exists. The conversation feels normal across several rounds, and then comes a technical assessment: clone this repository, run this npm package, evaluate our codebase. Because telling a JavaScript developer to run npm install during an interview is completely ordinary, the request raises no alarm. The moment the package installs, a lifecycle script fires and a backdoor lands on the machine.

In the firsthand account that reached the top of Hacker News this week, the bait was an instruction to look into a deprecated Node modules issue, which existed only to get the target to run the install. The repository commits were authored under the name and email of a real full stack engineer who, when contacted, said he had never worked for the company and had been impersonated before. Microsoft published a detailed writeup in March 2026 describing this exact pattern, noting the JavaScript backdoor variant had been active since at least October 2025 and the broader campaign since late 2022.

## Who is behind these attacks?

A significant share of this activity traces to North Korea, including the group commonly known as Lazarus, whose motive here is money rather than espionage. The United States Department of Justice has indicted North Korean nationals over schemes that stole more than $1.3 billion in cryptocurrency, and compromising developer machines is one route into that loot. Developers are high value targets because their machines hold keys to production systems, payment processors, source code, and customer data.

The tactics keep escalating. Security firm Wiz has tracked a threat actor it calls JINX-0164 since the middle of 2025, which uses fake LinkedIn recruiters to plant custom malware on crypto developers, then harvests GitHub tokens to inject malicious code straight into shared development pipelines, spreading the infection to everyone who pulls the poisoned branch. In April 2026 the group went further and trojanized a widely used cryptocurrency software package on npm, appending code that quietly pulled down a lightweight backdoor whenever any project imported it. One earlier case dangled a freelance contract worth several hundred thousand dollars to lure a developer into a booby trapped project.

## How can developers protect their machines?

The single most effective habit is to never run interview or unsolicited code directly on your main machine. Spin up a throwaway virtual machine or a container with no access to your credentials, SSH keys, or wallets, and run anything suspicious there. When you must install dependencies from an untrusted source, pass the flag that disables lifecycle scripts so a prepare or postinstall hook cannot execute on its own. Read package scripts before running anything, and treat a repository that wants to run code immediately as a red flag rather than a convenience.

Beyond the individual, the lesson is cultural. A real employer rarely needs you to execute their private codebase locally during a first round screen, and a recruiter who pushes urgency around running a project is behaving the way an attacker behaves. Slowing down and isolating the work costs minutes. Skipping that step can cost a company its entire source tree.

Check out what else is trending at [Hacker News](https://www.cosmictesla.com/#hn-trending)
