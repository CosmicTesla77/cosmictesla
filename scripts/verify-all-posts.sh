#!/usr/bin/env bash
# Read-only verification gate for posts/. Does not modify any post files.
set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POSTS_DIR="$SCRIPT_DIR/../posts"

pass_count=0
fail_count=0
fail_h1=0
fail_h2=0
fail_link=0
fail_words=0

cd "$POSTS_DIR" || exit 1

for f in *.md; do
  h2=$(grep -c '^## ' "$f")
  h1=$(grep -c '^# ' "$f")
  words=$(wc -w < "$f")

  if [ "$f" = "why-becoming-multiplanetary-is-the-only-goal-that-counts.md" ]; then
    link=$(grep -cE 'cosmictesla\.com/spacex' "$f")
  else
    link=$(grep -cE 'amazon\.com/s\?k=|cosmictesla\.com/#' "$f")
  fi

  status="PASS"
  reasons=""

  if [ "$h2" -lt 3 ]; then
    status="FAIL"
    reasons="$reasons h2($h2)"
    fail_h2=$((fail_h2 + 1))
  fi
  if [ "$link" -ne 1 ]; then
    status="FAIL"
    reasons="$reasons link($link)"
    fail_link=$((fail_link + 1))
  fi
  if [ "$h1" -ne 0 ]; then
    status="FAIL"
    reasons="$reasons h1($h1)"
    fail_h1=$((fail_h1 + 1))
  fi
  if [ "$words" -lt 400 ]; then
    status="FAIL"
    reasons="$reasons words($words)"
    fail_words=$((fail_words + 1))
  fi

  if [ "$status" = "PASS" ]; then
    pass_count=$((pass_count + 1))
    echo "PASS $f"
  else
    fail_count=$((fail_count + 1))
    echo "FAIL $f$reasons"
  fi
done

total=$((pass_count + fail_count))
echo "---"
echo "$pass_count passed, $fail_count failed (of $total total)"
echo "  h1 failures: $fail_h1"
echo "  h2 failures: $fail_h2"
echo "  link failures: $fail_link"
echo "  word count failures: $fail_words"

[ "$fail_count" -eq 0 ]
