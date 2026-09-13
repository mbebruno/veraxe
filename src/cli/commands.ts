import { generateText, getDefaultModel } from "../clients/groq.js";
import { search } from "../clients/tavily.js";
import { publishPost } from "../clients/linkedin.js";
import { bold, cyan, green, red, yellow } from "../utils/colors.js";
import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";

export type Command =
  | { name: "generate"; topic: string; tone: string }
  | { name: "search"; query: string }
  | { name: "post"; content: string }
  | { name: "init" }
  | { name: "help" };

export function parseArgs(args: string[]): Command {
  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    return { name: "help" };
  }

  const [cmd, ...rest] = args;

  switch (cmd) {
    case "init":
      return { name: "init" };
    case "search": {
      if (rest.length === 0) {
        console.error(red("Usage: veraxe search <query>"));
        process.exit(1);
      }
      return { name: "search", query: rest.join(" ") };
    }
    case "post": {
      if (rest.length === 0) {
        console.error(red("Usage: veraxe post <content>"));
        process.exit(1);
      }
      return { name: "post", content: rest.join(" ") };
    }
    case "generate": {
      if (rest.length === 0) {
        console.error(red("Usage: veraxe generate <topic> [--tone <tone>]"));
        process.exit(1);
      }
      const topic = rest[0];
      const toneIdx = rest.indexOf("--tone");
      const tone = toneIdx !== -1 && rest[toneIdx + 1] ? rest[toneIdx + 1] : "professionnel";
      return { name: "generate", topic, tone };
    }
    default:
      console.error(red(`Commande inconnue: "${cmd}". Lance "veraxe help".`));
      process.exit(1);
      throw new Error("unreachable");
  }
}

function buildSystemPrompt(tone: string): string {
  return `Tu es Veraxe, assistant IA spécialisé dans la création de publications LinkedIn percutantes pour les développeurs et entrepreneurs tech.

Objectif : générer un post LinkedIn qui :
- Accroche l'attention dans les 2 premières lignes (hook)
- Montre l'expertise technique de l'auteur
- Est dans un ton "${tone}"
- Mentionne la stack : Bun, TypeScript, Groq, Tavily
- Finit par un appel à l'action (visite du repo GitHub, échange, etc.)
- Est d'environ 150-300 mots

Format de sortie (markdown, sans métadonnées) :

# Hook accrocheur (1 ligne)

Paragraphe 1 — contexte / problème

Paragraphe 2 — solution / ce qui a été fait

Paragraphe 3 — résultats / enseignements

Conclusion + CTA (appel à l'action)

🔗 GitHub : github.com/<utilisateur>/veraxe
`;
}

