# UI Design Guidelines

## Design Direction

Build a polished, modern SaaS application using HeroUI.

The interface should feel like a cohesive production application,
not a collection of individually styled components.

## Component Library

- Use HeroUI components wherever an appropriate component exists.
- Prefer native HeroUI variants, sizes, colors, and slots.
- Do not recreate existing HeroUI components with custom CSS.
- Do not override internal HeroUI styling unless necessary.
- Use the installed HeroUI skill and documentation before implementing unfamiliar components.

## Visual Design

- Use consistent spacing, typography, and border radii.
- Establish clear visual hierarchy through typography and whitespace.
- Prefer subtle borders and surfaces over excessive shadows.
- Avoid unnecessary gradients, decorative elements, and oversized cards.
- Use accent colors sparingly to communicate importance.
- Maintain consistent component sizing and alignment.

## Layout

- Use a deliberate grid and spacing system.
- Keep related controls visually grouped.
- Avoid excessive nesting of cards and containers.
- Design empty, loading, error, and populated states.
- Ensure responsive layouts are intentional, not accidental.

## Implementation

- Use the application's existing theme and design tokens.
- Do not introduce arbitrary colors or spacing values.
- Avoid unnecessary custom CSS when HeroUI provides the required styling.
- Reuse existing application components and patterns.

## Quality Control

Before completing a UI task:

1. Check that HeroUI components are used correctly.
2. Verify spacing, alignment, hierarchy, and consistency.
3. Check responsive behaviour.
4. Review the rendered interface, not just the source code.
5. Correct visual issues before reporting completion.
