/**
 * Test all custom agents in .agents/*.ts
 *
 * Verifies each agent definition is loadable and Freebuff-compatible:
 *   - default export is a valid AgentDefinition object
 *   - model is one Freebuff supports
 *   - every tool in toolNames exists in Freebuff's tool set
 *   - every spawnable agent is a Freebuff agent or a sibling local agent
 *   - prompts contain no Codebuff-only tool/store references
 *
 * Run: npx tsx scripts/test-agents.ts
 */
import accessibilityReviewer from "../.agents/accessibility-reviewer";
import buildDoctor from "../.agents/build-doctor";
import contentPricingAuditor from "../.agents/content-pricing-auditor";
import dbSchemaGuardian from "../.agents/db-schema-guardian";
import designConsistencyAuditor from "../.agents/design-consistency-auditor";
import designPolish from "../.agents/design-polish";
import knowledgeMdScribe from "../.agents/knowledge-md-scribe";
import securityHardener from "../.agents/security-hardener";

const agents = [
  accessibilityReviewer,
  buildDoctor,
  contentPricingAuditor,
  dbSchemaGuardian,
  designConsistencyAuditor,
  designPolish,
  knowledgeMdScribe,
  securityHardener,
];

// Freebuff's tool set (mirrors .agents/types/tools.ts ToolName union)
const FREEBUFF_TOOLS = new Set([
  "ask_user",
  "glob",
  "gravity_index",
  "list_directory",
  "read_files",
  "read_subtree",
  "read_url",
  "render_ui",
  "set_output",
  "skill",
  "spawn_agents",
  "str_replace",
  "suggest_followups",
  "write_file",
  "write_todos",
]);

// Freebuff's built-in agents (plus sibling local agents are allowed)
const FREEBUFF_AGENTS = new Set([
  "file-picker",
  "code-searcher",
  "researcher-web",
  "researcher-docs",
  "basher",
  "tmux-cli",
  "browser-use",
  "code-reviewer-deepseek-flash",
  "context-pruner",
]);

// Models Freebuff can serve
const FREEBUFF_MODELS = new Set([
  "deepseek/deepseek-v4-flash",
  "deepseek-v4-flash",
]);

// Codebuff-only constructs that must NOT appear anywhere
const CODEX_ONLY = ["code_search", "run_terminal_command", "end_turn", "codebuff/"];

const siblingIds = new Set(agents.map((a: any) => a?.id).filter(Boolean));

let allPass = true;
let passed = 0;

for (const a of agents) {
  const issues: string[] = [];

  if (!a || typeof a !== "object") {
    issues.push("definition is not an object");
  } else {
    if (!a.id || typeof a.id !== "string") issues.push("missing id");
    if (!a.displayName || typeof a.displayName !== "string")
      issues.push("missing displayName");
    if (!a.model || typeof a.model !== "string") issues.push("missing model");
    else if (!FREEBUFF_MODELS.has(a.model))
      issues.push(`unsupported model '${a.model}'`);

    for (const t of a.toolNames ?? []) {
      if (!FREEBUFF_TOOLS.has(t)) issues.push(`unknown tool '${t}'`);
    }

    for (const s of a.spawnableAgents ?? []) {
      if (!FREEBUFF_AGENTS.has(s) && !siblingIds.has(s))
        issues.push(`unknown spawnable agent '${s}'`);
    }

    const prompts = [
      a.spawnerPrompt,
      a.systemPrompt,
      a.instructionsPrompt,
      a.stepPrompt,
    ]
      .filter(Boolean)
      .join("\n");
    for (const c of CODEX_ONLY) {
      if (prompts.includes(c)) issues.push(`prompt references Codebuff-only '${c}'`);
    }
  }

  if (issues.length === 0) {
    console.log(`PASS  ${a.id} — ${a.displayName}`);
    passed++;
  } else {
    allPass = false;
    console.log(`FAIL  ${a?.id ?? "?"} — ${issues.join("; ")}`);
  }
}

console.log(`\n${passed}/${agents.length} agents passed.`);
if (allPass) {
  console.log("All custom agents are loadable and Freebuff-compatible.");
} else {
  console.log("Fix the failures above before opening the project in Freebuff.");
  process.exit(1);
}
