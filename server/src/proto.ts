'use strict';

import { RequestType } from 'vscode-jsonrpc';
import * as vscode from 'vscode-languageserver-types';

export interface FStarSettings {
	binPath: string;
}

export interface FStarParams {
  uri: string;
}

export interface FailValue {
  message: string;
  range?: vscode.Range;
  sentence: vscode.Range;
}

export type FocusPosition = {focus: vscode.Position};
export type NotRunningResult = {type: 'not-running'} & {reason: "not-started"|"spawn-failed", coqtop?: string};
export type BusyResult = {type: 'busy'};
export type NoProofResult = {type: 'no-proof'};
export type FailureResult = FailValue & {type: 'failure'};
export type ProofViewResult = {type: 'proof-view'};
export type InterruptedResult = vscode.Range & {type: 'interrupted'};
export type CommandResult =
  NotRunningResult |
  BusyResult |
  (FailureResult & FocusPosition) |
  (ProofViewResult & FocusPosition) |
  (InterruptedResult & FocusPosition) |
  (NoProofResult & FocusPosition);

export type GoalResult =
  NoProofResult |
  NotRunningResult |
  BusyResult |
  FailureResult |
  ProofViewResult |
  InterruptedResult;


export namespace StepForwardRequest {
	export const type = new RequestType<FStarParams, CommandResult, void, void>('fstar/stepForward');
}