import { AxiError, exitCodeForError } from "./errors.js";
import {
  installSessionStartHooks,
  shouldInstallHooksForNodeAxiExecPath,
} from "./hooks.js";
import {
  homeHeaderOutput,
  renderError,
  renderOutput,
  type AxiRenderable,
  type AxiStructuredOutput,
} from "./output.js";

type MaybePromise<T> = T | Promise<T>;

export type AxiCliCommand<TContext> = (
  args: string[],
  context: TContext,
) => MaybePromise<AxiRenderable>;

export interface AxiCliResolved<TContext> {
  argv: string[];
  context: TContext;
}

export interface AxiCliHookOptions {
  marker?: string;
  execPath?: string;
  homeDir?: string;
  timeoutSeconds?: number;
  binaryNames?: string[];
  distEntrypoints?: string[];
  shouldInstall?: (execPath: string) => boolean;
  onError?: (message: string) => void;
}

export interface AxiCliOptions<TContext = undefined> {
  argv?: string[];
  description: string;
  topLevelHelp: string;
  commands: Record<string, AxiCliCommand<TContext>>;
  home: AxiCliCommand<TContext>;
  hooks?: false | AxiCliHookOptions;
  getCommandHelp?: (command: string) => string | null | undefined;
  initialize?: () => void;
  resolve?: (argv: string[]) => AxiCliResolved<TContext>;
  stdout?: { write: (chunk: string) => unknown };
  renderUnknownCommand?: (command: string) => string;
  formatError?: (error: unknown) => { output: string; exitCode: number };
}

function defaultFormatError(error: unknown): {
  output: string;
  exitCode: number;
} {
  if (error instanceof AxiError) {
    return {
      output: `${renderError(error.message, error.code, error.suggestions)}\n`,
      exitCode: exitCodeForError(error),
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    output: `${renderError(message, "UNKNOWN")}\n`,
    exitCode: 1,
  };
}

function defaultUnknownCommand(command: string): string {
  return `${renderError(`Unknown command: ${command}`, "VALIDATION_ERROR", [
    "Run `--help` to see available commands",
  ])}\n`;
}

export async function runAxiCli<TContext = undefined>(
  options: AxiCliOptions<TContext>,
): Promise<void> {
  installHooks(options.hooks);
  options.initialize?.();

  const stdout = options.stdout ?? process.stdout;
  const argv = options.argv ?? process.argv.slice(2);
  const resolved = options.resolve
    ? options.resolve([...argv])
    : ({ argv: [...argv], context: undefined } as AxiCliResolved<TContext>);
  const args = [...resolved.argv];
  const context = resolved.context;

  if (args.includes("--help") && args.length === 1) {
    stdout.write(options.topLevelHelp);
    return;
  }

  const command = args[0];
  if (!command) {
    if (args.includes("--help")) {
      stdout.write(options.topLevelHelp);
      return;
    }

    await runHandler(
      options.home,
      args.slice(1),
      context,
      stdout,
      options,
      true,
    );
    return;
  }

  if (args.includes("--help")) {
    const help = options.getCommandHelp?.(command);
    if (help) {
      stdout.write(help);
      return;
    }
  }

  const handler = options.commands[command];
  if (!handler) {
    stdout.write(
      (options.renderUnknownCommand ?? defaultUnknownCommand)(command),
    );
    process.exitCode = 2;
    return;
  }

  await runHandler(handler, args.slice(1), context, stdout, options, false);
}

async function runHandler<TContext>(
  handler: AxiCliCommand<TContext>,
  args: string[],
  context: TContext,
  stdout: { write: (chunk: string) => unknown },
  options: AxiCliOptions<TContext>,
  isHomeView: boolean,
): Promise<void> {
  try {
    const output = await handler(args, context);
    stdout.write(`${renderCommandOutput(output, options, isHomeView)}\n`);
  } catch (error) {
    const formatted = (options.formatError ?? defaultFormatError)(error);
    stdout.write(formatted.output);
    process.exitCode = formatted.exitCode;
  }
}

function installHooks(options: false | AxiCliHookOptions | undefined): void {
  if (options === false) {
    return;
  }

  if (!options) {
    options = {};
  }

  const inferred = inferHookOptions(options.execPath ?? process.argv[1]);
  if (!inferred) {
    return;
  }

  const marker = options.marker ?? inferred.marker;

  installSessionStartHooks({
    marker,
    execPath: options.execPath ?? inferred.execPath,
    homeDir: options.homeDir,
    timeoutSeconds: options.timeoutSeconds,
    shouldInstall:
      options.shouldInstall ??
      buildHookInstallPolicy(marker, options, inferred),
    onError: options.onError,
  });
}

function buildHookInstallPolicy(
  marker: string,
  options: AxiCliHookOptions,
  inferred: InferredHookOptions,
): ((execPath: string) => boolean) | undefined {
  const binaryNames = options.binaryNames ?? inferred.binaryNames;
  const distEntrypoints = options.distEntrypoints ?? inferred.distEntrypoints;

  return (execPath: string) =>
    shouldInstallHooksForNodeAxiExecPath(execPath, {
      marker,
      binaryNames,
      distEntrypoints,
    });
}

interface InferredHookOptions {
  execPath: string;
  marker: string;
  binaryNames: string[];
  distEntrypoints: string[];
}

function inferHookOptions(
  execPath: string | undefined,
): InferredHookOptions | undefined {
  if (!execPath) {
    return undefined;
  }

  const normalized = execPath.replaceAll("\\", "/");
  const match = normalized.match(/(?:^|\/)dist\/bin\/([^/]+)\.js$/);
  if (match?.[1]) {
    const marker = match[1];
    return {
      execPath,
      marker,
      binaryNames: [marker],
      distEntrypoints: [`dist/bin/${marker}.js`],
    };
  }

  const fileName = normalized.split("/").pop() ?? "";
  if (!fileName || fileName.includes(".") || fileName === "node") {
    return undefined;
  }

  return {
    execPath,
    marker: fileName,
    binaryNames: [fileName],
    distEntrypoints: [`dist/bin/${fileName}.js`],
  };
}

function renderCommandOutput<TContext>(
  output: AxiRenderable,
  options: AxiCliOptions<TContext>,
  isHomeView: boolean,
): string {
  if (!isHomeView) {
    return renderOutput(output);
  }

  const header = homeHeaderOutput({ description: options.description });

  if (typeof output === "string") {
    return `${renderOutput(header)}\n${output}`;
  }

  return renderOutput(mergeHomeHeader(header, output));
}

function mergeHomeHeader(
  header: AxiStructuredOutput,
  output: AxiStructuredOutput,
): AxiStructuredOutput {
  const rest = { ...output };
  delete rest.bin;
  delete rest.description;

  return {
    ...header,
    ...rest,
  };
}
