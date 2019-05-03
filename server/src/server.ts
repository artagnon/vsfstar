import {
    createConnection,
    TextDocuments,
    TextDocument,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    DidChangeConfigurationNotification,
    CompletionItem,
    CompletionItemKind,
    TextDocumentPositionParams,
    InitializeResult,
    ServerCapabilities,
    TextDocumentSyncKind,
    DocumentLinkParams,
    Location,
    SymbolInformation,
    DocumentSymbolParams,
    DocumentLink
} from 'vscode-languageserver';

import {FStarSettings} from './proto';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

export let project : FStarProject = null;

connection.onInitialize((params): InitializeResult => {
  connection.console.log(`F* Language Server: process.version: ${process.version}, process.arch: ${process.arch}}`);
  project = new FStarProject(params.rootPath, connection);

  return {
      capabilities: <ServerCapabilities>{
          textDocumentSync: TextDocumentSyncKind.Incremental,
          // Tell the client that the server support code complete
          completionProvider: {
              resolveProvider: true
          },
          documentLinkProvider: {
            resolveProvider: true
          },
          documentSymbolProvider: true,
          definitionProvider: true
      }
  };
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

process.on('SIGBREAK', function () {
  connection.console.log('SIGBREAK fired');
});

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: FStarSettings = { binPath: "/usr/local/bin/fstar" };
let globalSettings: FStarSettings = defaultSettings;

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<FStarSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = <FStarSettings>(
            (change.settings.fstar || defaultSettings)
        );
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<FStarSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'FStarServer'
        });
        documentSettings.set(resource, result);
    }
    return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    // In this simple example we get the settings for every validate run.
    let settings = await getDocumentSettings(textDocument.uri);

    // The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    let pattern = /\b[A-Z]{2,}\b/g;
    let m: RegExpExecArray | null;

    let problems = 0;
    let diagnostics: Diagnostic[] = [];
    while (m = pattern.exec(text)) {
        problems++;
        let diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length)
            },
            message: `${m[0]} is all uppercase.`,
            source: 'ex'
        };
        if (hasDiagnosticRelatedInformationCapability) {
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range)
                    },
                    message: 'Spelling matters'
                }
            ];
        }
        diagnostics.push(diagnostic);
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});

connection.onDefinition((params: TextDocumentPositionParams) : Promise<Location|Location[]>|Location|Location[] => {
  const doc = project.lookup(params.textDocument.uri);
  if (!doc) {
    return [];
  }
  else {
    return doc.provideDefinition(params.position);
  }
});

connection.onDocumentSymbol((params: DocumentSymbolParams) : SymbolInformation[] => {
  const doc = project.lookup(params.textDocument.uri);
  if (!doc) {
    return [];
  }
  else {
    return doc.provideSymbols();
  }
});

connection.onDocumentLinks((p:DocumentLinkParams,token: CancellationToken) : Promise<DocumentLink[]> => Promise.resolve([]));

connection.onDocumentLinkResolve((link: DocumentLink,token: CancellationToken) : DocumentLink => link);

// This handler provides the initial list of the completion items.
connection.onCompletion(
    (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
        // The pass parameter contains the position of the text document in
        // which code complete got requested. For the example we ignore this
        // info and always provide the same completion items.
        return [
            {
                label: 'TypeScript',
                kind: CompletionItemKind.Text,
                data: 1
            },
            {
                label: 'JavaScript',
                kind: CompletionItemKind.Text,
                data: 2
            }
        ];
    }
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
    (item: CompletionItem): CompletionItem => {
        if (item.data === 1) {
            item.detail = 'TypeScript details';
            item.documentation = 'TypeScript documentation';
        } else if (item.data === 2) {
            item.detail = 'JavaScript details';
            item.documentation = 'JavaScript documentation';
        }
        return item;
    }
);

import {RequestType, CancellationToken} from 'vscode-jsonrpc';
import * as proto from './proto';
import {FStarProject} from './project';

connection.onRequest(proto.StepForwardRequest.type, (params: proto.FStarParams, token: CancellationToken) => {
  return project.lookup(params.uri).stepForward(token);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();