import * as vscode from 'vscode';
import {
  LanguageClientOptions,
  ServerOptions,
  LanguageClient
} from 'vscode-languageclient';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
/**
 * Method to get workspace configuration option
 * @param option name of the option (e.g. for fstar.path should be path)
 * @param defaultValue default value to return if option is not set
 */
function getConfig<T>(option: string, defaultValue?: any): T {
  const config = vscode.workspace.getConfiguration('vsfstar');
  return config.get<T>(option, defaultValue);
}

// Support for hacking on the F* compiler is built-in
function includeArgsForCompilerHacking(rootPath: string): string[] {
  const srcDir = path.join(rootPath, 'src');
  const srcExcludes = ['.cache.boot', 'VS', 'ocaml-output', 'tests'];
  const isDir = (source: fs.PathLike) => fs.lstatSync(source).isDirectory();
  const args = fs.readdirSync(srcDir)
                 .filter(name => srcExcludes.indexOf(name) === -1)
                 .map(name => path.join(srcDir, name))
                 .filter(isDir)
                 .map(dir => ['--include', dir]);
  return [].concat.apply(['--MLish'], args);
}

export function activate(context: vscode.ExtensionContext) {
  let includeArgs: string[] = [];
  let docSel: { scheme: string; language: string; }[] = [];
  try {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const output = execSync('git rev-list --max-parents=0 @',
                            {cwd: rootPath}).toString();
    // Identify FStar.git using the SHA1 of the very first commit
    if (output.startsWith('05758a0e58a1e')) {
      includeArgs = includeArgsForCompilerHacking(rootPath);
      docSel = [{ scheme: 'file', language: 'fsharp' }];
    }
  } catch(_) {}

  const serverOptions: ServerOptions = {
    command: getConfig<string>('path'),
    args: ['--lsp'].concat(includeArgs)
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'fstar' }].concat(docSel)
  };

  const fstarClient = new LanguageClient('vsfstar', 'F* Language Server', serverOptions, clientOptions);

  console.log('F* Language Server is now active!');
  context.subscriptions.push(fstarClient.start());

  // An empty place holder for the activate command, otherwise we'll get an
  // "command is not registered" error.
  context.subscriptions.push(vscode.commands.registerCommand(
    'vsfstar.activate', async () => { }));
}