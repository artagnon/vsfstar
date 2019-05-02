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
export type NotRunningTag = {type: 'not-running'};
export type NoProofTag = {type: 'no-proof'};
export type FailureTag = {type: 'failure'};
export type ProofViewTag = {type: 'proof-view'};
export type InterruptedTag = {type: 'interrupted'};
export type BusyTag = {type: 'busy'};
export type NotRunningResult = NotRunningTag & {reason: "not-started"|"spawn-failed", coqtop?: string};
export type BusyResult = BusyTag;
export type NoProofResult = NoProofTag;
export type FailureResult = FailValue & FailureTag;
export type ProofViewResult = ProofViewTag;
export type InterruptedResult = vscode.Range & InterruptedTag;
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