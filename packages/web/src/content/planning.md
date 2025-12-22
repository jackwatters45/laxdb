# Lax DB - Project Planning

## TODO

- [x] commits
- [ ] individual player page
- [ ] probably move players individual pages away from teams
- [ ] filters need an apply button (or do i even want them to have one?)
- [ ] root players page (make sure to add team filter)
- [ ] add fields - if no field set for team some specific stuff ie position
- [ ] select loading state
- [ ] games
- [ ] coaches
- [ ] teams page
- [x] org switcher..
- [ ] org + team invites + joins
- [ ] sidebar subpages/dropdown

## Dreams

- I kind of want to add livestore with cloudflare???

## Overview

Lax DB aims to better equip lacrosse players with modern tools and features to enhance their game performance and overall experience. The platform will provide a comprehensive suite of tools for players, coaches, and teams to optimize their gameplay, improve communication, and streamline administrative tasks.

## Current Status

### 🚧 In Progress

- **Team Management**: Team creation, roster management, coaching staff organization
- **Organization Management**: Multi-team organization structure and administration
- **Player Management**: Individual player profiles, development tracking, goal setting
- **Game Management System**: Game scheduling, roster management, and game tracking

### 📋 Planned Features

#### Features with Mock UI (Ready for Development)

- **Playbook Management**: Digital playbook with play creation, categorization, and assignments
- **Scouting System**: Opponent team analysis, scouting reports, and strategic insights
- **Practice Planning**: Drill bank, practice templates, session management, and scheduling
- **Game Film Integration**: Upload/link game footage with timestamped events
- **Advanced Statistics**: Shot charts, possession analytics, player performance metrics
- **Game Reports**: Automated post-game analysis and player evaluations
- **Overall Calendar System**: Unified calendar for club access to view practices, games, and team events

#### Future Features (Not Started)

- **Whiteboard**: Digital whiteboard for play drawing and strategy sessions
- **AI Film Analysis**: Automated game film evaluation and insights
- **Learning Management**: Rules & strategy library, video tutorials, quizzes
- **Recruitment Tools**: Player highlight reels, college recruiting profiles, showcase tracking
- **Mobile App**: Offline capability, GPS integration, camera integration, fitness tracker sync

#### Small Features

- **Export Table Contents**: Export table contents to CSV or Excel format. Export entire table contents or use bulk edit to control exported rows.
- **Table Views**
- **Table Column + Rows Dragging**
- **Table Column Resizing**

### ✅ Completed Features

#### Core Platform

- [x] **Database Layer**: Drizzle ORM with PostgreSQL
- [x] **Authentication**: Better Auth with Google OAuth
- [x] **Redis Integration**: Effect-based Redis service for caching
- [x] **Frontend**: TanStack Router with React 19
- [x] **Styling**: Tailwind CSS with custom design system

---

## Technical Architecture

### Backend Stack

- **Database**: PostgreSQL with Drizzle ORM (would eventually like to switch to Planetscale Postgres)
- **Cache**: Redis with Effect service
- **Auth**: Better Auth with Google OAuth
- **Payments**: Polar.sh with Better Auth plugin
- **Language**: TypeScript with Effect library

### Frontend Stack

- **Framework**: React 19 with TanStack Start
- **Styling**: Tailwind CSS with Typography plugin
- **State Management**: Effect for business logic
- **Build Tool**: Vite

### Infrastructure

- **Cloud Provider**: AWS

### Planned Additions

- **Zero Sync Engine**: Add Zero DB sync engine for faster data synchronization
- **Logs**: Cloudwatch
- **API**: Honojs Api
- **Mobile**: Expo for Mobile

---

_Last updated: September 20, 2025_

_This document is living and will be updated regularly as the project evolves._
