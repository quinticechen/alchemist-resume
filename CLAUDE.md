# resume-matchmaker-helper

Resume matching and job fit analysis tool.

## Stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth, database)
- Package manager: Bun

## Start
```bash
bun run dev
```

## Project Structure
```
src/
├── components/     ← UI components
├── pages/          ← Route-level pages
├── hooks/          ← Custom React hooks
├── lib/            ← Utilities and Supabase client
├── integrations/   ← Supabase generated types
└── types/          ← Shared TypeScript types
```

## Key Rules
- Read `../ai-agent/.claude/rules/typescript.md` before making code changes
- Never touch `supabase/migrations/` without user confirmation
- Check `src/components/ui/` for existing shadcn/ui components first
- Run `bun run build` to verify no TypeScript errors after changes
