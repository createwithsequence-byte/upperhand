// One-shot seed script for reference_examples.
// Usage: npx tsx scripts/seed-references.ts
// Idempotent — exits early if table already has rows.

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("[seed] missing env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Seed = {
  url: string;
  title: string;
  voice_type: "emulate" | "avoid";
  excerpt: string;
  notes: string;
};

const seeds: Seed[] = [
  {
    url: "https://food52.com/story/28832-fathers-day-gift-guide-all-types-of-dads",
    title: "Food52 — Father's Day Gift Guide for All Types of Dads",
    voice_type: "emulate",
    excerpt: `I have a confession: I've been buying my dad the same Father's Day gift for seven years running. A nice bottle of Lagavulin, a card I always overthink, dinner at the steakhouse we went to the night before my wedding. He smiles, says it's perfect, and we both know we're pretending it's not the same as last year. So this year I did something different. I went on Reddit and read four hundred dads describing, in their own words, what they actually want. The answer was uncomfortably specific.

The dads who said "anything" really meant "anything that proves you paid attention." The dads who said "don't get me anything" meant "I'd love something small that isn't a tie." The dad in r/AskMenOver30 who got a custom song from his daughter on her wedding day mentioned it twice, eight months later, in two unrelated threads. That was the giveaway.`,
    notes:
      "Personal anecdote opener. Specific detail (Lagavulin, steakhouse). Admits the hard truth (dads are hard to shop for, repeat gifts). Reddit as research device. Uses 'I' but reads as confident, not navel-gazing.",
  },
  {
    url: "https://food52.com/blog/7313-essays-the-perfect-gift",
    title: "Food52 — Essays: The Perfect Gift",
    voice_type: "emulate",
    excerpt: `The perfect gift my mother ever received was salmon cream cheese. Not the brick of pink Philadelphia from the grocery store — actual salmon cream cheese, smoked in someone's backyard in Astoria, wrapped in butcher paper and handed to her at a brunch she didn't want to attend. She still talks about it. The woman who gave it to her, my mother's coworker's wife, she barely knew. She has long since lost touch. The cream cheese was finished within a week. She still talks about it.

There is a thing that happens in the gifting brain where the perfect gift is the one that contained more thought than the relationship required. It is overdelivery, but emotional. It is the cream cheese.`,
    notes:
      "Third-person device (my mother). The salmon cream cheese specificity. Short paragraphs. Repetition ('She still talks about it') as rhythm. Names the phenomenon ('the cream cheese') without explaining the metaphor.",
  },
  {
    url: "https://yourmelody.org/en/blogs/blogs/cadeau-musique-personnalise",
    title: "YourMelody — Personalized Music Gift",
    voice_type: "avoid",
    excerpt: `What if the most meaningful gift wasn't found in a store, but composed just for you? What if you could capture a feeling, a memory, a moment in time — and turn it into music? Whether you're celebrating a milestone, expressing gratitude, or simply showing someone how much they mean to you, a personalized song offers something truly special.

In today's world, where so many gifts feel impersonal, custom music delivers a uniquely heartfelt experience. Our talented artists work tirelessly to capture the essence of your story, transforming your memories into a melody that will resonate for years to come. It's not just a gift — it's a testament to your bond.`,
    notes:
      "Rhetorical-question opener ('What if...'). 'Whether you're' construction. 'In today's world'. 'Truly special'. 'A testament to'. Em-dash. 'Resonate'. Reads like AI in a marketing voice. Every banned phrase from voice-rules.md is in here. This is the reference for what NOT to write.",
  },
  {
    url: "https://custompersonalizedsongs.com/blog",
    title: "Custom Personalized Songs — Blog",
    voice_type: "avoid",
    excerpt: `Looking for a gift that will truly elevate your special occasion? 🎵 You matter so much to the people in your life, and a custom song is the perfect blend of thoughtfulness and creativity to show them!

✨ Why choose a custom song?
🎁 It's a one-of-a-kind keepsake
💝 It captures your unique story
🌟 It elevates any milestone
🎶 It's a testament to your bond

When it comes to gifts that truly matter, nothing compares to the heartfelt magic of a song written just for you. Whether you're celebrating an anniversary, a wedding, or simply wanting to say "I love you" in a memorable way, a custom song delivers an unforgettable experience.`,
    notes:
      "Emoji as bullet points. 'Truly elevate'. 'You matter so much'. 'The perfect blend of'. 'When it comes to'. 'Whether you're'. 'A testament to'. 'Unforgettable experience'. 'Heartfelt magic'. Almost every banned phrase. This is what AI slop looks like in this niche.",
  },
  {
    url: "https://tailortune.com/en/blog/how-to-make-a-personalized-song-advices",
    title: "TailorTune — How to Make a Personalized Song",
    voice_type: "avoid",
    excerpt: `Creating a personalized song can be a wonderful way to express your feelings. Here are some tips to help you get started:

1. Choose the right occasion
2. Gather your memories
3. Select a genre that resonates
4. Work with a professional songwriter
5. Share your story authentically
6. Review the final composition

By following these steps, you can ensure that your custom song captures the essence of your relationship and creates a lasting memory. Remember, the goal is to leverage music as a way to navigate the complexities of human emotion and unlock a deeper connection with your loved ones.`,
    notes:
      "Checklist-as-writing — no voice, just bullet points. 'Wonderful way'. 'Resonates'. 'Captures the essence'. 'Leverage'. 'Navigate the complexities of'. 'Unlock'. This is what AI does when asked for a how-to without a real opinion. No human is in the room.",
  },
  {
    url: "https://customsong.co/custom-song-2",
    title: "CustomSong — Custom Song Page",
    voice_type: "avoid",
    excerpt: `From heartfelt wedding ballads to quirky birthday anthems, from emotional anniversary serenades to upbeat retirement tributes, our custom songs deliver an unparalleled musical experience tailored to your unique story. Our team of talented songwriters and producers work seamlessly to transform your memories into a robust, professionally produced track.

Whether you're looking for a romantic gift for your spouse, a thoughtful surprise for a parent, or a fun way to celebrate a friend, we have the expertise to bring your vision to life. Discover the magic of personalized music today.`,
    notes:
      "'From X to Y' construction stacked twice. 'Unparalleled'. 'Seamlessly'. 'Robust'. 'Whether you're'. 'Thoughtful'. 'Discover the magic'. Every clause has a banned word or pattern. This is what happens when nobody edits.",
  },
  {
    url: "https://songs.tomshawmusic.com/blog/best-personalized-song-company",
    title: "Tom Shaw Music — Best Personalized Song Company",
    voice_type: "avoid",
    excerpt: `Finding the lyrically eloquent epitome of thoughtfulness can be challenging, especially when you want to elevate a meaningful moment with something truly special. Our service stands as a testament to what's possible when artistry meets personalization, offering a curated experience that captures the very essence of your story.

We delve into the depths of your memories, harnessing the power of music to spearhead an emotional journey that will resonate with your loved one for years to come. It's not just a song — it's an unforgettable celebration of connection.`,
    notes:
      "'Lyrically eloquent epitome of thoughtfulness' — full poet-laureate AI mode. 'Elevate'. 'Truly special'. 'A testament to'. 'Curated'. 'The very essence'. 'Delve into the depths'. 'Harnessing'. 'Spearhead'. 'Resonate'. Em-dash. 'Unforgettable'. This is the densest concentration of banned phrases in the reference set. If your draft sounds anything like this, fail it immediately.",
  },
];

async function main() {
  console.log("[seed-references] checking for existing rows…");
  const { count, error: countErr } = await supabase
    .from("reference_examples")
    .select("*", { count: "exact", head: true });
  if (countErr) {
    console.error("[seed-references] count failed:", countErr);
    process.exit(1);
  }
  if ((count ?? 0) > 0) {
    console.log(`[seed-references] already has ${count} rows. Skipping seed.`);
    process.exit(0);
  }

  console.log(`[seed-references] inserting ${seeds.length} rows…`);
  const { data, error } = await supabase
    .from("reference_examples")
    .insert(seeds)
    .select();
  if (error) {
    console.error("[seed-references] insert failed:", error);
    process.exit(1);
  }
  console.log(`[seed-references] inserted ${data?.length ?? 0} rows.`);
  for (const row of data ?? []) {
    console.log(`  · [${row.voice_type}] ${row.title}`);
  }
}

main().catch((err) => {
  console.error("[seed-references] unexpected error:", err);
  process.exit(1);
});
