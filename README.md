# Veraxe — Agent IA CLI
**Bun + TypeScript + Groq + Tavily**

> Génère et publie du contenu LinkedIn stratégique pour visibilité et contrats potentiels.

## Stack

| Outil       | Rôle                                           |
|-------------|------------------------------------------------|
| **Bun**     | Runtime JS/TS — exécution native ultra-rapide  |
| **TypeScript** | Typage fort, maintenable, IDE-friendly      |
| **Groq**    | Inférence LLM ultra-rapide (Llama 3.1, Mixtral…) |
| **Tavily**  | Recherche web AI-native : extraction, résumé   |

## Setup

```bash
cd veraxe
bun install          # aucune dépendance externe — fetch natif Bun
cp .env.example .env # puis remplir avec vos clés API
```

## Usage

```bash
# Aide
bun run src/index.ts help

# Générer un post LinkedIn (Tavily → Groq → affiche le post)
bun run src/index.ts generate "Agent IA autonome avec Bun et Groq" --tone technique

# Recherche web via Tavily
bun run src/index.ts search "tendances IA agents 2025"

# Publier un contenu sur LinkedIn (ou préparation si non configuré)
bun run src/index.ts post "Salut LinkedIn, j'ai build un agent IA..."

# Initialisation du projet
bun run src/index.ts init
```

## Clés API requises

| Clé                  | Où l'obtenir                            |
|----------------------|-----------------------------------------|
| `GROQ_API_KEY`       | https://console.groq.com/keys           |
| `TAVILY_API_KEY`     | https://app.tavily.com/                 |
| `LINKEDIN_ACCESS_TOKEN` | https://developer.linkedin.com/ (optionnel) |

## Architecture du code

```
veraxe/
├── src/
│   ├── index.ts              # Point d'entrée CLI
│   ├── clients/
│   │   ├── groq.ts           # Client Groq (chat completions)
│   │   ├── tavily.ts         # Client Tavily (search)
│   │   └── linkedin.ts       # Client LinkedIn (UGC Posts API)
│   ├── cli/
│   │   └── commands.ts       # Logique CLI (generate, search, post, init)
│   └── utils/
│       └── colors.ts         # Couleurs ANSI terminal
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Roadmap

- [x] Scaffold Bun + TypeScript
- [x] Client Groq (chat completions)
- [x] Client Tavily (search API)
- [x] Client LinkedIn (UGC Posts — publishing)
- [x] CLI generate (Tavily → Groq → post + prompt pour publish)
- [ ] GitHub : repo public, README stratégique, lien dans posts LinkedIn
- [ ] Auto-posting LinkedIn (OAuth flow complet)
- [ ] Build-in-public sur LinkedIn + outreach
