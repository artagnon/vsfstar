# vsfstar

A [Visual Studio Code](https://code.visualstudio.com) extension for F\*, with support for hacking on the F\* compiler baked in. Uses the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/overview) to provide the following features:

- [x] Syntax highlighting forked from [vscode-language-fstar](https://github.com/Supernerd11/vscode-language-fstar)
- [x] Lax-check entire file on open
- [x] Diagnostic reporting, with location information
- [x] Lax-check entire file on save
- [x] Go to definition
- [x] Hover information: type and documentation
- [x] Auto-complete
- [ ] Custom include paths
- [ ] Interactively stepping through proofs

Requires [Z3 4.8.5](https://github.com/Z3Prover/z3/releases/tag/Z3-4.8.5) to be installed, and minimum [F\*](https://github.com/FStarLang/FStar) version of 0.9.7. Configure `vsfstar.path` to point to the `fstar.exe` binary you built.

![Demo](https://media.giphy.com/media/LmemFFMyaAu3WHOWph/giphy.gif)
