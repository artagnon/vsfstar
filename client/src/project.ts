'use strict';

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  ServerOptions,
  TransportKind,
  LanguageClientOptions
} from 'vscode-languageclient';

export class FStarProject implements vscode.Disposable {
  private static instance: FStarProject|null = null;
  private static langClient: LanguageClient|null = null;
  private activeDoc : vscode.TextDocument|null = null;
  private documents = new Map<string, vscode.TextDocument>();
  private activeEditor : vscode.TextEditor|null = null;

  private constructor(context: vscode.ExtensionContext) {
    // The server is implemented in node
    let serverModule = context.asAbsolutePath(
      path.join('server', 'out', 'server.js')
    );
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions
      }
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      // Register the server for F* documents
      documentSelector: [{ scheme: 'file', language: 'fstar' }],
      synchronize: {
        // Notify the server about file changes to '.clientrc files contained in the workspace
        fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
      }
    };

    // Create the language client and start the client.
    FStarProject.langClient = new LanguageClient(
      'FStarServer',
      'F* Server',
      serverOptions,
      clientOptions
    );

    vscode.workspace.onDidChangeTextDocument((params) =>
    this.onDidChangeTextDocument(params));
    vscode.workspace.onDidOpenTextDocument((params) =>
    this.onDidOpenTextDocument(params));
    vscode.workspace.onDidCloseTextDocument((params) =>
    this.onDidCloseTextDocument(params));
    vscode.window.onDidChangeActiveTextEditor((params) =>
    this.onDidChangeActiveTextEditor(params));
    // Handle already-loaded documents
    vscode.workspace.textDocuments.forEach((textDoc) =>
    this.tryLoadDocument(textDoc));


  	// Start the client. This will also launch the server
	  FStarProject.langClient.start();
  }

  public static create(context: vscode.ExtensionContext) {
    if (!FStarProject.instance) {
      FStarProject.instance = new FStarProject(context);
    }
    return FStarProject.instance;
  }

  public getActiveDoc(this: FStarProject) : vscode.TextDocument|null {
    return this.activeDoc;
  }

  public dispose() {
    FStarProject.langClient.stop();
  }

  private onDidChangeTextDocument(params: vscode.TextDocumentChangeEvent) {
    const uri = params.document.uri.toString();
    const doc = this.documents.get(uri);
    if (!doc) {
      return;
    }
  }

  private onDidOpenTextDocument(doc: vscode.TextDocument) {
    this.tryLoadDocument(doc);
  }

  private onDidCloseTextDocument(doc: vscode.TextDocument) {
    const uri = doc.uri.toString();
    const fstarDoc = this.documents.get(uri);
    this.documents.delete(uri);
    if (!fstarDoc) {
      return;
    }
  }

  private tryLoadDocument(textDoc: vscode.TextDocument) {
    if (textDoc.languageId !== 'fstar') {
      return;
    }
    const uri = textDoc.uri.toString();
    if (!this.documents.has(uri)) {
      this.documents.set(uri, textDoc);
    }

    // refresh this in case the loaded document has focus and it was not in our registry
    if (this.documents.has(vscode.window.activeTextEditor.document.uri.toString())) {
      this.activeDoc = this.documents.get(vscode.window.activeTextEditor.document.uri.toString()) || null;
    }
  }

  private onDidChangeActiveTextEditor(editor: vscode.TextEditor) {
    if (!this.activeEditor) {
      return;
    }
    let oldUri : string|null;
    try {
      oldUri = this.activeEditor.document.uri.toString();
    } catch(err) {
      oldUri = null;
    }
    if (!editor) {
      return;
    }

    // newly active editor
    const uri = editor.document ? editor.document.uri.toString() : null;
    if (uri) {
      const doc = this.documents.get(uri) || this.tryLoadDocument(editor.document);
      if (doc) {
        this.activeDoc = doc;
      }
    }
    this.activeEditor = editor;
  }
}