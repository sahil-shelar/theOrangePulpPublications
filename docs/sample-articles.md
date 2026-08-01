# Sample Article Data — Reference

One filled-out example per article type, matching the schema in
`supabase/migrations/20260802000000_typed_article_templates.sql`. Use these to
manually test each dashboard editor and display template end-to-end.

---

## News

**Shared fields**
```
title:        Legendary Greenlights Dune: Part Three
slug:         legendary-greenlights-dune-part-three
excerpt:      Production begins early 2027, with Villeneuve returning to close the trilogy.
category:     Industry News
author:       Editorial Team
cover_image:  (backdrop/press-still URL)
status:       published
```

**News fields**
```
subheadline:  Villeneuve confirmed to write and direct the final chapter
source_name:  Variety
source_url:   https://variety.com/example-article
```

**content (markdown body)**
```markdown
Legendary Pictures has officially greenlit *Dune: Part Three*, closing out
Denis Villeneuve's adaptation of Frank Herbert's saga. The studio confirmed
the news alongside its Q2 earnings call, citing the franchise's box office
performance across the first two films.

Villeneuve, who also directed *Arrival* and *Blade Runner 2049*, will return
to write and direct. Production is expected to begin in early 2027, targeting
a 2029 release.

No casting changes have been announced. Timothée Chalamet and Zendaya are
expected to reprise their roles as Paul Atreides and Chani.
```

---

## Review

**Shared fields**
```
title:        Dune: Part Two
slug:         dune-part-two-review
excerpt:      Villeneuve delivers the rare sequel that outgrows its predecessor.
category:     Reviews
author:       J. Alvarez
movie:        Dune: Part Two (linked via movie_id — pulls poster/backdrop/streaming)
cover_image:  (movie backdrop, or leave blank to fall back to linked movie's backdrop_url)
status:       published
```

**Review fields**
```
rating (OP score):  4.8      # out of 5
imdb_score:          8.5      # out of 10
rt_score:            93       # out of 100
verdict:             must_watch
```

**content (markdown body)**
```markdown
Denis Villeneuve's *Dune: Part Two* doesn't just continue the story begun in
2021 — it justifies the wait. Where the first film was scaffolding, this one
is the structure: Paul Atreides's arc from refugee to messiah lands with a
weight few blockbusters even attempt.

Zendaya's Chani gets the expanded role she deserved, and Christopher
Walken's brief but pivotal turn as Emperor Shaddam IV adds a cold, imperial
menace the franchise needed. The Harkonnen home-world sequence, shot in
infrared-style black and white, is the year's best use of a color palette
as a storytelling device.

Streaming and box office details below. Read our full spoiler-free breakdown
of the ending in our companion piece.
```

---

## Rankings / List

**Shared fields**
```
title:        10 Best Horror Films of 2024
slug:         10-best-horror-films-2024
excerpt:      From folk horror to body horror — the ten films that defined the genre this year.
category:     Lists
author:       Editorial Team
status:       published
```

**content (optional intro, shown above the ranked rows)**
```markdown
2024 was horror's best year in a decade. Here's the definitive ranking —
one entry per day until we run out of nightmares.
```

**Ranked items** (`list_items`, ordered by rank)

| Rank | Movie (linked or custom) | Blurb | Item Rating |
|---|---|---|---|
| 1 | Heretic *(linked movie)* | Hugh Grant's most unsettling performance in decades — a two-hander that never lets up. | 4.5 |
| 2 | The Substance *(linked movie)* | Body horror as feminist rage. Demi Moore hasn't been this good since the '90s. | 4.9 |
| 3 | Longlegs *(linked movie)* | Nicolas Cage disappears into a role that will haunt you long after the credits roll. | 4.0 |
| 4 | Late Night with the Devil *(linked movie)* | Found-footage done right — dread that builds in real time. | 4.2 |
| 5 | In a Violent Nature *(custom title, not yet in movie DB)* | An experimental slasher told entirely from the killer's POV. | 3.5 |

*(Continue to 10 items for the real article — five shown here for reference.)*

---

## Spotlight

**Shared fields**
```
title:        Denis Villeneuve: The Architect of Modern Sci-Fi
slug:         denis-villeneuve-spotlight
excerpt:      From Quebec arthouse cinema to the biggest blockbusters on Earth.
category:     Spotlight
author:       Editorial Team
status:       published
```

**Spotlight fields**
```
subject_name:       Denis Villeneuve
subject_role:        Director
subject_photo_url:   (portrait URL — used as the full-bleed hero image)
pull_quote:          Cinema is meant to be seen big, loud, together.
```

**content (bio, markdown)**
```markdown
Denis Villeneuve's path to becoming one of the defining directors of modern
science fiction began far from Hollywood, with Quebecois dramas like
*Incendies* and *Polytechnique*. His breakout into English-language cinema
came with *Prisoners* and *Sicario*, but it was *Arrival* in 2016 that
revealed his particular gift: turning cerebral, literary science fiction
into something emotionally devastating on a mass scale.

That gift found its biggest canvas yet in *Dune*, a two-part adaptation
long considered unfilmable. Villeneuve's version — patient, tactile,
unafraid of silence — proved otherwise.
```

**Notable works** (`spotlight_works`, ordered by rank)

| Rank | Work (linked or custom) | Note |
|---|---|---|
| 1 | Dune: Part Two *(linked movie)* | Continued the saga with an even bolder visual language. |
| 2 | Dune *(linked movie)* | Proved a "impossible" adaptation could work at scale. |
| 3 | Blade Runner 2049 *(linked movie)* | Earned a Best Cinematography Oscar for Roger Deakins. |
| 4 | Arrival *(linked movie)* | The film that redefined his career — Best Director nomination. |
