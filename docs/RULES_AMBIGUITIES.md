# Rules ambiguities and pending decisions

No source discrepancies have been established: the official rules and PDF were
unreachable. These are **proposed defaults from the task, not verified rules**,
to check against the PDF before M3/M4 and expose in `RulesConfig`:

1. Owner chooses a replacement Guard immediately; automatic with one survivor.
2. Empty deck reshuffles the discard.
3. No hand limit.
4. Attacker chooses an opposing Guard in multiplayer.
5. Effect defeats credit the player who played the effect.
6. Defeated creature goes to the victor; attached Upgrades go to discard.
7. Skip attack if there is no attacker or opposing Guard.
8. Skip required draw when deck and discard are both empty.
9. Response windows follow main action declaration, attack declaration and roll
   before damage; reactions resolve last-in-first-out after consecutive passes.
10. Players are never eliminated.

Catalog assumptions also await source confirmation: expected set counts
110 Main + 23 Limited + 1 Cube Rare, 60 Starter cards including 2 foil rares.
Validation must expose discrepancies rather than create missing cards or change
quantities. Card type must never be inferred from numbering or name.
