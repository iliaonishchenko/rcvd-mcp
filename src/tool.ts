// The name, description, and per-property docs below are the AF5-critical copy:
// they are what an MCP host (Claude, Cursor, …) reads to decide whether and how
// to call this tool, with no system-prompt help. Every word is load-bearing.
// The JSON Schema is hand-authored (not derived from Zod) precisely so these
// descriptions are reviewed in source, not generated. tests/tool.test.ts guards
// the contract (required fields, bounds, anti-patterns).

export interface ToolJsonSchemaProperty {
  type: string;
  description?: string;
  enum?: readonly string[];
  items?: ToolJsonSchemaProperty;
  minItems?: number;
  maxLength?: number;
  minLength?: number;
  additionalProperties?: boolean | ToolJsonSchemaProperty;
}

export interface ToolJsonSchema {
  type: "object";
  properties: Record<string, ToolJsonSchemaProperty>;
  required: readonly string[];
  additionalProperties: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolJsonSchema;
}

export const sendNotificationTool: ToolDefinition = {
  name: "send_notification",
  description:
    "Send a push notification to the user out-of-band — they will receive it on their phone via Telegram, not in this conversation. When a substantial task FINISHES, the user is likely away from the terminal, so proactively notify them with the outcome — you do NOT need to have been asked first. Use this when:\n" +
    "- a substantial or long-running task has just finished and you have the result in hand (test suite, build, deploy, migration, training run, data import, a multi-step or multi-file change you were carrying out) — send a completion ping by default, whether or not the user explicitly asked;\n" +
    "- a task you were running needs human attention to continue (waiting for input, ambiguous error, credential prompt);\n" +
    "- the user explicitly asked to be pinged, paged, or notified about an event;\n" +
    "- something the user cares about has failed and they are likely not watching the terminal.\n\n" +
    "Notify on COMPLETION, not on kickoff. Do NOT notify when you have merely started, dispatched, or handed off work that will finish later (e.g. 'kicked off a remote run, standing by', 'the build is now running', 'the agent will open a PR when done') — wait until it actually finishes and you can report the result, then ping. Do NOT notify for status updates, acknowledgements, hand-offs, or 'nothing to do on my end' messages. Do NOT notify for trivial turns: quick questions, one-line answers, small single edits, or anything the user is plainly watching happen in real time — that is just noise on their phone. Reserve it for work substantial enough that the user probably stepped away. And do NOT use this tool to reply to the user in the current chat — for that, just answer normally. This tool reaches the user when they are away from the screen.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description:
          "The notification body. Plain text, up to 4096 characters. Write what a human glancing at their phone needs to know: outcome first, details second. Examples: 'Build finished: 127 passed, 3 failed.' / 'Deploy succeeded.' / 'Tests are waiting on you — credential prompt in pytest.'",
        minLength: 1,
        maxLength: 4096,
      },
      priority: {
        type: "string",
        enum: ["info", "normal", "needs_attention", "done"],
        description:
          "How the notification should feel to the user. Pick based on intent, not display: " +
          "'info' = ambient FYI, the user does not need to act (e.g. 'Hourly summary ready'). " +
          "'normal' = default; useful to know but not urgent. " +
          "'needs_attention' = the user must act soon — a task is blocked, a deploy is failing, a credential is needed. " +
          "'done' = a task the user was waiting on has completed successfully (build green, tests passed, deploy live). " +
          "If unsure between 'normal' and 'done', and the task completed successfully, prefer 'done'.",
      },
      title: {
        type: "string",
        description:
          "Optional short title (up to 100 characters), shown above the body. Use when the body alone is ambiguous — e.g. title 'CI: my-repo', body '127 passed, 3 failed.' Omit when the body is self-contained.",
        minLength: 1,
        maxLength: 100,
      },
      channels: {
        type: "array",
        description:
          "Optional list of channel types to deliver to. Omit to use all channels the user has linked. Currently only 'telegram' is supported; including any other value will be rejected by the server.",
        items: { type: "string", minLength: 1 },
        minItems: 1,
      },
      metadata: {
        type: "object",
        description:
          "Optional arbitrary JSON metadata (up to 4 KB serialized). Useful for correlation — e.g. { 'run_id': 'abc123', 'commit': '...' }. Not shown to the user.",
        additionalProperties: true,
      },
    },
    required: ["text"],
    additionalProperties: false,
  },
} as const;
