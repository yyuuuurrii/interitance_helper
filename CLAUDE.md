# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js voice chat application called "Carepost Voice Chat LLM" that provides real-time voice conversations using OpenAI's Realtime API. The app is designed as a care communication tool with predefined conversation templates for various care scenarios (meal delivery, waste collection, nursing visits, etc.).

**Key Architecture:**
- Built on Next.js 14 with TypeScript and Tailwind CSS
- Uses OpenAI Realtime API Beta for voice conversations  
- Includes custom audio tools (WavRecorder, WavStreamPlayer) for voice I/O
- Predefined conversation prompts stored in `/src/lib/config.ts`
- Static export configuration for GitHub Pages deployment

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production (static export)
npm run build

# Lint the codebase
npm run lint
```

## Application Structure

**Main Components:**
- `src/app/page.tsx` - Main application with voice chat logic and OpenAI Realtime API integration
- `src/components/conversation-card.tsx` - Displays real-time conversation transcript
- `src/components/api-key-card.tsx` - Manages OpenAI API key storage in localStorage
- `src/lib/config.ts` - Contains all conversation prompts/instructions for different care scenarios

**Audio System:**
- `src/lib/wavtools/` - Custom audio processing library
- Uses 24kHz sample rate for both recording and playback
- Handles real-time audio streaming with OpenAI's API

**Care Conversation Templates:**
The application includes 8 predefined conversation scenarios:
1. Evening meal delivery notifications
2. Lunch meal delivery notifications  
3. Non-burnable waste collection reminders
4. Burnable waste collection reminders
5. Nursing visit day-before notifications
6. Nursing visit same-day notifications
7. Meal pickup notifications
8. Mahjong event notifications

## Key Technical Details

- API key is stored in browser localStorage with key `tmp::OPENAI_API_KEY`
- Uses OpenAI Realtime API Beta with custom fork supporting new voices
- Voice conversations use server-side VAD (Voice Activity Detection)
- All conversations start with a Japanese greeting "もしもし" to initiate the chat
- Conversation transcripts are displayed in real-time with role-based styling

## UI Framework

- Uses shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom component variants
- Responsive grid layout with conversation display and control panels