export async function runCommand(cmd: Command): Promise<void> {
  switch (cmd.name) {
    case "help":
      printHelp();
      break;
    case "init":
      await runInit();
      break;
    case "search": {
      console.log(`\n${cyan("Recherche Tavily: ")}${cmd.query}`);
      console.log(yellow("-".repeat(50)));
      const results = await search({ query: cmd.query, search_depth: "basic", max_results: 5, include_answer: true });

      if (results.answer) {
        console.log(`\n${bold("Réponse consolidée:")}\n${results.answer}\n`);
      }

      console.log(`\n${bold(`Résultats (${results.results.length}):`)}`);
      for (const r of results.results) {
        console.log(`\n  ${yellow("•")} ${bold(r.title)}`);
        console.log(`    ${r.url}`);
        console.log(`    ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`);
      }
      console.log(`\n${yellow(`Temps: ${results.response_time.toFixed(2)}s`)}`);
      break;
    }
    case "generate": {
      console.log(`\n${cyan("Génération de post LinkedIn")}`);
      console.log(`   Sujet : ${bold(cmd.topic)}`);
      console.log(`   Ton   : ${cmd.tone}`);
      console.log(yellow("-".repeat(50)));

      console.log(`\n${yellow(" Étape 1/2 : recherche web via Tavily...")}`);
      const searchResults = await search({ query: cmd.topic, search_depth: "basic", max_results: 3, include_answer: true });

      const context = searchResults.answer
        ? `Voici un résumé de la recherche web:\n\n${searchResults.answer}\n\nSources:\n${searchResults.results.map(r => `  • ${r.title}: ${r.url}`).join("\n")}`
        : `Pas de réponse consolidée. Voici les résultats bruts:\n${searchResults.results.map(r => `  • ${r.title}: ${r.url}\n    ${r.content.slice(0, 250)}`).join("\n\n")}`;

      console.log(`${yellow(" Étape 2/2 : génération du post via Groq...")}`);
      const systemPrompt = buildSystemPrompt(cmd.tone);
      const userPrompt = `Sujet: ${cmd.topic}\n\nContexte de recherche:\n${context}\n\nGénère le post LinkedIn selon les instructions du système.`;

      const postContent = await generateText(systemPrompt, userPrompt);

      console.log(`\n${green("Post généré:")}\n`);
      console.log(postContent);

      const rl = createInterface({ input, output });
      const answer = await new Promise<string>((resolve) =>
        rl.question(`\n${cyan("Publier sur LinkedIn maintenant? (y/N): ")}, resolve`),
      );
      rl.close();

      if (answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes") {
        const result = await publishPost(postContent);
        if (result.success) {
          console.log(`\n${green("Published!")}${result.message}`);
          if (result.url) console.log(`   ${cyan("Link: ")} ${result.url}`);
        } else {
          console.log(`\n${red("Issue: ")}${result.message}`);
        }
      } else {
        console.log(`\n${cyan("Post disponible ci-dessus. Copie-le ou relance avec auto-publish.")}`);
      }
      break;
    }
    case "post": {
      console.log(`\n${cyan("Publication LinkedIn")}`);
      const result = await publishPost(cmd.content);
      if (result.success) {
        console.log(`\n${green("OK: ")}${result.message}`);
        if (result.url) console.log(`   ${cyan("Link: ")} ${result.url}`);
        if (result.postId) console.log(`   ${cyan("ID: ")} ${result.postId}`);
      } else {
        console.log(`\n${red("Issue: ")}${result.message}`);
      }
      break;
    }
  }
}

function printHelp() {
  console.log(`
${bold("Veraxe — Agent IA CLI")}
${cyan("Stack : Bun + TypeScript + Groq + Tavily")}

${bold("Usage")}
  veraxe <commande> [options]

${bold("Commandes")}

  ${cyan("generate")} <topic> [--tone <tone>]
      Recherche le sujet via Tavily, génère un post LinkedIn via Groq.
      --tone: professionnel (défaut), technique, humoristique, inspirant

  ${cyan("search")} <query>
      Lance une recherche Tavily et affiche les résultats.

  ${cyan("post")} <content>
      Publie (ou prépare) un contenu sur LinkedIn.

  ${cyan("init")}
      Crée le fichier .env avec les clés API vides — à remplir.

  ${cyan("help")}
      Affiche cette aide.

${bold("Exemples")}
  veraxe generate "Agent IA autonome avec Bun et Groq" --tone technique
  veraxe search "trends IA agents 2025"
  veraxe post "Salut LinkedIn, j'ai build un agent IA..."

${bold("Setup")}
  bun install
  cp .env.example .env   # puis éditer avec vos clés
`);
}

async function runInit(): Promise<void> {
  const envPath = ".env";
  const exists = await Bun.file(envPath).exists();

  if (exists) {
    const rl = createInterface({ input, output });
    const answer = await new Promise<string>((resolve) =>
      rl.question(`${yellow("Fichier .env existe déjà. Écraser? (o/N): ")}, resolve`),
    );
    rl.close();
    if (answer.trim().toLowerCase() !== "o") {
      console.log("Annulé.");
      return;
    }
  }

  const content = `# Veraxe — Configuration API
# Obtenez vos clés:
#   - Groq: https://console.groq.com/keys
#   - Tavily: https://app.tavily.com/
#   - LinkedIn (optionnel pour auto-post): https://developer.linkedin.com/

GROQ_API_KEY=
TAVILY_API_KEY=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_OWNER_UID=
`;

  await Bun.write(envPath, content);
  console.log(green(`Fichier .env créé. Renseignez vos clés API.`));
}
