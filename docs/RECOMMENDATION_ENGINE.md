# Greenhouse Recommendation Engine

## Purpose

The recommendation engine exists to answer a single question:

> What would I enjoy doing right now that I can actually start right now?

Recommendations should reduce decision fatigue and activation energy.

Recommendations should never function as productivity coaching.

---

# Recommendation Philosophy

Recommendations should prioritize:

1. Realistic feasibility
2. Low activation energy
3. User interest
4. Historical fulfillment

Recommendations should not prioritize:

- Productivity
- Completion rates
- Streaks
- Efficiency
- Output

---

# Recommendation Inputs

The system may consider:

- Available time
- Energy level
- Focus level
- Location
- Available supplies
- Social context
- Weather
- Seasonality

The recommendation engine should remain functional even when some information is unavailable.

---

# Incomplete Data

Interests may be created with only a title.

Recommendations must tolerate incomplete information.

Missing information should reduce recommendation confidence rather than preventing recommendations entirely.

The application should never require users to fully configure an Interest before it becomes useful.

---

# Constraint Matching

Recommendations should evaluate whether an Interest is realistically achievable given the user's current circumstances.

Examples:

- Available time
- Energy requirements
- Focus requirements
- Required supplies
- Location requirements

The objective is not optimization.

The objective is realistic accessibility.

---

# Recommendation Outcomes

Recommendations should help users:

- Discover forgotten interests
- Re-engage with active interests
- Start activities quickly
- Spend less time deciding

Recommendations should never:

- Pressure users into action
- Encourage completion for its own sake
- Create guilt around unfinished interests

---

# Future Considerations

Potential future recommendation factors:

- Historical fulfillment
- Long-term impact ratings
- Variety and novelty
- Recency of engagement

These factors should remain subordinate to feasibility and user interest.

---

# Success Criteria

The recommendation engine is successful if users:

- Spend less time deciding what to do
- Spend less time identifying barriers
- Spend more time engaging with meaningful interests

The recommendation engine is not successful because it increases output, completion rates, or engagement metrics.