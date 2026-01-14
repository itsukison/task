Product Requirements Document (PRD)
Product name (working)

TaskOS (placeholder)

Goal

Help Japanese startups plan daily work, execute with time awareness, and maintain transparent visibility without bloated project management features.

Target users

Individual contributors (ICs): plan tasks, track time, schedule work

Leaders / managers: monitor workload, execution speed, availability

Navigation & Layout (Global)
Navigation

Left hamburger button (≡) at top-left

Sidebar opens only on click, Notion-style

Sidebar items:

Calendar & Tasks

Progress Tracking (leader-only)

Settings

Sidebar takes zero width when closed.

Page 1: Calendar + Tasks (Core Workspace)
Overall Layout

Split view with a draggable vertical divider

Minimal width enforced for both sides

Divider hover state shows:

Close-left button (collapse tasks)

Close-right button (collapse calendar)

When collapsed:

Page leaves a small icon button in the corner to restore

State persists per user.

Calendar View (Right or Full)

Primary mode

Week-based vertical calendar

Time on Y-axis, days on X-axis

Features

Task blocks with height = expected time

Color states:

Planned

In progress

Overrun

Completed

Filters (top-right, minimal)

Select people to overlap schedules

Toggle:

Tasks

Meetings (future)

Interactions

Drag task → calendar

Resize block → updates expected time

Click task block:

Opens task detail modal

Only when calendar is full view

Task View (Left or Full)

Primary format

Simple table view

Default columns

Task name

Description (1-line truncate)

Owner (self by default)

Expected time

Timer (Start / Pause)

Interactions

Inline edit for expected time

Drag task row → calendar

Click task name:

Opens task detail modal

Only when task view is full view

Task Detail Modal (Shared)

Modal style inspired by Notion (reference image).

Contents

Task title

Status

Owner

Expected time

Actual time

Description

Comments (optional, v2)

Modal is read/write.

Page 2: Progress Tracking (Leader-only)
Purpose

High-level workload and execution visibility.
Not for daily execution.

Layout

Full-page table view

Columns

Employee name

Tasks today

Total expected time

Total actual time

Speed indicator (actual vs expected)

No charts by default.

Interaction

Click employee row → opens modal

Modal shows:

The same task table view that employee sees

Read-only

Optional mini calendar preview

Page 3: Settings

Full-page

Placeholder acceptable for v1

Future:

Work hours

Time unit granularity

Permissions

Core Interactions (Non-negotiable)

Tasks are draggable into calendar

Calendar placement auto-adjusts task duration

Task expected time ↔ calendar block height stay synced

Tasks and calendar are two views of the same data

Explicitly Out of Scope (v1)

Kanban boards

OKRs

Chat

Analytics dashboards

Gamification

Monthly views

UX Principles

Execution-first

Symmetry between tasks and time

No permanent UI that steals width

Leader visibility without micromanagement