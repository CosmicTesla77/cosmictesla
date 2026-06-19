Project Valhalla Lands Value Classes in JDK 28 After More Than a Decade of Work
June 19 2026

Oracle engineer Lois Foltan confirmed on June 15 2026 that JEP 401, the Value Classes and Objects feature at the core of Project Valhalla, will be merged into the OpenJDK mainline and is targeting JDK 28. It is the largest single change to the Java language in more than a decade, a project that has been in motion for roughly twelve years, and it finally puts a long promised feature in front of developers as a preview.

## What problem do value classes actually solve?

Java has a split personality. A handful of primitives like int and double are cheap and compared by value, but almost everything else is a reference type carrying an object identity, which means extra memory and a pointer to chase. That gap creates real bugs. Comparing two Integer objects with the equality operator works for small cached values and silently fails for large ones, and two LocalDate instances that represent the same date can compare as unequal because they are different objects in memory.

Value classes erase that distinction. A value class has no identity, its fields are final, and the JVM is allowed to flatten it directly into an array or another object the same way it stores a primitive. The shorthand the Java team uses is that a value class codes like a class but works like an int. In practice that means tighter memory layout, better cache behavior, and fewer of the surprising equality bugs that come from identity.

## How big is this change under the hood?

The pull request for the first preview adds more than 197,000 lines of code across 1,816 files. Foltan called it an extremely large change and asked other OpenJDK committers to hold off on big commits during the integration window so nothing collides. Architect Brian Goetz cooled the celebration by noting this is only the first part of Valhalla, since the harder pieces are still to come.

What is not in JDK 28 matters as much as what is. Null restricted types, full specialized generics, and 128 bit value encodings are all still ahead, and the syntax itself can shift between releases because this ships as a preview. Groundwork already exists in the pipeline, including a change in JDK 27 that shrank object headers and reserved bits specifically for future value class support.

## When can developers use it?

The feature is a preview targeting JDK 28, which is scheduled to release in March 2027, with the mainline merge happening around July 2026. The current shipping version is JDK 26, and JDK 27 is expected in September 2026. Because JEP 401 ships as a preview, it is disabled by default, so developers have to turn on preview features to experiment with the new value and value record declarations. Anyone who wants to try it before the official release can already pull early access Valhalla builds. For anyone tracking how the language is evolving, this is the most important Java news of the year.

[Check out what else is trending at Hacker News](https://www.cosmictesla.com/#hn-trending)
